# Pricing Calculator System - Completeness Review

**Date:** 2026-03-18
**Reviewer:** code-reviewer agent
**Scope:** 25 files across backend core, data layer, services, AI integration, frontend, shared types, seed data

---

## A. REAL-WORLD CASE COVERAGE

### 1. Multi-night stays across different day types
**Status: NOT HANDLED** | Severity: **CRITICAL**

The calculator accepts a single `dayType` per calculation. A Thu+Fri+Sat trip has 3 different night prices, but the system uses only one `dayType` for all nights.

**File:** `apps/api/src/modules/pricing/combo-calculator-service.ts` (line 42-43)
```ts
const comboType = nightsToComboType(dto.numNights);
// Uses single dto.dayType for all nights
```

**Fix:** Accept `dayTypes: string[]` (one per night) or compute mixed-day pricing by iterating nights and summing per-night costs. This is the single biggest real-world gap -- every multi-night booking spanning a weekend hits this.

### 2. Group splitting across multiple properties
**Status: PARTIALLY HANDLED** | Severity: **MINOR**

When `propertySlug` is omitted, `resolveRoomCandidates` fetches rooms from ALL properties in the market (line 30-38 of `combo-room-allocator.ts`). The greedy allocator can assign guests across properties. The result includes `propertyName` per allocation, so cross-property splits are visible.

**Gap:** No preference weighting or constraint for "keep group together" -- greedy just picks biggest rooms first.

### 3. Under-standard occupancy
**Status: HANDLED** | Severity: None

`underStandardPrice` is checked at line 90 of `combo-room-allocator.ts`:
```ts
if (guestsInRoom < p.standardGuests && p.underStandardPrice !== null) {
  pricePerRoom = p.underStandardPrice;
}
```

### 4. Extra person surcharges
**Status: PARTIALLY HANDLED** | Severity: **MAJOR**

Adult surcharges are applied (line 98-103 of `combo-room-allocator.ts`), but `extraChildSurcharge` is stored in schema and type but **never used in calculation**. The allocator only uses `extraAdultSurcharge`.

**File:** `apps/api/src/modules/pricing/combo-room-allocator.ts` (line 97-104)
```ts
// extraGuests applied with extraAdultSurcharge only
// extraChildSurcharge is NEVER read despite being in schema
```

**Fix:** Distinguish adult vs child extra guests when allocating, apply `extraChildSurcharge` for children.

### 5. Children pricing tiers
**Status: PARTIALLY HANDLED** | Severity: **MAJOR**

**Transport:** Under-5 free, 5-10 discounted, >10 adult price -- all handled in `combo-transport-resolver.ts` (lines 52-58). Child discount uses `childDiscountAmount` subtracted from base price.

**Rooms:** Children are counted as regular people (`numPeople = adults + under10 + under5` in calculator line 39). Under-5 children consume room capacity same as adults. No child-free tier for rooms.

**Gap:** A family with 2 adults + 1 infant should NOT need a room with 3 capacity. Infants typically don't count toward room occupancy.

### 6. Cross-province surcharges
**Status: STORED BUT NOT USED IN CALCULATOR** | Severity: **MAJOR**

Schema has `crossProvinceSurcharges` JSONB field (transport-pricing-schema line 31). Seed data has values. AI fetcher displays them. But `combo-transport-resolver.ts` never reads or applies them.

**File:** `apps/api/src/modules/pricing/combo-transport-resolver.ts` -- no reference to `crossProvinceSurcharges`

**Fix:** Add `pickupProvince?: string` to `ComboCalculateRequest`, lookup surcharge in resolver, add to per-person cost.

### 7. One-way vs round-trip transport
**Status: HARDCODED TO ROUNDTRIP** | Severity: **MAJOR**

`combo-transport-resolver.ts` line 48:
```ts
const basePrice = tp.roundtripListedPrice ?? tp.onewayListedPrice;
```

Always prefers roundtrip. No way for user to select one-way. Schema stores both prices, but calculator has no `tripType` input.

**Fix:** Add `tripType?: "oneway" | "roundtrip"` to request schema, use accordingly.

### 8. Ferry + bus combo
**Status: HANDLED** | Severity: None

Calculator separately resolves `transport` (bus) and `ferry` (lines 56-63 of calculator service). Both are summed into subtotal. Frontend displays both sections.

### 9. Holiday pricing
**Status: HANDLED** | Severity: None

`dayType` includes "holiday" in both Zod schema enum and UI dropdown. Room pricing schema has `dayType` column. Calculator queries by `dayType`.

### 10. Season-based pricing
**Status: SCHEMA EXISTS, NOT USED IN CALCULATOR** | Severity: **MAJOR**

Room pricing schema has `seasonName`, `seasonStart`, `seasonEnd` columns (lines 22-24). The unique index includes `seasonName`. But `combo-room-allocator.ts` **does not filter by season** -- it queries only `comboType` + `dayType` (line 51-56). If multiple season rows exist, it takes the first match arbitrarily.

**Fix:** Pass a date (or current date) to the allocator, match season by date range, fall back to "default" season.

### 11. Dining services
**Status: NOT INTEGRATED IN CALCULATOR** | Severity: **MINOR**

Dining pricing configs exist in seed data (hotpot, BBQ, set menu with min-people and price ranges). But the combo calculator has zero references to dining. Dining is informational only (for AI to cite).

**Gap:** If combo should include dining, needs `diningType?: string` in request and cost integration. If dining is separate, this is acceptable.

### 12. Property-specific pricing
**Status: HANDLED** | Severity: None

Room pricing is per-room, rooms are per-property. Each property has its own rates through this chain. Calculator filters by `propertySlug` if provided.

### 13. Profit margin per market
**Status: HANDLED** | Severity: None

`loadProfitMargin` (calculator service lines 17-30) checks market-specific config first, falls back to global. `pricingConfigs` table supports both `marketId` and `propertyId` scoping.

### 14. Bulk booking discounts
**Status: NOT IMPLEMENTED** | Severity: **SUGGESTION**

No quantity-based discount logic. Large groups get no volume pricing. Acceptable if business handles this manually.

### 15. Cancellation/refund policies
**Status: NOT TRACKED** | Severity: **SUGGESTION**

No cancellation fields in any pricing schema. Out of scope for a calculator, but worth noting for future order/booking module.

---

## B. ADMIN CONTROL REVIEW

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| 1 | CRUD transport providers per market | YES | `market-data-routes.ts` lines 256-276, full CRUD with adminMiddleware |
| 2 | CRUD transport pricing per provider | YES | `market-data-extra-routes.ts` lines 266-298, includes bulk upsert |
| 3 | Edit room pricing with dual prices | YES | Listed + discount prices, plus/minus-1 variants |
| 4 | Set profit margins (global + per-market) | YES | Via pricingConfigs CRUD, `ruleType: "profit_margin"` |
| 5 | Configure dining services | YES | Via pricingConfigs with `ruleType: "dining_service"` |
| 6 | Toggle AI visibility | YES | Universal AI toggle endpoint for all entity types |
| 7 | Override profit margin in combo calc | PARTIAL | Backend supports it (line 76 of calculator), but **frontend does NOT expose this input** for admin |
| 8 | See discount prices (staff cannot) | YES | Service-layer role filtering in both `transport-pricing-service.ts` and `property-rooms-service.ts` |
| 9 | Manage pickup points | YES | JSONB `pickupPoints` on transport providers, managed via provider CRUD |
| 10 | Set children pricing policies per provider | YES | `childFreeUnder`, `childDiscountUnder`, `childDiscountAmount` per transport pricing row |

### Admin Gaps Found:

**MAJOR: No profit margin override in frontend**
`combo-calculator-page.tsx` does not include a profit margin override input for admin users. Backend supports it, frontend omits it.

**MINOR: No cross-province surcharge management UI**
Cross-province surcharges are JSONB fields. The transport pricing editor dialog does not include inputs for editing `crossProvinceSurcharges`. Admin cannot manage these via UI.

---

## C. SYSTEM FLEXIBILITY

### 1. Can new vehicle classes be added without code changes?
**MOSTLY YES** | Severity: **MINOR** gap

Backend: vehicle class is a `varchar(50)`, no enum constraint. New classes work at DB level.

Frontend: `transport-pricing-editor.tsx` line 20 hardcodes:
```ts
const VEHICLE_CLASSES = ["cabin", "limousine", "sleeper", "speed_boat", "small_boat"];
```
And `combo-calculator-page.tsx` lines 26-37 hardcodes transport and ferry options:
```ts
const TRANSPORT_OPTIONS = [
  { value: "cabin", label: "Cabin" },
  { value: "limousine", label: "Limousine" },
  { value: "sleeper", label: "Giường nằm" },
];
```
Adding a new class requires code changes in 2+ frontend files. Should be DB-driven via `pricingOptions` or a similar config table.

### 2. Can new markets be added?
**YES** | No code changes needed. Markets are DB entities. All pricing, transport, rooms are market-scoped.

### 3. Can pricing rules be extended?
**YES** | `pricingConfigs` uses JSONB `config` field with flexible `ruleType`. New rule types can be added to the Zod enum and config shapes.

### 4. Is the combo formula flexible?
**PARTIALLY** | The formula is hardcoded: `rooms + transport + ferry + margin%`. To add dining, activities, or discounts, the calculator service needs code changes. No plugin/rule-engine pattern.

### 5. Are schemas extensible with JSONB?
**YES** | `contactInfo`, `pickupPoints`, `crossProvinceSurcharges`, `config` all use JSONB. Good extensibility.

### 6. Can AI tools adapt to new data?
**MOSTLY** | AI fetchers query DB dynamically. New data shows up automatically. But tool declarations (`gemini-tool-definitions.ts`) have hardcoded enum descriptions (e.g., "cabin, limousine, sleeper"). Adding a new vehicle class requires updating tool descriptions.

---

## D. CODE QUALITY

### D1. Role-based filtering at service layer
**GOOD** | Both `transport-pricing-service.ts` (`stripDiscountForNonAdmin`) and `property-rooms-service.ts` (`listRoomPricing`) filter discount prices based on role at the service layer, not just UI.

### D2. Input validation
**GOOD** | `comboCalculateSchema` validates all inputs with Zod enums, min/max constraints. Route parses body through schema before calling service.

**Gap:** Route does NOT have try-catch for Zod parse errors:
```ts
// combo-calculator-routes.ts line 13
const dto = comboCalculateSchema.parse(body); // throws ZodError, no catch
```
This relies on global error middleware. Verify that exists.

### D3. Error handling for missing data
**MINOR** gaps:
- `resolveRoomCandidates` returns empty array if no rooms match -- calculator proceeds with 0 room cost (misleading, not an error)
- `resolveTransportLine` returns null if no provider found -- handled correctly
- `resolveMarket` (from ai-data-fetchers) presumably throws if market not found -- needs verification

### D4. N+1 query problem
**MAJOR** | `combo-room-allocator.ts` lines 41-64:
```ts
for (const prop of props) {       // N properties
  const rooms = ...;              // 1 query per property
  for (const room of rooms) {     // M rooms per property
    const [price] = ...;          // 1 query per room
  }
}
```
This is O(N*M) database queries. For a market with 10 properties and 5 rooms each = 60 queries per calculation. Should use JOINs or batch queries.

### D5. DRY principle
**MINOR** issues:
- `fmtVnd` function duplicated in: `combo-result-card.tsx`, `room-pricing-table.tsx`, `transport-pricing-editor.tsx`, `ai-transport-fetchers.ts`. Should be a shared utility.
- `selectCls` CSS string duplicated in `combo-calculator-page.tsx`, `transport-providers-tab.tsx`, `transport-pricing-editor.tsx`.

### D6. Security: discount prices never leak to non-admin
**GOOD** | Multiple layers of protection:
1. Service layer strips discount fields for non-admin roles
2. Calculator service only populates discount fields when `isAdmin`
3. Frontend conditionally renders discount sections with `isAdmin` check
4. AI fetcher explicitly uses `role="user"` for combo formatting

### D7. File sizes
All files reviewed are within the 200-line limit except:
- `transport-providers-tab.tsx`: 278 lines (over limit)
- `transport-pricing-editor.tsx`: 287 lines (over limit)
- `room-pricing-table.tsx`: 251 lines (over limit)
- `market-data-extra-routes.ts`: 314 lines (over limit)

### D8. Missing React key on Fragment
**MINOR** | `transport-providers-tab.tsx` line 160-216 uses `<>` (Fragment) inside `.map()` without a key on the Fragment:
```tsx
{items.map((item) => (
  <>    // <-- No key on Fragment
    <TR key={item.id}>...</TR>
    {expandedId === item.id && <TR key={...}>...</TR>}
  </>
))}
```
React will warn. Use `<Fragment key={item.id}>` instead.

---

## SUMMARY SCORES

| Area | Score | Notes |
|------|-------|-------|
| Coverage | **5/10** | Multi-night mixed-day, season, cross-province surcharge, one-way transport, child room occupancy all missing |
| Admin Control | **8/10** | Solid CRUD, role filtering. Missing: profit margin override in UI, cross-province surcharge editor |
| Flexibility | **7/10** | Good JSONB extensibility, DB-driven markets. Hardcoded frontend options reduce flexibility |
| Code Quality | **7/10** | Clean separation, good role filtering. N+1 queries and file size issues |

---

## TOP 5 PRIORITY FIXES

1. **[CRITICAL] Multi-night mixed-day pricing** -- Accept array of dayTypes or date range, sum per-night costs. Every weekend booking is wrong without this.

2. **[MAJOR] Season-aware room pricing** -- Calculator must filter by current date against `seasonStart`/`seasonEnd`, with "default" fallback. Schema supports it, logic doesn't.

3. **[MAJOR] N+1 queries in room allocator** -- Rewrite `resolveRoomCandidates` with a single JOIN query: `marketProperties -> propertyRooms -> roomPricing`. Replace nested loops with one batch query.

4. **[MAJOR] Apply cross-province surcharges** -- Data exists, UI shows it in AI output, but calculator ignores it. Add pickup province to request, apply surcharge per person.

5. **[MAJOR] One-way transport option** -- Add `tripType` to request. Many customers only need one-way (e.g., they have their own car for return). Currently forces roundtrip pricing.

---

## SECONDARY FIXES

6. **[MAJOR] `extraChildSurcharge` never applied** -- Schema field is dead code in calculator. Either use it or remove it.
7. **[MAJOR] Children counted in room capacity** -- Under-5 children should not consume room slots.
8. **[MINOR] Frontend profit margin override missing for admin** -- Backend ready, UI not wired up.
9. **[MINOR] Hardcoded vehicle classes in frontend** -- Should be data-driven from API or pricingOptions table.
10. **[MINOR] fmtVnd and selectCls duplicated** -- Extract to shared utility.
11. **[MINOR] File size violations** -- 4 files over 200 lines, need refactoring.
12. **[MINOR] Fragment key warning** -- `transport-providers-tab.tsx` map needs keyed Fragment.

---

## UNRESOLVED QUESTIONS

1. Is dining pricing intended to be part of the combo total, or is it always a separate add-on? This determines whether `diningType` needs to be added to the calculator.
2. Should the greedy room allocator prefer keeping groups in the same property, or is cross-property allocation acceptable?
3. Is the `per_night` comboType used in practice? The `nightsToComboType` function maps 3+ nights to `per_night`, but are there pricing entries seeded for it?
4. How should the system handle the case where `resolveRoomCandidates` returns zero candidates? Currently returns 0 room cost silently -- should this error?
5. Are `pricePlus1`/`priceMinus1` price columns (for standard+1 / standard-1 occupancy) intended to be used by the calculator? Currently the calculator only uses `underStandardPrice` and `extraAdultSurcharge`, ignoring the plus/minus-1 columns.
