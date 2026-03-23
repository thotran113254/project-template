# Phase 3: Combo Calculator Service

## Context Links
- Existing pricing service: `apps/api/src/modules/pricing/pricing-service.ts` (old hotel-based calc, separate concern)
- Pricing configs schema: `apps/api/src/db/schema/pricing-configs-schema.ts` (stores profit_margin, combo_formula rules)
- Room pricing schema: `apps/api/src/db/schema/room-pricing-schema.ts`
- Transport pricing schema (Phase 1): `apps/api/src/db/schema/transport-pricing-schema.ts`
- Shared types: `packages/shared/src/types/pricing-types.ts`

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Build the combo pricing calculator: (sum of all service costs * profit margin %) / number of people

## Key Insights

### The Combo Formula
```
totalPerPerson = (roomCost + transportCost + ferryCost + addonCost) * (1 + profitMargin%) / numberOfPeople
```

### Room allocation logic (from spreadsheet)
Given N people and available room types, the system allocates rooms optimally:
- Example: 5 people, 2 rooms needed -> 1 single (2p) + 1 double (4p) = 6 capacity (1 extra)
- The service should suggest room combos, not require manual room selection
- But admin/AI can also specify exact rooms

### What the calculator needs as INPUT:
1. `marketSlug` - which destination
2. `propertySlug` (optional) - specific hotel, or auto-suggest
3. `numPeople` - total guests (adults + children breakdown)
4. `numNights` - e.g., 2 for "2N1D" means 2 days 1 night
5. `dayType` - weekday/friday/saturday/holiday
6. `transportType` (optional) - bus class preference
7. `ferryNeeded` (boolean) - island destination?
8. `addons` (optional) - list of add-on services

### What the calculator OUTPUTS:
1. Room allocation breakdown (which rooms, how many)
2. Transport breakdown per person
3. Ferry breakdown per person (if applicable)
4. Add-on costs
5. Subtotal before margin
6. Profit margin applied
7. **Total per person (listed price)**
8. **Total per person (discount price)** - admin only
9. Grand total for group

## Requirements

### Functional
1. Accept combo request with people count, dates/day type, market, optional property
2. Auto-allocate rooms from available inventory when no specific property chosen
3. Calculate transport cost per person based on vehicle class
4. Calculate ferry cost per person if applicable
5. Apply profit margin from `pricing_configs` (ruleType = "profit_margin")
6. Return itemized breakdown + totals
7. Support both listed and discount price calculations

### Non-functional
- Calculator is a pure service function (no DB writes)
- Must handle edge cases: odd group sizes, children pricing, under-standard rooms
- Response must be structured for both API consumption and AI tool formatting

## Architecture

```
combo-calculator-service.ts
  |
  +-- resolveRoomAllocation(marketId, propertySlug?, numPeople, comboType, dayType)
  |     -> queries room_pricing, returns optimal room combo
  |
  +-- resolveTransportCost(marketId, numPeople, adults, children, vehicleClass?)
  |     -> queries transport_pricing, returns per-person cost
  |
  +-- resolveFerryCost(marketId, numPeople, adults, children, boatType?)
  |     -> queries transport_pricing where category="ferry"
  |
  +-- calculateCombo(input) -> ComboCalculationResult
        -> orchestrates above, applies margin, returns breakdown
```

## Related Code Files

### Files to CREATE:
1. `apps/api/src/modules/pricing/combo-calculator-service.ts` (~180 lines)
2. `apps/api/src/modules/pricing/combo-calculator-routes.ts` (~60 lines)

### Files to MODIFY:
1. `packages/shared/src/types/pricing-types.ts` - add ComboCalculationResult, ComboCalculateRequest types
2. `packages/shared/src/schemas/pricing-schemas.ts` - add comboCalculateSchema Zod validator
3. `apps/api/src/routes/index.ts` - mount combo calculator routes

## Implementation Steps

### Step 1: Add shared types to pricing-types.ts

```ts
export interface ComboCalculateRequest {
  marketSlug: string;
  propertySlug?: string;       // specific property or auto-allocate
  numAdults: number;
  numChildrenUnder10: number;   // 100k surcharge
  numChildrenUnder5: number;    // free
  numNights: number;            // 1 for 2n1d, 2 for 3n2d
  dayType: string;              // weekday, friday, saturday, holiday
  transportClass?: string;      // cabin, limousine, sleeper (optional)
  ferryClass?: string;          // speed_boat, small_boat (optional, null = no ferry)
  addons?: ComboAddon[];
  profitMarginOverride?: number; // admin can override default margin
}

export interface ComboAddon {
  name: string;       // "squid_fishing", "island_tour", etc.
  pricePerPerson: number;
  quantity: number;    // usually = numPeople
}

export interface ComboCalculationResult {
  input: { numPeople: number; numNights: number; dayType: string };
  rooms: ComboRoomAllocation[];
  transport: ComboTransportLine | null;
  ferry: ComboTransportLine | null;
  addons: { name: string; total: number }[];
  subtotal: number;              // sum before margin
  profitMarginPercent: number;
  marginAmount: number;
  grandTotal: number;            // after margin
  perPerson: number;             // grandTotal / numPeople
  // Admin-only fields (null for staff)
  discountSubtotal: number | null;
  discountGrandTotal: number | null;
  discountPerPerson: number | null;
  breakdown: ComboBreakdownLine[];
}

export interface ComboRoomAllocation {
  propertyName: string;
  roomType: string;
  roomCode: string | null;
  quantity: number;
  guestsPerRoom: number;
  pricePerRoom: number;           // listed
  discountPricePerRoom: number | null; // admin-only
  totalRoomCost: number;
  totalDiscountCost: number | null;
}

export interface ComboTransportLine {
  providerName: string;
  vehicleClass: string;
  seatType: string;
  pricePerPerson: number;         // listed, round-trip
  discountPerPerson: number | null;
  totalPeople: number;
  totalCost: number;
  totalDiscountCost: number | null;
}

export interface ComboBreakdownLine {
  label: string;
  listedAmount: number;
  discountAmount: number | null;
}
```

### Step 2: Add Zod schema to pricing-schemas.ts

```ts
export const comboCalculateSchema = z.object({
  marketSlug: z.string().min(1),
  propertySlug: z.string().optional(),
  numAdults: z.number().int().min(1),
  numChildrenUnder10: z.number().int().min(0).default(0),
  numChildrenUnder5: z.number().int().min(0).default(0),
  numNights: z.number().int().min(1).max(30),
  dayType: z.string().min(1),
  transportClass: z.string().optional(),
  ferryClass: z.string().optional(),
  addons: z.array(z.object({
    name: z.string(),
    pricePerPerson: z.number().int().min(0),
    quantity: z.number().int().min(1),
  })).optional(),
  profitMarginOverride: z.number().min(0).max(100).optional(),
});
```

### Step 3: Create combo-calculator-service.ts

Core algorithm for `resolveRoomAllocation`:
```
1. Fetch all rooms for property (or all properties in market) with pricing for given comboType+dayType
2. Sort rooms by capacity descending
3. Greedy allocation: fill largest rooms first, then smaller
4. For remaining people that don't fill a room exactly, use under-standard pricing if available
5. Return allocation array
```

Core algorithm for `calculateCombo`:
```
1. numPeople = numAdults + numChildrenUnder10 + numChildrenUnder5
2. Map numNights to comboType: 1 night -> "2n1d", 2 nights -> "3n2d", else "per_night"
3. resolveRoomAllocation -> roomCost (listed + discount)
4. resolveTransportCost -> transportCost (with child discounts applied)
5. resolveFerryCost -> ferryCost (if ferryClass provided)
6. addonCost = sum of addon quantities * prices
7. subtotal = roomCost + transportCost + ferryCost + addonCost
8. Load profitMargin from pricing_configs (ruleType="profit_margin") or use override
9. grandTotal = subtotal * (1 + margin/100)
10. perPerson = grandTotal / numPeople
11. Repeat for discount prices (admin path)
12. Return structured result
```

Transport child pricing logic:
```
- Under 5: free (count = numChildrenUnder5, cost = 0)
- 5-10: listed_price - child_discount_amount (from transport_pricing row)
- 11+: adult price (counted in numAdults)
```

### Step 4: Create combo-calculator-routes.ts

```ts
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { comboCalculateSchema } from "@app/shared";
import * as comboService from "./combo-calculator-service.js";

export const comboCalculatorRoutes = new Hono();
comboCalculatorRoutes.use("*", authMiddleware);

// POST /combo-calculator/calculate
comboCalculatorRoutes.post("/calculate", async (c) => {
  const body = await c.req.json();
  const dto = comboCalculateSchema.parse(body);
  const user = c.get("user");
  const result = await comboService.calculateCombo(dto, user.role);
  return c.json({ success: true, data: result });
});
```

### Step 5: Mount routes in routes/index.ts

```ts
import { comboCalculatorRoutes } from "../modules/pricing/combo-calculator-routes.js";
routes.route("/combo-calculator", comboCalculatorRoutes);
```

## Todo List
- [ ] Add shared types (ComboCalculateRequest, ComboCalculationResult, etc.)
- [ ] Add comboCalculateSchema Zod validator
- [ ] Create combo-calculator-service.ts with room allocation + cost calculation
- [ ] Create combo-calculator-routes.ts
- [ ] Mount routes in index.ts
- [ ] Run typecheck

## Success Criteria
- POST `/api/v1/combo-calculator/calculate` returns correct breakdown
- Room allocation handles odd group sizes correctly
- Child pricing discounts applied correctly for transport/ferry
- Profit margin loaded from DB or override
- Discount prices null for non-admin callers
- `pnpm typecheck` passes

## Risk Assessment
- **Room allocation complexity:** Greedy algorithm may not be optimal for all cases. Acceptable for MVP; can optimize later (YAGNI).
- **Missing pricing data:** If no pricing rows match the requested comboType+dayType, return clear error message not a crash.
- **Profit margin missing:** Default to 0% margin if no pricing_configs entry found, with a warning in response.

## Security Considerations
- Discount totals MUST be null when `userRole !== "admin"`
- `profitMarginOverride` should be admin-only (ignore for staff role)
