# Pricing Calculator System Exploration Report

**Date:** 2026-03-21  
**Scope:** Room pricing, transport pricing, seasons, options, and combo calculator logic

---

## Overview

The project implements a **dual-mode pricing system** for travel itineraries:

1. **Legacy Pricing Rules** - Simple multiplier-based seasonal rules
2. **New Combo Calculator** - Complex multi-dimensional pricing for room + transport bundles

The new system is production-ready and handles:
- Mixed-day bookings (different day types per night)
- One-way vs roundtrip transport pricing
- Cross-province transport surcharges
- Child age categories (under-5 free, under-10 discounted)
- Extra guest surcharges (beyond standard capacity)
- Dual pricing (listed vs discount prices) for admin visibility

---

## Pricing Schema & Data Model

### Room Pricing (Database)

**File:** `/home/automation/project-template/apps/api/src/db/schema/room-pricing-schema.ts`

Core dimensions:
- **comboType**: `2n1d`, `3n2d`, `per_night` (night count categories)
- **dayType**: `weekday`, `friday`, `saturday`, `sunday`, `holiday`
- **seasonName**: `"default"` (supports future expansions)
- **standardGuests**: baseline occupancy (typically 2)

Price variants per room:
- `price` / `discountPrice` - base rate and admin-visible discount
- `pricePlus1` / `priceMinus1` - variants for ±1 guest (reserved for future)
- `underStandardPrice` - reduced rate when guests < standardGuests
- `extraAdultSurcharge` / `extraChildSurcharge` - per-person add-ons
- `extraNight` - multi-night adjustment (reserved for future)

**Key Index:** `(roomId, comboType, dayType, seasonName)` - enforces unique combo type per day type per room.

### Transport Pricing (Database)

**File:** `/home/automation/project-template/apps/api/src/db/schema/transport-pricing-schema.ts`

Price dimensions:
- **vehicleClass**: `cabin`, `limousine`, `sleeper` (bus); `speed_boat`, `small_boat` (ferry)
- **seatType**: seat arrangement descriptor
- **Trip type**: `oneway` vs `roundtrip` (from request, not stored)
- **Child tiers**:
  - `childFreeUnder` (default 5) - free travel
  - `childDiscountUnder` (default 10) - discounted rate
  - `childDiscountAmount` - surcharge reduction

Cross-province surcharges:
- Stored as JSONB array: `[{ province: "Quảng Ninh", surcharge: 50000 }, ...]`
- Applied to paying passengers only (adults + children aged 5-10)
- Multiplied by passenger count

---

## Combo Calculator Calculation Flow

### Endpoint

**POST `/api/v1/combo-calculator/calculate`**
- Requires authentication
- Input validated by `comboCalculateSchema` (Zod)
- Returns: `ComboCalculationResult`

### Main Logic

**File:** `/home/automation/project-template/apps/api/src/modules/pricing/combo-calculator-service.ts`

**High-level flow:**

```
1. Normalize day types (handle mixed-day arrays or fallback to single repeated dayType)
2. Resolve room candidates for ALL dayTypes in single JOIN query
   - Filters: market, property (optional), comboType, dayTypes, "default" season
   - Groups by roomId, collects prices per dayType
   - Only returns rooms with complete pricing for ALL requested dayTypes
3. Allocate rooms greedily (largest capacity first)
   - Handles guest-to-room mapping
   - Calculates per-night cost with surcharges per dayType
   - Sums across all nights (nightsPerDayType)
   - Merges identical room allocations
4. Resolve transport (bus + ferry separately)
   - Queries by market, category, vehicleClass
   - Selects first matching provider + pricing row
5. Apply cross-province surcharges
   - Query surcharge array, match by province
   - Multiply by paying passengers
6. Calculate profit margin
   - Load from pricingConfigs or use override
   - Apply to subtotal (rooms + transport + ferry)
7. Return breakdown: listed vs discount prices (admin only), per-person cost
```

### Input Schema

**File:** `packages/shared/src/schemas/market-property-schemas.ts` (lines 172-193)

```typescript
comboCalculateSchema = z.object({
  marketSlug: string;           // required
  propertySlug?: string;        // optional property filter
  numAdults: number;            // >= 1
  numChildrenUnder10: number;   // >= 0 (default 0)
  numChildrenUnder5: number;    // >= 0 (default 0), free transport, share bed
  numNights: number;            // 1-30
  dayTypes?: string[];          // ["weekday", "friday", "saturday"] - one per night
  dayType?: string;             // fallback: all nights same type (backward compat)
  transportClass?: string;      // cabin, limousine, sleeper
  ferryClass?: string;          // speed_boat, small_boat
  profitMarginOverride?: number;  // admin only
  departureProvince?: string;   // for cross-province surcharge
  tripType?: "oneway"|"roundtrip"; // default: roundtrip
})
```

### Output Schema

**File:** `packages/shared/src/types/combo-calculator-types.ts`

```typescript
ComboCalculationResult {
  input: { numPeople, numNights, dayType, dayTypes?, tripType? }
  rooms: ComboRoomAllocation[]  // room selections with costs
  transport: ComboTransportLine | null
  ferry: ComboTransportLine | null
  subtotal: number
  profitMarginPercent: number    // admin only
  marginAmount: number           // admin only
  grandTotal: number
  perPerson: number              // cost per traveler
  discountSubtotal: number | null  // admin only
  discountGrandTotal: number | null
  discountPerPerson: number | null
  warnings?: string[]           // e.g., "no rooms found"
}
```

---

## Key Calculation Functions

### 1. Room Allocation (`combo-room-allocator.ts`)

**Function:** `allocateRoomsMultiDay()`

**Logic:**
- Takes list of `RoomCandidateMultiDay` (rooms with prices keyed by dayType)
- Greedily allocates rooms largest-capacity first
- For each room, sums cost across all nights:
  ```
  totalRoomCost = sum(price_per_night[dayType] * nights_of_dayType)
  ```
- Handles surcharges:
  - Under-standard guests: `underStandardPrice`
  - Extra adults: `extraAdultSurcharge` per person
  - Extra children: `extraChildSurcharge` per person
- Returns merged allocations (combines identical room types at same price)

**Admin Feature:** Tracks both listed (`totalRoomCost`) and discount (`totalDiscountCost`) prices.

**Multi-day Example:**
- Booking: 2 nights (Thu + Fri), 3 guests
- Thu (weekday): price = 100k, extraAdult surcharge = 20k
- Fri (friday): price = 150k, extraAdult surcharge = 25k
- Room capacity = 2 (1 standard + 1 extra adult)
- Total = (100k + 20k) * 1 + (150k + 25k) * 1 = 295k

### 2. Transport Pricing (`combo-transport-resolver.ts`)

**Function:** `resolveTransportLine()`

**Trip Type Logic:**
```javascript
const isRoundtrip = tripType !== "oneway";
const basePrice = isRoundtrip 
  ? (roundtripListedPrice ?? onewayListedPrice)
  : onewayListedPrice;
```

**Passenger Categorization:**
- `childFreeCount` = numChildrenUnder5 (free)
- `childDiscountCount` = numChildrenUnder10 (discounted)
- Adults pay full price

**Cost Calculation:**
```
adultCost = numAdults * basePrice
childDiscountCost = numChildrenUnder10 * max(0, basePrice - childDiscountAmount)
subtotal = adultCost + childDiscountCost
```

**Cross-Province Surcharge:**
```javascript
if (departureProvince && crossProvinceSurcharges) {
  surcharges = tp.crossProvinceSurcharges
  match = surcharges.find(s => s.province === departureProvince)
  if (match) {
    payingPassengers = numAdults + numChildrenUnder10  // excl. under-5
    surchargeTotal = match.surcharge * payingPassengers
    totalCost += surchargeTotal
  }
}
```

### 3. Profit Margin

**Source:** `pricingConfigs` table (ruleType = "profit_margin")

**Lookup:** Market-specific config, fallback to global config

**Calculation:**
```
marginAmount = round(subtotal * profitMarginPercent / 100)
grandTotal = subtotal + marginAmount
perPerson = round(grandTotal / numPeople)
```

**Admin Override:** Can override percent via `profitMarginOverride` in request.

---

## Supporting Data Models

### Pricing Configs

**Schema:** `packages/shared/src/schemas/market-property-schemas.ts` (lines 132-145)

Rule types:
- `child_policy` - age thresholds
- `extra_guest_policy` - capacity overrides
- `surcharge` - fixed add-ons
- `discount` - seasonal/volume discounts
- `combo_formula` - calculation tweaks
- `profit_margin` - markup percentage (default 0)
- `transport_pricing` - transport overrides
- `dining` - meal inclusions (future)

### Pricing Options

**Schema:** lines 147-158

Categories:
- `combo_type`: `2n1d`, `3n2d`, `per_night` (defines night groupings)
- `day_type`: `weekday`, `friday`, `saturday`, `sunday`, `holiday`
- `season`: `high`, `low`, `default`, custom names

Each option has:
- `optionKey` - machine name
- `label` - display name
- `description` - context
- `config` - JSONB for custom settings
- `sortOrder` - UI ordering
- `isActive` - soft delete
- `aiVisible` - visibility to AI features

---

## API Endpoints

### Legacy Pricing Rules (Simple)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/pricing/rules` | Required | List rules (optionally filter by hotelId) |
| GET | `/api/v1/pricing/rules/:id` | Required | Get single rule |
| POST | `/api/v1/pricing/rules` | Admin | Create multiplier rule |
| PATCH | `/api/v1/pricing/rules/:id` | Admin | Update rule |
| DELETE | `/api/v1/pricing/rules/:id` | Admin | Delete rule |
| POST | `/api/v1/pricing/calculate` | Required | Simple per-room calc (deprecated) |

### Combo Calculator (New)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/combo-calculator/calculate` | Required | Full room + transport combo pricing |

---

## Key Files Summary

### Core Logic
- `/home/automation/project-template/apps/api/src/modules/pricing/combo-calculator-service.ts` - Main orchestrator
- `/home/automation/project-template/apps/api/src/modules/pricing/combo-room-allocator.ts` - Room allocation & multi-day cost
- `/home/automation/project-template/apps/api/src/modules/pricing/combo-transport-resolver.ts` - Transport cost with surcharges
- `/home/automation/project-template/apps/api/src/modules/pricing/combo-calculator-routes.ts` - Route handler

### Database
- `/home/automation/project-template/apps/api/src/db/schema/room-pricing-schema.ts` - Room pricing dimensions
- `/home/automation/project-template/apps/api/src/db/schema/transport-pricing-schema.ts` - Transport pricing with cross-province surcharges
- `/home/automation/project-template/apps/api/src/db/schema/pricing-configs-schema.ts` - Configuration rules

### Shared
- `packages/shared/src/types/combo-calculator-types.ts` - TypeScript interfaces
- `packages/shared/src/schemas/market-property-schemas.ts` - Zod validation schemas (comboCalculateSchema, pricing option/config schemas)
- `packages/shared/src/types/pricing-types.ts` - Legacy rule interfaces

---

## Notable Design Decisions

1. **No per-night breakdown in response** - Total cost only; individual night costs computed internally
2. **Multi-day support via arrays** - `dayTypes: ["weekday", "friday", "saturday"]` allows flexible booking patterns
3. **Backward compat** - Single `dayType` string still works (repeated for all nights)
4. **Single JOIN for rooms** - All dayTypes fetched in one query (no N+1), only returns complete candidates
5. **Profit margin isolation** - Separate config entity, not baked into room/transport pricing
6. **Admin vs user view** - Discount prices hidden from users (null); admins see both listed and discount
7. **Child categorization** - Three tiers (under-5 free, 5-10 discounted, 10+ full) rather than flexible
8. **Cross-province model** - Stored as JSONB array for flexibility; only applies to paying passengers
9. **Trip type toggle** - Simple boolean logic, defaults to roundtrip
10. **Season filtering** - Hardcoded "default" season in queries (prep for multi-season feature)

---

## Unresolved Questions

1. How are `pricePlus1` / `priceMinus1` / `extraNight` fields used? Currently mapped but never applied in calculations.
2. Does the system support multiple seasons per room (not just "default")?
3. Is the `profit_margin` config expected to be market-specific or global?
4. What triggers `warnings` in the response beyond "no rooms found"?
5. Are transport providers expected to be market-specific (current design assumes one per market per category)?
