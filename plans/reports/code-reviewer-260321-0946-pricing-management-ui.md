# Code Review: Pricing Management UI

**Reviewer:** code-reviewer | **Date:** 2026-03-21 | **Scope:** 8 changed + 3 new files (836 LOC)

## Overall Assessment

Solid architectural refactor. The centralized pricing management page is well-structured with clean tab-based organization, proper component composition, and good reuse of existing components (`PricingTable`, `TransportPricingEditor`, `PricingOptionsManager`). TypeScript compiles cleanly. However, one **critical schema mismatch** and several medium-priority issues need attention.

---

## Critical Issues

### 1. Zod schema rejects "season" category -- will break when validation is added

**File:** `packages/shared/src/schemas/market-property-schemas.ts:148`

```ts
category: z.enum(["combo_type", "day_type"]),
```

`pricing-seasons-tab.tsx` sends `category: "season"` in its POST payload. The API route currently does **not** run this Zod schema (no `zValidator` middleware on the POST handler), so it works at runtime through Drizzle directly. But:

- If anyone adds `zValidator("json", createPricingOptionSchema)` to the route (standard pattern elsewhere), season CRUD silently breaks.
- The shared schema is the source-of-truth contract. This is an undocumented bypass.

**Fix:** Update the Zod enum:
```ts
category: z.enum(["combo_type", "day_type", "season"]),
```

**Impact:** High. Silent breakage risk on a routine API hardening change.

---

## High Priority

### 2. No admin-only route guard on `/pricing`

**File:** `apps/web/src/app.tsx:69`

The route is inside `<ProtectedRoute />` (requires auth) but not admin-gated. The sidebar marks `adminOnly: true` so non-admin users won't see the link, but they can navigate to `/pricing` directly. The page renders a market selector and config tab -- config tab exposes admin-only season/combo CRUD.

API endpoints use `adminMiddleware` for writes, so data is safe. But non-admin users seeing the config tab and getting 403s on save is poor UX.

**Fix options:**
- Add `if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;` at top of `PricingManagementPage` (matches `AiSettingsPage` pattern).
- Or wrap in an `<AdminRoute />` if one exists.

### 3. Query key collision: `pricing-seasons-tab` filters at query level but shares key

**File:** `apps/web/src/components/pricing/pricing-seasons-tab.tsx:23,37`

```ts
const QK = ["pricing-options"];
// queryFn filters: .filter((o) => o.category === "season")
```

Three consumers share the `["pricing-options"]` query key:
- `use-pricing-options.ts` -- fetches ALL, caches the full list
- `pricing-options-manager.tsx` -- fetches ALL, filters client-side
- `pricing-seasons-tab.tsx` -- fetches ALL, **filters to "season" in queryFn**

The problem: if `usePricingOptions()` runs first (caches all options), then `PricingSeasonsTab` mount doesn't re-fetch (same key, within staleTime). TanStack Query returns the cached full list, but the queryFn transforms it to season-only. On refetch, it rewrites the cache with season-only data, **breaking** the other consumers until they refetch.

**Fix:** Either:
- Remove the `.filter()` from `queryFn` and filter in the component render (consistent with the other two consumers).
- Or use a distinct key like `["pricing-options", "season"]`.

### 4. Missing error handling on save in `PricingSeasonsTab`

**File:** `apps/web/src/components/pricing/pricing-seasons-tab.tsx:41-56`

`saveMutation` has no `onError` handler. On API failure, the dialog remains open with no feedback to the user. Compare with `room-pricing-table.tsx` which properly captures and displays `saveError`.

**Fix:** Add `onError` with a state variable and render error in the dialog, matching the pattern in `RoomPricingFormDialog`.

---

## Medium Priority

### 5. No MM-DD input validation for season dates

**File:** `apps/web/src/components/pricing/pricing-seasons-tab.tsx:149-155`

Users type free-text for startDate/endDate with placeholder "06-01". No validation against MM-DD format. User could enter "13-45" or "June 1st" and it would save.

**Fix:** Add a regex or Zod check before submit:
```ts
const mmddRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
```
Or use `<input type="text" pattern="[0-1][0-9]-[0-3][0-9]" />` for browser-level hints.

### 6. `selectCls` string duplicated across 3 files

Defined identically in:
- `room-pricing-form-dialog.tsx:25`
- `pricing-room-overview-tab.tsx:9`
- `pricing-management-page.tsx:21`

**Fix:** Extract to shared UI utility or a `<Select>` component.

### 7. `room-pricing-table.tsx` exceeds 200-line limit (208 lines)

This file was already 200+ and the season grouping logic made it slightly larger. The grouping logic (lines 110-120) plus the render section could be extracted.

### 8. Non-admin users see room/transport pricing but can't edit

The rooms and transport tabs show data to all authenticated users (no role check on the page). This is probably intentional (read-only for non-admin), but the config tab exposes admin-only CRUD without any access control at component level. The `PricingSeasonsTab` and `PricingOptionsManager` render full CRUD UI including add/edit/delete buttons regardless of role.

**Fix:** Either hide the config tab for non-admins, or pass `isAdmin` prop to config sub-components.

---

## Low Priority

### 9. `markets` query key might conflict with other pages

`pricing-management-page.tsx:31` uses `queryKey: ["markets"]`. If the markets list page uses the same key with different params or transforms, they share cache. Generally this is fine if the query is identical, but worth verifying.

### 10. `as const` on TABS arrays is good practice (already done)

Minor: all tab arrays use `as const` consistently -- good pattern.

---

## Edge Cases Found by Scouting

| Edge Case | Impact | Status |
|-----------|--------|--------|
| Zod schema blocks "season" category | Season CRUD breaks when API adds validation | CRITICAL -- needs schema update |
| Query key collision with filtered queryFn | Cache corruption between components | HIGH -- needs fix |
| Delete season with existing room pricing referencing it | Orphaned `seasonName` on room pricing rows | Low (UI warns, data safe) |
| `combo-room-allocator.ts:75` hardcodes `seasonName: "default"` | Calculator ignores season pricing entirely | Worth noting for future |
| Season date MM-DD wrapping (e.g., 11-01 to 02-28) | No cross-year logic; may confuse date matching | Future concern |

---

## Positive Observations

- Clean component decomposition: config-tab, seasons-tab, room-overview, transport-overview are well-scoped
- Proper lazy loading of the new page in app.tsx
- Good reuse of existing `PricingTable` and `TransportPricingEditor` -- no duplication
- Season grouping in `room-pricing-table.tsx` is clean (Map-based, minimal LOC)
- `usePricingOptions` hook extended cleanly with season support while maintaining backward compatibility
- Delete confirmation dialog includes helpful context about orphaned pricing rows
- Config tab composes `PricingSeasonsTab` + `PricingOptionsManager` without reimplementing

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Update `createPricingOptionSchema` to add `"season"` to category enum
2. **[HIGH]** Fix query key collision in `pricing-seasons-tab.tsx` -- remove filter from queryFn or use distinct key
3. **[HIGH]** Add admin guard to `PricingManagementPage` (or at minimum to the config tab)
4. **[HIGH]** Add `onError` to `saveMutation` in `PricingSeasonsTab`
5. **[MED]** Add MM-DD format validation for season date inputs
6. **[MED]** Extract `selectCls` to shared location
7. **[LOW]** Consider splitting room-pricing-table.tsx if it grows further

---

## Metrics

| Metric | Value |
|--------|-------|
| TypeScript check | PASS (0 errors) |
| Files reviewed | 11 |
| Total LOC | 836 |
| Files over 200 lines | 1 (`room-pricing-table.tsx`: 208) |
| Critical issues | 1 |
| High issues | 3 |
| Medium issues | 4 |
| Low issues | 2 |

---

## Unresolved Questions

1. Is the pricing page intentionally accessible to non-admin users for read-only viewing? If not, add route-level guard.
2. Should `combo-room-allocator.ts` support season-aware pricing lookup instead of hardcoding "default"?
3. Are there plans to add Zod validation middleware to the pricing-options API routes? If so, the schema fix is urgent.
