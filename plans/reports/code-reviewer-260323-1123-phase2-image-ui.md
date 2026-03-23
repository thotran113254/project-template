# Code Review: Phase 2 — Image Upload & UI Enhancements

**Date**: 2026-03-23
**Scope**: FB-06, FB-07, FB-03, FB-05, FB-02.1 (uncommitted working tree changes)
**Files Changed**: 10 modified, 2 new | ~230 LOC added
**TypeScript**: 0 errors (pnpm typecheck passes)

## Overall Assessment

Solid UI-level implementation. All five feedback items are functionally addressed. The new components (`amenity-tag-picker.tsx`, `property-card-grid.tsx`) are clean, well-scoped, and under the 200-line limit. However, there are **shared type/schema drift issues** that will cause silent data loss or runtime crashes when the API enforces Zod validation more strictly, and several unsafe type casts that bypass TypeScript's safety net.

---

## Critical Issues

### C1: Shared `TransportProvider` type missing `images` and `pricingNotes`

**File**: `packages/shared/src/types/market-property-types.ts` (lines 99-113)

The `TransportProvider` interface does not include `images: string[]` or `pricingNotes: string | null`, even though the DB schema (`transport-providers-schema.ts` lines 27-28) has both columns. The frontend works around this with double `as unknown as Record<string, unknown>` casts (see C3), but any code importing `TransportProvider` from shared will not know these fields exist.

**Fix**: Add to `TransportProvider` interface:
```ts
images: string[];
pricingNotes: string | null;
```

### C2: Shared `MarketProperty` type missing `propertyCode`

**File**: `packages/shared/src/types/market-property-types.ts` (lines 37-56)

`MarketProperty` lacks `propertyCode: string | null`. The DB schema has it (`property_code varchar(20)`). Frontend uses unsafe cast to access it.

**Fix**: Add `propertyCode: string | null;` to `MarketProperty` interface.

### C3: Zod schemas out of sync with DB columns

**File**: `packages/shared/src/schemas/market-property-schemas.ts`

| Schema | Missing field | DB column |
|--------|--------------|-----------|
| `createTransportProviderSchema` | `images` | `images jsonb` |
| `createTransportProviderSchema` | `pricingNotes` | `pricing_notes text` |
| `createPropertySchema` | `propertyCode` | `property_code varchar(20)` |

Currently the API routes pass `body` directly to service without Zod validation (confirmed in `market-data-routes.ts` lines 262-271), so the fields reach the DB. But if Zod validation is ever added at the route level (a common security hardening step), these fields will be stripped. This is a latent bug.

**Fix**: Add missing fields to Zod schemas:
```ts
// createTransportProviderSchema
images: z.array(z.string()).optional(),
pricingNotes: z.string().optional(),

// createPropertySchema
propertyCode: z.string().max(20).optional(),
```

---

## High Priority

### H1: Unsafe `as unknown as Record<string, unknown>` casts (4 occurrences)

| File | Line | Cast |
|------|------|------|
| `transport-providers-tab.tsx` | ~117 | `(item as unknown as Record<string, unknown>).images` |
| `transport-providers-tab.tsx` | ~118 | `(item as unknown as Record<string, unknown>).pricingNotes` |
| `properties-tab.tsx` | ~118 | `(item as unknown as Record<string, unknown>).propertyCode` |
| `property-detail-dialog.tsx` | ~55 | `(property as unknown as Record<string, string>).propertyCode` |

These exist because the shared types are missing fields (C1, C2). Once shared types are updated, these casts become unnecessary and should be removed. While they work at runtime, they defeat TypeScript's purpose.

### H2: No input validation on API routes for attractions, transport-providers, properties

**Files**: `apps/api/src/modules/market-data/market-data-routes.ts` (lines 136-145, 262-271)

All three POST/PATCH routes do `const body = await c.req.json()` then pass directly to service. No Zod `.parse()` or `.safeParse()`. A malicious payload could inject unexpected fields into the DB (jsonb columns accept anything). The Zod schemas exist but are not wired to the routes.

**Impact**: Medium security risk. Since routes require `adminMiddleware`, attack surface is limited to compromised admin accounts.

**Fix**: Apply validation in routes, e.g.:
```ts
const body = createAttractionSchema.parse(await c.req.json());
```

### H3: `properties-tab.tsx` at 240 lines (over 200-line limit)

Was already at 210 before Phase 2 changes. Now 240 lines with new form fields and view toggle. The form dialog section (60+ lines of JSX) is the primary candidate for extraction into a `property-form-dialog.tsx` component, similar to how `transport-provider-form-dialog.tsx` was already extracted.

### H4: `image-manager.tsx` at 261 lines

Exceeds the 200-line limit. The lightbox section (lines 232-258) and the upload logic (lines 50-90) could be extracted into `image-lightbox.tsx` and a `useImageUpload` hook respectively.

---

## Medium Priority

### M1: Duplicate `slugify` function in properties-tab

**File**: `apps/web/src/components/market-data/properties-tab.tsx` line 65

A `slugify` function is defined locally, but an identical one exists at `apps/web/src/lib/utils.ts` line 13. The frontend generates the slug client-side, but the backend `properties-service.ts` also generates it server-side with collision handling via `generateUniqueSlug()`. The client slug is overwritten by the server anyway, so the client-side slug generation is dead code in practice. At minimum, import from `utils.ts` instead of duplicating.

### M2: Dashboard `DashboardStats` interface duplicated 3 times

The `DashboardStats` interface is defined independently in:
1. `apps/api/src/modules/dashboard/dashboard-service.ts`
2. `apps/web/src/pages/dashboard-page.tsx`
3. `apps/web/src/components/dashboard/dashboard-stat-cards.tsx`

The stat-cards version marks `markets` as optional (`markets?: { total: number }`), while the page version marks it required. This inconsistency is benign because the spread operator with conditional append handles it, but a single shared type would prevent future drift.

### M3: Attractions payload transformation is fragile

**File**: `attractions-tab.tsx`, save mutation (line ~60):
```ts
const { images, ...rest } = form;
const payload = { ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v || null])), images };
```

The `v || null` transformation converts empty strings to null, which is correct for text fields. But extracting `images` separately to avoid `[] || null` (which would be `[]` anyway since arrays are truthy) adds unnecessary complexity. A simpler approach: map only string values to null:
```ts
const payload = Object.fromEntries(
  Object.entries(form).map(([k, v]) => [k, typeof v === 'string' && !v ? null : v])
);
```

### M4: No loading/error state for card grid view

`property-card-grid.tsx` receives already-fetched data, so loading is handled by the parent. But when the array is empty, there is no empty state -- it just renders an empty `div`. Add a placeholder message for the cards view.

### M5: `transport-providers-tab.tsx` at 248 lines

Over the 200-line limit. Similar to properties-tab, the inline dialog + table could benefit from extraction.

---

## Low Priority

### L1: Amenity icons map is minimal

`property-card-grid.tsx` maps only 3 amenities to icons (Wifi, Ho boi, Nha hang). The remaining 11 predefined amenities show as text pills. Not a bug, but could be expanded over time.

### L2: Property card grid missing delete action

The table view has View/Edit/Delete buttons. The card view only has View and Edit. No Delete button on cards. This is likely intentional (delete is a destructive action, better in table), but creates a UX inconsistency where users must switch to table view to delete.

### L3: View mode state not persisted

`viewMode` is `useState` -- refreshing the page resets to table view. Consider `localStorage` or URL param if users frequently use card view.

---

## Edge Cases Found by Scout

1. **Empty images array on new record**: When creating a new attraction/transport-provider, `images: []` is sent. The API service passes it through to `db.insert()`. Drizzle handles `jsonb` `[]` correctly. Verified: DB schema default is `default([])` so even if omitted, the DB returns `[]`. Safe.

2. **Images array with non-URL strings**: The `images` Zod schema is `z.array(z.string())` -- no URL validation. Users could store arbitrary strings. The `ImageManager` only adds URLs from the upload endpoint (which returns `/uploads/filename.webp`), so in normal flow this is safe. But a direct API call could inject XSS via `<img src="javascript:...">`. The `resolveImageUrl()` function doesn't sanitize. **Recommend**: add `z.string().url()` or at minimum `z.string().startsWith("/uploads/")` to image Zod schemas.

3. **Amenity tag XSS**: Custom amenity text is stored as-is in jsonb. Rendered via React's `{tag}` (text interpolation), so React auto-escapes. Safe.

4. **Reorder drag-drop race**: `handleDragReorder` uses `dragIdx` state which could be stale in rapid drag operations. The `onDragEnd` sets `dragIdx(null)`, but if `onDrop` fires after `onDragEnd` on a different target, `dragIdx` would be null. This is a minor edge case in standard HTML5 drag-drop.

5. **`marketCount[0]!.total`**: Backend (`dashboard-service.ts` line 212) uses non-null assertion. If the `markets` table doesn't exist (migration not run), this crashes. Other counts use the same pattern, so it's consistent, but worth noting.

---

## Positive Observations

- **ImageManager component is well-built**: Drag-drop reorder, lightbox, progress bars, error handling, parallel uploads with concurrency limit (3). Clean separation of concerns.
- **AmenityTagPicker is reusable**: Props-based, supports predefined + custom tags, keyboard support (Enter to add). Under 70 lines.
- **PropertyCardGrid is responsive**: 1/2/3 column grid with proper overflow handling, amenity truncation at 5 items with "+N" indicator.
- **View toggle UX**: Clean pill-style toggle that preserves all functionality (AI toggle, edit, view work in both modes).
- **Dashboard markets card**: Conditional spread `...(stats.markets ? [card] : [])` handles backward compatibility gracefully.
- **Upload route security**: Auth required, file type/size validation, sharp optimization, path traversal protection on delete.

---

## Recommended Actions (Priority Order)

1. **Update shared types**: Add `propertyCode`, `images`, `pricingNotes` to `MarketProperty` and `TransportProvider` interfaces
2. **Update Zod schemas**: Add missing fields to `createTransportProviderSchema` and `createPropertySchema`
3. **Remove unsafe casts**: Once types are updated, replace all `as unknown as Record<string, unknown>` with direct property access
4. **Add Zod validation to API routes**: Parse request bodies through Zod schemas before passing to services
5. **Extract property form dialog**: Move form JSX from `properties-tab.tsx` into `property-form-dialog.tsx` to meet 200-line limit
6. **Remove duplicate slugify**: Import from `@/lib/utils` or remove client-side slug (server generates it anyway)
7. **Add empty state to card grid**: Show placeholder when no properties exist

---

## Metrics

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| Files over 200 lines | 4 (`properties-tab` 240, `transport-providers-tab` 248, `image-manager` 261, `dashboard-service` 234) |
| Unsafe type casts | 4 |
| Missing Zod fields | 3 |
| Missing shared type fields | 3 |
| New components quality | Good (clean, focused, reusable) |

---

## Unresolved Questions

1. Should `propertyCode` have a UNIQUE constraint in the DB? Currently `varchar(20)` with no uniqueness -- two properties could share the same code.
2. Is the predefined amenity list final, or should it be configurable (e.g., stored in DB or admin settings)?
3. Should the card view replace table as the default view for properties, given the visual richness it provides?
