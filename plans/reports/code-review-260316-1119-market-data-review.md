# Code Review: Market Data Management System

**Reviewer**: code-reviewer
**Date**: 2026-03-16
**Score**: 6.5 / 10

---

## Scope

- **Files reviewed**: 60+ files across API schema, services, routes, shared types/schemas, frontend pages/components, seed data
- **Total LOC**: ~5,425 (new code)
- **Focus**: Full system review -- schema, API, frontend, shared types

---

## Overall Assessment

Solid architectural foundation with clean separation of concerns, consistent CRUD patterns, and good schema design. However, **three critical runtime bugs** will cause features to fail silently or error in production. Several files exceed the 200-line limit. No Zod validation is applied in any route handler. The AI context builder has N+1 query performance issues.

---

## Critical Issues (Blockers)

### C1. AI Toggle entity type mismatch -- BROKEN FEATURE

**Impact**: Every AI visibility toggle click fails with HTTP 400.

Frontend sends kebab-case entity types (`target-customer`, `customer-journey`, `dining-spot`, `inventory-strategy`, `itinerary-template`). Backend `TABLE_MAP` uses camelCase keys (`targetCustomer`, `customerJourney`, `diningSpot`, `inventoryStrategy`, `itineraryTemplate`).

The Zod schema in `market-property-schemas.ts` uses snake_case (`target_customer`, `customer_journey`). None of these three match each other.

- Frontend: `entityType="target-customer"` (kebab-case)
- Backend TABLE_MAP key: `targetCustomer` (camelCase)
- Zod schema: `target_customer` (snake_case)

**Files**:
- `apps/web/src/components/market-data/ai-visibility-toggle.tsx:22` -- sends PATCH without `aiVisible` in body
- `apps/api/src/modules/market-data/ai-toggle-service.ts:22-37` -- TABLE_MAP uses camelCase
- `packages/shared/src/schemas/market-property-schemas.ts:107-112` -- Zod uses snake_case

**Additional sub-bug**: The frontend `AiVisibilityToggle` component sends `PATCH /ai-toggle/{type}/{id}` with **no request body**. The backend reads `body.aiVisible` which will be `undefined`, making the toggle set `aiVisible = undefined` on every call.

**Fix**: (1) Standardize entity type naming across all three layers. (2) Send `{ aiVisible: !enabled }` in the PATCH body.

### C2. Frontend itinerary items route mismatch -- BROKEN FEATURE

**Impact**: Itinerary item CRUD (add, delete) fails with 404.

Frontend calls:
- `GET /itinerary-templates/:templateId/items`
- `POST /itinerary-templates/:templateId/items`
- `DELETE /itinerary-templates/:templateId/items/:itemId`

Backend registers:
- `GET /itineraries/:templateId/items`
- `PUT /itineraries/:templateId/items` (bulk replace only)

Three mismatches: (a) URL prefix is `/itineraries` not `/itinerary-templates`, (b) no POST endpoint exists for single item creation, (c) no DELETE endpoint exists for single item deletion.

**Files**:
- `apps/web/src/components/market-data/itineraries-tab.tsx:40,47,64`
- `apps/api/src/modules/market-data/market-data-extra-routes.ts:117-132`
- `apps/api/src/routes/index.ts:76`

**Fix**: Either (a) change frontend to use `/itineraries/` and adapt to bulk PUT, or (b) add POST/DELETE endpoints on the backend under the correct path.

### C3. AI Settings page patches by ID but backend expects category string

**Impact**: AI category toggle fails with wrong parameter.

Frontend: `PATCH /ai-data-settings/${setting.id}` (sends UUID)
Backend: `PATCH /ai-data-settings/:category` (expects string like `"markets"`, `"competitors"`)

The `toggleCategory` service function does `WHERE dataCategory = $category`, so passing a UUID finds nothing and creates a junk row.

**Files**:
- `apps/web/src/pages/ai-settings-page.tsx:41`
- `apps/api/src/modules/market-data/market-data-extra-routes.ts:172`

**Fix**: Frontend should send `setting.dataCategory` instead of `setting.id`.

---

## High Priority

### H1. Zero Zod validation in route handlers

No route handler calls `.parse()` or `.safeParse()` on request bodies despite having Zod schemas defined in `@app/shared`. All input goes directly to DB operations unvalidated.

**Impact**: Malformed data, extra fields, wrong types all get inserted into DB. Zod schemas in `packages/shared/src/schemas/` are dead code on the API side.

**Files**: All 19 files in `apps/api/src/modules/market-data/`

**Fix**: Add `const data = createMarketSchema.parse(await c.req.json())` (or equivalent) in each POST/PATCH/PUT handler.

### H2. N+1 queries in AI context builder

`ai-context-builder.ts` has nested sequential queries: for each market, it queries properties, then for each property it queries rooms, then for each room it queries pricing. With 5 markets x 5 properties x 3 rooms = 75+ sequential queries.

**Files**: `apps/api/src/modules/market-data/ai-context-builder.ts:51-101` (fetchPropertiesWithRooms), lines 103-128 (fetchItinerariesWithItems), lines 130-248 (buildMarketSection -- 8 sequential queries per market)

**Fix**: Use Drizzle relational queries or batch with `IN` clauses. Consolidate the 8+ per-market queries into fewer calls using `Promise.all`.

### H3. N+1 query in property-rooms-service.ts:listRooms

`listRooms` fetches all rooms then iterates with `Promise.all` to fetch pricing for each room individually.

**File**: `apps/api/src/modules/market-data/property-rooms-service.ts:12-18`

**Fix**: Use a single JOIN query or batch `WHERE roomId IN (...)`.

### H4. `bulkUpsertRoomPricing` / `bulkReplaceTemplateItems` -- no transaction

Both delete-then-insert operations are not wrapped in a transaction. If the insert fails after delete, data is lost.

**Files**:
- `apps/api/src/modules/market-data/property-rooms-service.ts:51-58`
- `apps/api/src/modules/market-data/itinerary-service.ts:53-63`

**Fix**: Wrap in `db.transaction(async (tx) => { ... })`.

### H5. `listMarkets` search vulnerable to SQL wildcard injection

`ilike(markets.name, \`%${search}%\`)` -- if user passes `%` or `_` characters, they act as SQL wildcards. Not SQL injection per se (Drizzle parameterizes), but allows unintended pattern matching.

**File**: `apps/api/src/modules/market-data/markets-service.ts:41`

**Fix**: Escape `%` and `_` characters in the search string before interpolation.

### H6. `updatedAt` not set on `evaluationCriteria.update` for tables without `updatedAt`

The `aiToggleService` calls `.set({ aiVisible, updatedAt: sql\`now()\` })` on all tables, but `evaluationCriteria` schema has `updatedAt` while `propertyEvaluations` does -- this is fine. However, the generic TABLE_MAP approach means if a table doesn't have `aiVisible` column, the update silently fails or corrupts.

**File**: `apps/api/src/modules/market-data/ai-toggle-service.ts:48-51`

The `evaluationCriteria` table does NOT have an `aiVisible` column, yet it's listed in the TABLE_MAP as `evaluation`. Updating `aiVisible` on it would fail.

---

## Medium Priority

### M1. 11 files exceed 200-line limit

| File | Lines |
|------|-------|
| itineraries-tab.tsx | 319 |
| ai-context-builder.ts | 287 |
| market-data-routes.ts | 275 |
| properties-tab.tsx | 246 |
| competitors-tab.tsx | 229 |
| customer-journeys-tab.tsx | 220 |
| inventory-strategies-tab.tsx | 216 |
| ai-context-format-helpers.ts | 214 |
| attractions-tab.tsx | 210 |
| transportation-tab.tsx | 208 |
| target-customers-tab.tsx | 205 |
| dining-spots-tab.tsx | 201 |
| seed-market-data.ts | 401 |

**Fix**: Extract dialog forms into separate components for tab files. Split `ai-context-builder.ts` into market-section builders. Split `market-data-routes.ts` was already done with extra-routes, but the main file still has 275 lines.

### M2. `markets-schema.ts` uses `uniqueIndex` on slug, but no slug handling on update

When updating a market's name, the slug is regenerated. But if the market name is not being changed and another field is updated, the slug stays the same. This is correct, but the `generateUniqueSlug` function runs 10 queries sequentially in the worst case (while loop up to 10).

**File**: `apps/api/src/modules/market-data/markets-service.ts:22-36`

### M3. Global module-level cache in `ai-context-builder.ts`

Using module-level `let cachedContext` means the cache is per-process. In a multi-instance deployment, instances have different caches and no invalidation coordination. The `invalidateAiContextCache()` function is exported but never called from any route.

**Files**: `apps/api/src/modules/market-data/ai-context-builder.ts:38-43`

**Fix**: Either call `invalidateAiContextCache()` in AI toggle/settings mutations, or use Redis/shared cache.

### M4. AI context builder uses hardcoded Vietnamese text

The fallback `"(Chua co du lieu thi truong trong he thong)"` is fine for a Vietnamese product, but the AI data category keys in `ai-context-builder.ts` (`"property"`, `"target_customer"`, `"dining"`, etc.) don't match the seed data categories exactly. For example, builder checks `settings["dining"]` but the seed data uses category `"dining_spots"`.

**File**: `apps/api/src/modules/market-data/ai-context-builder.ts:171` vs seed data categories

### M5. Frontend form field helpers named inconsistently

Across tab components, the form field helper function is named `field`, `f`, or `tf` depending on the file. Should be consistent.

### M6. `AiDataSetting.updatedBy` displays raw UUID

`ai-settings-page.tsx:83` shows `setting.updatedBy` which is a UUID reference to users table. Should either JOIN to get user name on the API side, or at minimum not display the raw UUID.

**File**: `apps/web/src/pages/ai-settings-page.tsx:83`

---

## Low Priority

### L1. Duplicate `slugify` function

`slugify` is defined identically in both `markets-service.ts:18` and `properties-service.ts:13`. Should be extracted to a shared utility.

### L2. `eslint-disable` comments for `any` type

Two files use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for the `updates` object. Could use a proper type or `Partial<typeof markets.$inferInsert>`.

**Files**: `markets-service.ts:109`, `properties-service.ts:75`, `ai-toggle-service.ts:22`

### L3. Seed file over 400 lines

`seed-market-data.ts` is 401 lines with hardcoded evaluation values. The `evalValues` map (lines 178-274) should be extracted to a separate data file.

### L4. Missing `ORDER BY` on `listPricingConfigs` and `listSettings`

`pricing-configs-service.ts:listPricingConfigs` and `ai-data-settings-service.ts:listSettings` return results without deterministic ordering.

---

## Positive Observations

1. **Well-structured schema**: Proper FK constraints with `onDelete: "cascade"`, appropriate indexes on foreign keys and frequently filtered columns, unique constraints where needed
2. **Consistent CRUD pattern**: All entity services follow the same create/read/update/delete pattern with existence checks and proper 404 handling
3. **Good separation**: Schema, services, routes, and shared types are cleanly separated
4. **Relations file**: Comprehensive Drizzle relations definition enables relational queries
5. **Bulk operations**: `bulkUpsertEvaluations` uses `onConflictDoUpdate` properly
6. **Frontend architecture**: Clean tab-based layout, reusable `AiVisibilityToggle` component, proper query key management
7. **Auth protection**: All routes use `authMiddleware`, mutating operations require `adminMiddleware`
8. **Seed data**: Comprehensive seed with realistic Vietnamese market data, proper FK ordering for both insert and delete

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Fix AI toggle entity type naming mismatch + missing body payload (C1)
2. **[CRITICAL]** Fix itinerary items route path mismatch + missing endpoints (C2)
3. **[CRITICAL]** Fix AI settings PATCH param (id vs category) (C3)
4. **[HIGH]** Add Zod validation in all route handlers (H1)
5. **[HIGH]** Wrap bulk delete-then-insert in transactions (H4)
6. **[HIGH]** Fix N+1 queries in AI context builder and room listing (H2, H3)
7. **[HIGH]** Escape SQL wildcard chars in search (H5)
8. **[MEDIUM]** Split files exceeding 200-line limit (M1)
9. **[MEDIUM]** Call `invalidateAiContextCache()` on data mutations (M3)
10. **[MEDIUM]** Fix AI data category key mismatch in context builder (M4)

---

## Unresolved Questions

1. Is the `evaluationCriteria` table intentionally in the AI toggle TABLE_MAP? It has no `aiVisible` column.
2. Are the AI data settings categories (`dining_spots`, `rooms`, etc.) meant to match the context builder checks (`dining`, `room`)? Currently they don't align.
3. Should `pricingConfigs` be scoped by `isActive` flag in the AI context builder? Currently all ai-visible configs are included regardless of `isActive`.
4. The frontend itineraries-tab creates items via POST/DELETE but backend only supports PUT (bulk replace). Which approach is intended?
