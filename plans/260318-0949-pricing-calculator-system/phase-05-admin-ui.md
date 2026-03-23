# Phase 5: Admin UI Components

## Context Links
- Market detail page: `apps/web/src/pages/market-detail-page.tsx` (tab host)
- Transportation tab pattern: `apps/web/src/components/market-data/transportation-tab.tsx` (CRUD tab reference)
- Room pricing table: `apps/web/src/components/market-data/room-pricing-table.tsx` (existing pricing UI)
- Property rooms editor: `apps/web/src/components/market-data/property-rooms-editor.tsx`
- Properties tab: `apps/web/src/components/market-data/properties-tab.tsx`
- Pricing options manager: `apps/web/src/components/market-data/pricing-options-manager.tsx`
- Shared types: `packages/shared/src/types/market-property-types.ts`
- API client: `apps/web/src/lib/api-client.ts`
- Auth hook: `apps/web/src/hooks/use-auth.ts` (provides user.role)

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Admin UI for managing transport providers/pricing, updated room pricing form with dual-price fields, combo calculator page

## Key Insights
- Follow exact UI pattern from `transportation-tab.tsx`: query + table + dialog CRUD + delete confirm
- Room pricing table already has CRUD - extend form with new fields, show discount column for admin
- Transport providers tab is a NEW tab in market detail page
- Combo calculator is a standalone page (not a tab) - accessible from sidebar
- Use `useAuth()` hook to check `user.role === "admin"` for showing discount fields
- All text in Vietnamese (consistent with existing UI)

## Requirements

### UI Components Needed

1. **Transport Providers Tab** - new tab in market detail page
   - Table: provider name, category (bus/ferry), route, pricing count
   - CRUD dialog: name, code, category, route, pickup points, contact
   - Nested: transport pricing table per provider

2. **Transport Pricing Table** - nested inside provider row (expandable)
   - Table: vehicle class, seat type, one-way price, round-trip price, child policy
   - CRUD dialog: all pricing fields
   - Discount columns visible only to admin

3. **Updated Room Pricing Form** - extend existing dialog
   - Add fields: discountPrice, underStandardPrice, extraAdultSurcharge, extraChildSurcharge, includedAmenities
   - Show discount column in pricing grid (admin-only)

4. **Combo Calculator Page** - standalone page
   - Form: market selector, property selector, guest counts, nights, day type, transport/ferry class
   - Result: itemized breakdown card, per-person price
   - Admin sees both listed + discount totals

## Architecture

```
market-detail-page.tsx
  |-- (existing tabs)
  |-- NEW: TransportProvidersTab
        |-- transport-providers-tab.tsx (provider list + CRUD)
        |-- transport-pricing-editor.tsx (pricing rows per provider)

room-pricing-table.tsx (MODIFY: add discount fields)

pages/
  |-- combo-calculator-page.tsx (NEW standalone page)
```

## Related Code Files

### Files to CREATE:
1. `apps/web/src/components/market-data/transport-providers-tab.tsx` (~190 lines)
2. `apps/web/src/components/market-data/transport-pricing-editor.tsx` (~180 lines)
3. `apps/web/src/pages/combo-calculator-page.tsx` (~190 lines)

### Files to MODIFY:
1. `apps/web/src/pages/market-detail-page.tsx` - add "Nhà xe/tàu" tab
2. `apps/web/src/components/market-data/room-pricing-table.tsx` - add discount fields to form + display
3. `apps/web/src/lib/router.tsx` (or equivalent) - add combo calculator route
4. `packages/shared/src/types/market-property-types.ts` - add TransportProvider, TransportPricing types (if not done in Phase 1)

## Implementation Steps

### Step 1: Create transport-providers-tab.tsx

Follow `transportation-tab.tsx` pattern exactly:
- `useQuery` for GET `/markets/:marketId/transport-providers`
- Table columns: Name, Code, Category (badge: bus/ferry), Route, Pricing count, AI toggle, Actions
- Dialog with form fields: providerName, providerCode, transportCategory (select: bus/ferry), routeName, pickupPoints (textarea JSON), contactInfo, notes
- Delete confirmation
- Each row expandable to show `TransportPricingEditor` component

```tsx
interface TransportProvidersTabProps {
  marketId: string;
  isAdmin: boolean;
}
```

Category badges:
```tsx
<span className={cn(
  "px-2 py-0.5 rounded text-xs font-medium",
  item.transportCategory === "bus"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
)}>
  {item.transportCategory === "bus" ? "Xe khách" : "Tàu/Phà"}
</span>
```

### Step 2: Create transport-pricing-editor.tsx

Similar to `room-pricing-table.tsx` pattern (PricingTable component):
- Props: `{ providerId: string; isAdmin: boolean }`
- `useQuery` for GET `/transport-providers/:providerId/pricing`
- Grid display grouped by vehicleClass
- Each row shows: seat type, capacity, one-way listed, round-trip listed
- Admin sees additional columns: one-way discount, round-trip discount
- CRUD dialog fields:
  - vehicleClass (select: cabin, limousine, sleeper, speed_boat, small_boat)
  - seatType (select: single, double, front, middle, back, vip, standard)
  - capacityPerUnit (number)
  - onewayListedPrice (number, required)
  - onewayDiscountPrice (number, admin-only)
  - roundtripListedPrice (number)
  - roundtripDiscountPrice (number, admin-only)
  - childFreeUnder (number, default 5)
  - childDiscountUnder (number, default 10)
  - childDiscountAmount (number)
  - onboardServices (text)

**Discount field visibility:**
```tsx
{isAdmin && (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-orange-600">Giá chiết khấu 1 chiều</label>
    <Input type="number" ... />
  </div>
)}
```

### Step 3: Update room-pricing-table.tsx

Add to the PricingForm type:
```ts
type PricingForm = {
  // ...existing fields
  discountPrice: string;
  underStandardPrice: string;
  extraAdultSurcharge: string;
  extraChildSurcharge: string;
  includedAmenities: string;
};
```

In the pricing grid display, add discount column for admin:
```tsx
// After existing price display:
{isAdmin && p.discountPrice && (
  <span className="text-xs text-orange-600 ml-1">
    CK: {fmtVnd(p.discountPrice)}
  </span>
)}
```

In the dialog form, add new fields after existing ones:
```tsx
{isAdmin && (
  <>
    <div className="col-span-2 border-t pt-3 mt-1">
      <p className="text-xs font-semibold text-orange-600 uppercase">Giá chiết khấu (Admin)</p>
    </div>
    {/* discountPrice, underStandardPrice fields */}
  </>
)}
{/* extraAdultSurcharge, extraChildSurcharge, includedAmenities - visible to all */}
```

### Step 4: Add tab to market-detail-page.tsx

Add to TABS array (after "transportation"):
```ts
{ id: "transport-providers", label: "Nhà xe/tàu" },
```

Add import and render:
```tsx
import { TransportProvidersTab } from "@/components/market-data/transport-providers-tab";

{activeTab === "transport-providers" && (
  <TransportProvidersTab marketId={market.id} isAdmin={isAdmin} />
)}
```

### Step 5: Create combo-calculator-page.tsx

Standalone page with:
- **Left panel:** Input form
  - Market selector (dropdown from `/markets`)
  - Property selector (dropdown from `/markets/:id/properties`, optional)
  - numAdults, numChildrenUnder10, numChildrenUnder5 (number inputs)
  - numNights (select: 1, 2, 3+)
  - dayType (select from pricing options)
  - transportClass (select: cabin, limousine, sleeper, none)
  - ferryClass (select: speed_boat, small_boat, none)
  - "Tính giá" button

- **Right panel:** Result display
  - Itemized breakdown card (rooms, transport, ferry, addons)
  - Subtotal, margin, grand total
  - Per person price (large, highlighted)
  - Admin: discount prices shown in orange below listed prices
  - Empty state: "Nhập thông tin để tính giá combo"

API call: POST `/api/v1/combo-calculator/calculate`

### Step 6: Add route for combo calculator page

In router config, add:
```tsx
{ path: "/combo-calculator", element: <ComboCalculatorPage /> }
```

Add sidebar navigation item (if sidebar component exists).

## Todo List
- [ ] Create transport-providers-tab.tsx
- [ ] Create transport-pricing-editor.tsx
- [ ] Update room-pricing-table.tsx with discount fields + admin visibility
- [ ] Add transport providers tab to market-detail-page.tsx
- [ ] Create combo-calculator-page.tsx
- [ ] Add combo calculator route to router
- [ ] Verify all forms work with backend APIs (manual test)

## Success Criteria
- Admin can CRUD transport providers and their pricing from market detail page
- Admin sees discount prices in orange; staff sees only listed prices
- Room pricing form includes new fields (discount, surcharge, amenities)
- Combo calculator page accepts input and displays breakdown
- All UI text in Vietnamese
- Components under 200 lines each

## Risk Assessment
- **UI complexity:** Transport pricing editor nested inside providers tab may feel heavy. Using expandable rows (accordion pattern) keeps it manageable.
- **Form validation:** Rely on backend Zod validation; frontend shows error messages from API response (existing pattern in `room-pricing-table.tsx`).

## Security Considerations
- Discount price fields rendered ONLY when `isAdmin === true` (from `useAuth()` hook)
- Even if DOM is inspected, discount data is null in API response for non-admin (server-side filtering in Phase 2)
- Double protection: client hides UI + server strips data
