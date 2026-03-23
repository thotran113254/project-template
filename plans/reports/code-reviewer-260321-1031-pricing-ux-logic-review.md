# Code Review: Pricing Management UI -- UX, Logic & Edge Cases

**Date:** 2026-03-21
**Reviewer:** code-reviewer agent
**Scope:** 9 files, ~1050 LOC total
**Focus:** UX quality, logic correctness, form optimization, edge cases

---

## Overall Assessment

The pricing management UI is well-structured, modular, and follows consistent patterns. The spreadsheet-style price matrix is a good design choice for this domain. However, there are several logic issues (some critical), missing UX affordances, and edge cases that could cause silent data loss or confusing admin experiences.

---

## Critical Issues

### C1. React Hooks Rule Violation -- Early Return Before Hooks

**File:** `apps/web/src/pages/pricing-management-page.tsx:27-29`

```tsx
const { user } = useAuth();
if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
const [activeTab, setActiveTab] = useState<TabId>("rooms");  // Hook after conditional return
```

The `useState`, `useQuery`, and `useEffect` calls come AFTER a conditional return. This violates the Rules of Hooks (hooks must be called unconditionally at the top level). React may not catch this in every render path, but it can cause:
- Crashes during re-renders
- State corruption if the hook call order changes

**Fix:** Move the guard after all hooks, or wrap with a guard component:
```tsx
export default function PricingManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("rooms");
  const [marketId, setMarketId] = useState("");
  // ... all hooks first ...
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  // ... render JSX
}
```

### C2. Combo Calculator Hardcodes Season to "default" -- Season Pricing Never Used

**File:** `apps/api/src/modules/pricing/combo-room-allocator.ts:75`

```ts
eq(roomPricing.seasonName, "default"),
```

The combo calculator service (and its room allocator) always filters by `seasonName = "default"`. The entire seasons system (PricingSeasonsTab, season pills in the matrix, season selector in the form) lets admins create seasonal pricing, but the calculator never queries it. This means:
- Admin enters "High Summer" pricing at higher rates
- Calculator always returns "default" season prices
- AI chat and customer-facing quotes will be wrong during seasonal periods

**Impact:** Incorrect pricing quotes during peak/off-peak seasons. Silent revenue loss or overcharging.

**Fix:** The calculator needs a date parameter or auto-detection:
1. Accept an optional `travelDate` parameter
2. Look up which season applies (by checking `pricing_options` where `category='season'` and `config.startDate/endDate` covers the travel date)
3. Query with that season, falling back to "default" if no match

### C3. Quick Calculator Hardcodes `numChildrenUnder5: 0` -- No Input Field

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx:38`

```tsx
numChildrenUnder5: 0, numNights: nights,
```

The `ComboCalculateRequest` type supports `numChildrenUnder5` (children under 5 ride free on transport), but the quick calculator hardcodes it to 0 with no UI input. The full combo calculator page (`combo-calculator-page.tsx:206`) does have this field. This creates inconsistency between the admin tool and the public page.

**Impact:** Admin's quick price check won't match the customer-facing calculator when children under 5 are involved (affects transport cost calculation).

---

## High Priority

### H1. Quick Calculator Hardcodes Nights-to-Options Mapping

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx:87-89`

```tsx
<option value={1}>2N1D</option>
<option value={2}>3N2D</option>
<option value={3}>4N3D</option>
```

These are hardcoded while the pricing options (combo types) are dynamic and admin-configurable. The backend also hardcodes the mapping (`nightsToComboType` in combo-calculator-service.ts:11-15). If an admin adds a new combo type like "5N4D", neither the calculator UI nor the backend will use it.

**Impact:** Admin configures new combo types via Config tab but they don't appear in the calculator.

**Fix:** Fetch combo options from `usePricingOptions()` and derive nights from the option key pattern, or add a `comboType` dropdown instead of a `nights` dropdown.

### H2. Quick Calculator Hardcodes Day Type Options

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx:93-97`

```tsx
<option value="weekday">T2-T5</option>
<option value="friday">T6</option>
<option value="saturday">T7</option>
<option value="sunday">CN</option>
<option value="holiday">Le</option>
```

Same issue as H1. Day types are admin-configurable in the Config tab but hardcoded in the calculator. If admin renames or adds day types, the calculator won't reflect it.

### H3. Quick Calculator Hardcodes Transport Options

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx:101-104`

```tsx
<option value="">Khong</option>
<option value="cabin">Cabin</option>
<option value="limousine">Limousine</option>
<option value="sleeper">Giuong nam</option>
```

Transport classes should come from the actual transport provider data for the selected market, not hardcoded values.

### H4. Delete Mutation Has No Error Handling

**Files:**
- `pricing-price-matrix.tsx:62-65` (room pricing delete)
- `pricing-seasons-tab.tsx:65-68` (season delete)
- `pricing-options-manager.tsx:65-68` (options delete)
- `transport-pricing-editor.tsx:72-80` (transport delete)

None of the delete mutations have `onError` handlers. If deletion fails (e.g., foreign key constraint, network error), the user sees no feedback. The dialog closes silently via the `setDeleteTarget(null)` in `onSuccess` -- but on error, the delete target stays set and the dialog remains open with no error message.

**Fix:** Add `onError` handler to show a toast or inline error:
```tsx
onError: (err: any) => {
  toast.error(err?.response?.data?.message ?? "Loi xoa");
}
```

### H5. Quick Calculator Missing `departureProvince` and `ferryClass` Fields

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx`

The `ComboCalculateRequest` type supports `departureProvince` (cross-province surcharge) and `ferryClass` (ferry pricing), but neither has UI inputs. Since transport pricing can include cross-province surcharges (the transport form even has a surcharges editor), the quick calculator may return incorrect transport costs.

### H6. Calculator Warnings Not Displayed

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx:128-147`

`ComboCalculationResult` includes a `warnings` array (e.g., "Khong tim thay phong phu hop"), but the quick calculator UI never renders `result.warnings`. The admin gets a total of 0 with no explanation.

---

## Medium Priority

### M1. Room Pricing Form Has 15 Fields -- Overwhelming for Frequent Use

**File:** `apps/web/src/components/market-data/room-pricing-form-dialog.tsx`

The form presents all 15 fields in a flat grid:
- Core: combo, day, season, standard guests, price (5 fields)
- Variations: +1, -1, extra night, under-standard (4 fields)
- Surcharges: extra adult, extra child (2 fields)
- Amenities: text area (1 field)
- Admin-only: discount price, CK+1, CK-1 (3 fields)

**Recommendation:** Group into collapsible sections:
1. **Required** (always visible): Combo, Day, Season, Guests, Price
2. **Price Adjustments** (collapsed by default): +1, -1, Extra Night, Under Standard
3. **Surcharges** (collapsed): Extra Adult, Extra Child
4. **Admin Discounts** (collapsed, admin-only): CK, CK+1, CK-1

This reduces visual complexity from 15 fields to 5 on first open. Most pricing entries only need the core fields.

### M2. MM-DD Date Format Requires Explanation

**File:** `apps/web/src/components/pricing/pricing-seasons-tab.tsx:155-164`

The season date inputs use raw text with MM-DD format. This requires users to type "06-01" instead of picking from a calendar. The helper text is small (`text-[10px]`).

**Recommendation:**
- Consider two dropdowns (month + day) instead of free text
- Or use an input mask pattern for guided entry
- Current regex validation (`MM_DD_REGEX`) is good but not user-visible -- user only sees error when Save button stays disabled

### M3. Season Delete Warning Could Be Misleading

**File:** `apps/web/src/components/pricing/pricing-seasons-tab.tsx:203`

```
"Cac bang gia dang dung mua nay se khong bi xoa nhung se khong tim thay mua tuong ung."
```

This warns that pricing rows using the season won't be deleted. But those pricing rows become orphaned -- they still exist in the DB with a `seasonName` that no longer resolves to a label. The matrix will show the raw key instead of a friendly label (the `seasonLabel` fallback returns the key). This is technically handled but could confuse users.

### M4. Transport Pricing Editor -- No Save Error Display

**File:** `apps/web/src/components/market-data/transport-pricing-editor.tsx:39-70`

The `saveMutation` has no `onError` handler. If the API returns a validation error (e.g., duplicate vehicle class + seat type), the dialog closes with no feedback.

### M5. Property Selection Not Reset on Market Change

**File:** `apps/web/src/components/pricing/pricing-room-overview-tab.tsx:32`

```tsx
useEffect(() => { setPropertyId(""); }, [marketId]);
```

This resets `propertyId` to `""` when market changes. The auto-select effect (line 27-29) then picks the first property. However, there's a timing issue: between the reset and the auto-select, the `propertyId` is `""` but `enabled: !!propertyId` prevents the rooms query from firing. This works correctly in practice, but there's a brief flash where `propertyId` is empty and the empty-properties check might show "Chua co co so luu tru" momentarily.

### M6. `saveMutation` in `PricingOptionsManager` Has No Error Handler

**File:** `apps/web/src/components/market-data/pricing-options-manager.tsx:46-63`

Unlike `PricingSeasonsTab` which has `onError`, the `PricingOptionsManager.saveMutation` silently fails. If creating a duplicate `optionKey`, the 409 error is swallowed.

### M7. Non-null Assertions on `markets[0]!` and `properties[0]!`

**Files:**
- `pricing-management-page.tsx:42`: `markets[0]!.id`
- `pricing-room-overview-tab.tsx:28`: `properties[0]!.id`

Both are guarded by `length > 0` checks, so they're safe at runtime. But the pattern is fragile -- any refactor removing the guard silently breaks. Prefer optional chaining with fallback:
```tsx
if (markets.length > 0 && !marketId) setMarketId(markets[0]?.id ?? "");
```

---

## Low Priority

### L1. Inline Styles Mixed with Tailwind

**File:** `pricing-quick-calculator.tsx:78,82`

```tsx
style={{ width: 60 }}
```

Minor inconsistency -- use `w-[60px]` Tailwind class instead.

### L2. `selectCls` Duplicated Across Files

Both `pricing-management-page.tsx:22` and `room-pricing-form-dialog.tsx:25` define identical `selectCls` constants. Could be extracted to a shared utility.

### L3. Vietnamese Labels Abbreviated Inconsistently

- "So nguoi TC" (Tieu Chuan) -- abbreviation may confuse new users
- "Phu thu NL them" (Nguoi Lon) -- abbreviation
- "CK" for "Chiet Khau" -- used consistently, fine
- "Giuong nam" vs "Sleeper" -- mixing Vietnamese and English transport terms

### L4. `fmtVnd` Does Not Handle Zero Gracefully

**File:** `apps/web/src/lib/format-currency.ts`

`fmtVnd(0)` returns "0d" which is technically correct but could be shown as "--" or "Chua co" in context.

---

## Edge Cases Found by Scout

### E1. Empty Combo/Day Options

If no combo types or day types are configured (first-time setup), `comboOptions` and `dayOptions` are empty arrays. The matrix renders an empty table (headers only, no rows/columns). The "Them gia" button opens a form with empty selects -- `form.comboType` defaults to `comboOptions[0]?.optionKey ?? ""` which is `""`. Submitting with `comboType: ""` may cause a 400/500 on the API side.

**Impact:** First-time admin setup flow is broken until they configure options first.

**Recommendation:** Show a guided "Setup required" message when options are empty, linking to the Config tab.

### E2. Market with No Properties

Handled correctly in `pricing-room-overview-tab.tsx:51`: shows "Chua co co so luu tru." Good.

### E3. API Error Responses

Room pricing save has error handling (`setSaveError`). But most delete mutations and the transport save mutation silently swallow errors. See H4 and M4.

### E4. Matrix Season Filter vs Form Season Mismatch

When user selects a season pill (e.g., "High Summer"), clicks a cell, and the form opens -- the form correctly pre-fills `seasonName` with the current season filter. Verified this works correctly in `openCell` (line 86) and `openAdd` (line 98).

### E5. Concurrent Edits

No optimistic locking. If two admins edit the same pricing row simultaneously, last-write-wins. The unique constraint `room_pricing_combo_day_season_idx` prevents duplicate creation but doesn't handle update conflicts.

### E6. `propertySlug={undefined}` in Quick Calculator

**File:** `pricing-management-page.tsx:94`

The quick calculator receives `propertySlug={undefined}`, which means it calculates across ALL properties in the market (best price). This is intentional for the overview page but should be documented for admin understanding. A label like "Gia tot nhat toan thi truong" would help.

---

## Positive Observations

1. **Price matrix UX is solid** -- click-to-add/edit cells, hover delete buttons, season pills for filtering. This is a well-thought-out spreadsheet pattern.
2. **Consistent CRUD pattern** -- all entities (room pricing, transport pricing, seasons, options) follow the same mutation + dialog + confirm-delete pattern.
3. **Good admin-only visibility** -- discount prices are properly hidden from non-admin users both in the matrix display and the form.
4. **Query invalidation is correct** -- all mutations invalidate the right query keys.
5. **Duplicate detection on API side** -- `createRoomPricing` checks for existing combo+day+season before insert, returning 409 with Vietnamese error message.
6. **Search threshold** -- property search only shows when 6+ properties exist, reducing noise for small markets.
7. **TypeScript types pass** -- `pnpm --filter web typecheck` passes clean.

---

## Recommended Actions (Priority Order)

1. **[Critical] Fix hooks violation** in `pricing-management-page.tsx` -- move early return after all hooks
2. **[Critical] Add season-aware calculation** to combo-calculator-service -- the entire seasons feature is rendered useless without it
3. **[Critical] Add `numChildrenUnder5` input** to quick calculator for parity with full calculator
4. **[High] Add `onError` handlers** to all delete mutations and transport save mutation
5. **[High] Display `result.warnings`** in quick calculator output
6. **[High] Replace hardcoded dropdowns** in quick calculator with dynamic options from `usePricingOptions()`
7. **[Medium] Group form fields** in room-pricing-form-dialog into collapsible sections
8. **[Medium] Show setup guidance** when combo/day options are empty
9. **[Medium] Add `departureProvince` dropdown** to quick calculator
10. **[Low] Extract shared `selectCls` constant

---

## Metrics

- **Type Coverage:** Passes tsc --noEmit (100% structural typing)
- **Test Coverage:** Not measured (no pricing UI tests found)
- **Linting Issues:** 0 (typecheck clean)
- **Files Reviewed:** 9 primary + 4 supporting (shared types, API services)
- **Issues Found:** 3 Critical, 6 High, 7 Medium, 4 Low

---

## Unresolved Questions

1. Is there a plan to add season auto-detection based on travel date? The current season system is effectively non-functional for calculations.
2. Should the quick calculator match the full calculator's feature set exactly, or is it intentionally simplified?
3. Is there a toast/notification system available? Several error handlers need it but I didn't find one in the codebase.
4. What happens if an admin deletes a combo_type that's referenced by existing room_pricing rows? The API doesn't cascade -- those rows become orphaned. Is this acceptable?
