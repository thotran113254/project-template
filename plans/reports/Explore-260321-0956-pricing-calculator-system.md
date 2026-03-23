# Pricing Calculator System Exploration

**Date:** March 21, 2026  
**Status:** Complete  
**Scope:** All pricing-related files across backend, frontend, and shared packages

## Summary

This project implements a **comprehensive pricing calculator system** supporting multi-day combo packages with flexible pricing dimensions (combo types, day types, seasons). The system uses a market-based architecture with room pricing, transport pricing, and configurable business rules.

**Key Architecture:** 
- 5 database schemas for pricing (room, transport, config, options, legacy)
- 6 backend services managing pricing data
- 1 main combo calculator service with room allocator & transport resolver
- 8+ frontend components for pricing admin UI
- Dual-price system (listed + admin-only discount)
- Multi-day support with per-night day-type variations

---

## 1. Database Schemas

### 1.1 Legacy Pricing (deprecated)
**File:** `apps/api/src/db/schema/pricing-rules-schema.ts`  
**Table:** `pricing_rules`

Simple hotel-room multiplier rules. Not actively used; replaced by market-based system.

**Fields:**
- `hotelId` (FK), `name`, `seasonStart`, `seasonEnd`
- `multiplier` (1.00-9.99 range for seasonal adjustments)
- `minNights`, `adminNotes`

**Use Case:** Historical data; maintain for backward compatibility

---

### 1.2 Room Pricing (Primary)
**File:** `apps/api/src/db/schema/room-pricing-schema.ts`  
**Table:** `room_pricing`

Core pricing data for accommodation, supporting multiple pricing dimensions and guest count variants.

**Key Fields:**
- `roomId` (FK to propertyRooms)
- `comboType` (3n2d, 2n1d, per_night)
- `dayType` (weekday, friday, saturday, sunday, holiday)
- `seasonName` (default, custom seasons)
- `price` (base), `discountPrice` (admin-only)
- **Guest count variants:**
  - `standardGuests` (capacity for base price)
  - `pricePlus1`, `priceMinus1` (adjusted prices for +/-1 guest)
  - `underStandardPrice` (reduced occupancy)
- **Surcharges:**
  - `extraAdultSurcharge`, `extraChildSurcharge` (per person)
  - `extraNight` (additional night price)
- `includedAmenities`, `notes`, `aiVisible`

**Unique Index:** `(roomId, comboType, dayType, seasonName)`

**Example Data:** 3N2D weekday for 2 guests = 1,500,000 VND; +1 guest = 1,800,000 VND

---

### 1.3 Transport Pricing
**File:** `apps/api/src/db/schema/transport-pricing-schema.ts`  
**Table:** `transport_pricing`

Bus, ferry, and other transport pricing with trip-type (oneway/roundtrip) and child policies.

**Key Fields:**
- `providerId` (FK to transportProviders)
- `vehicleClass` (cabin, limousine, sleeper)
- `seatType` (single, double, front, middle, back, standard)
- `capacityPerUnit`
- **Dual pricing:**
  - `onewayListedPrice`, `onewayDiscountPrice`
  - `roundtripListedPrice`, `roundtripDiscountPrice`
- **Child policies:**
  - `childFreeUnder` (age; default 5)
  - `childDiscountUnder` (age; default 10)
  - `childDiscountAmount` (fixed discount, e.g., 100,000 VND)
- **Surcharges:**
  - `crossProvinceSurcharges` (JSON array: `[{province, surcharge}, ...]`)
- `onboardServices`, `notes`, `sortOrder`, `aiVisible`

**Unique Index:** `(providerId, vehicleClass, seatType)`

**Example Data:** HG cabin single = 400,000 VND oneway; Quảng Ninh surcharge +200,000 VND

---

### 1.4 Pricing Config (Rules)
**File:** `apps/api/src/db/schema/pricing-configs-schema.ts`  
**Table:** `pricing_configs`

Flexible JSONB-based rules for business logic (policies, surcharges, margins).

**Key Fields:**
- `marketId`, `propertyId` (both optional → global or scoped rules)
- `ruleName`, `ruleType` (enum: child_policy, extra_guest_surcharge, transport_pricing, dining_service, profit_margin)
- `config` (JSONB) — stores rule-specific data
- `description`, `isActive`, `aiVisible`, `sortOrder`

**Supported Rule Types:**
1. **child_policy:** Age ranges with charge types (free, percent, fixed)
2. **extra_guest_surcharge:** Per-person/night surcharge over standard capacity
3. **transport_pricing:** Route-specific transport options
4. **dining_service:** Service pricing (hotpot, BBQ, etc.)
5. **profit_margin:** Markup percentage (system or market-wide)

---

### 1.5 Pricing Options (Dimensions)
**File:** `apps/api/src/db/schema/pricing-options-schema.ts`  
**Table:** `pricing_options`

Admin-managed options for combo types and day types. Controls available pricing dimensions.

**Key Fields:**
- `category` (combo_type, day_type)
- `optionKey`, `label`, `description`
- `config` (JSONB, e.g., `{days: 3, nights: 2}`)
- `sortOrder`, `isActive`, `aiVisible`

**Unique Index:** `(category, optionKey)`

**Seed Data:**
- **Combo Types:** 3n2d (3 days 2 nights), 2n1d (2 days 1 night), per_night (flexible)
- **Day Types:** weekday (T2-T5), friday (T6), saturday (T7), sunday (CN), holiday (lễ)

---

## 2. Backend Services

### 2.1 Pricing Service (Legacy)
**File:** `apps/api/src/modules/pricing/pricing-service.ts`  
**Routes:** `/pricing/rules`, `/pricing/calculate`

CRUD operations for legacy pricing rules + simple price calculation.

**Functions:**
- `listRules(hotelId?)`, `getRuleById(id)`
- `createRule(dto)`, `updateRule(id, dto)`, `deleteRule(id)`
- `calculatePrice(dto)` — calculates basePrice × multiplier × nights

**Auth:** authMiddleware (all), adminMiddleware (write)

---

### 2.2 Room Pricing Service
**File:** `apps/api/src/modules/market-data/property-rooms-service.ts`  
**Routes:** `/rooms/:roomId/pricing`

Full CRUD for room pricing. Filters discount prices by user role.

**Key Functions:**
- `listRoomPricing(roomId, userRole)` — strips `discountPrice` if not admin
- `bulkUpsertRoomPricing(roomId, items)` — efficient bulk insert/update
- `createRoomPricing(data)`, `updateRoomPricing(id, data)`, `deleteRoomPricing(id)`

**Auth:** authMiddleware (all), adminMiddleware (write)

---

### 2.3 Transport Pricing Service
**File:** `apps/api/src/modules/market-data/transport-pricing-service.ts`  
**Routes:** `/transport-providers/:providerId/pricing`

Full CRUD for transport pricing. Uses `onConflictDoUpdate` for bulk upsert.

**Key Functions:**
- `listPricingByProvider(providerId, userRole)` — applies `stripDiscountForNonAdmin()`
- `bulkUpsertPricing(providerId, items)` — conflict resolution on (providerId, vehicleClass, seatType)
- `createPricing(data)`, `updatePricing(id, data)`, `deletePricing(id)`

**Auth:** authMiddleware (all), adminMiddleware (write)

---

### 2.4 Pricing Options Service
**File:** `apps/api/src/modules/market-data/pricing-options-service.ts`  
**Routes:** `/pricing-options`

Manages combo types and day types. Cached by frontend for 5 minutes.

**Functions:**
- `listByCategory(category)` — all options
- `listActive(category)` — filtered by `isActive = true`
- `listAll()` — all categories sorted
- CRUD operations

---

### 2.5 Pricing Configs Service
**File:** `apps/api/src/modules/market-data/pricing-configs-service.ts`  
**Routes:** `/pricing-configs`

CRUD for flexible business rules. Used by combo calculator (profit margin lookup).

**Functions:**
- `listPricingConfigs(marketId?, propertyId?)` — filters by scope
- `createPricingConfig(data)`, `updatePricingConfig(id, data)`, `deletePricingConfig(id)`

---

### 2.6 Combo Calculator Service (Core Logic)
**File:** `apps/api/src/modules/pricing/combo-calculator-service.ts`  
**Routes:** `POST /combo-calculator/calculate`

**Main Function:** `calculateCombo(dto: ComboCalculateRequest, userRole: string): ComboCalculationResult`

**Input (ComboCalculateRequest):**
```typescript
{
  marketSlug: string;
  propertySlug?: string;
  numAdults: number;
  numChildrenUnder10: number;
  numChildrenUnder5: number;
  numNights: number;
  dayTypes?: string[];     // Per-night day type, e.g., ["weekday", "friday", "saturday"]
  dayType?: string;        // Single day type (backward compat)
  transportClass?: string; // cabin, limousine, sleeper
  ferryClass?: string;     // speed_boat, small_boat
  tripType?: "oneway" | "roundtrip";
  departureProvince?: string; // For cross-province surcharge
  profitMarginOverride?: number;
}
```

**Process Flow:**
1. Resolve market from slug
2. Determine `comboType` from nights: 1 → 2n1d, 2 → 3n2d, 3+ → per_night
3. Normalize `dayTypes` (supports per-night variations for mixed-day bookings)
4. Query room candidates via single JOIN (avoids N+1 query problem)
5. Allocate rooms based on guest count and surcharge pricing
6. Resolve transport line (bus, ferry)
7. Apply cross-province surcharge if applicable
8. Calculate profit margin from pricingConfigs
9. Return detailed breakdown with warnings

**Output (ComboCalculationResult):**
```typescript
{
  input: { numPeople, numNights, dayType, dayTypes?, tripType? };
  rooms: ComboRoomAllocation[];     // Room allocations
  transport: ComboTransportLine | null;
  ferry: ComboTransportLine | null;
  subtotal: number;
  profitMarginPercent: number;
  marginAmount: number;
  grandTotal: number;
  perPerson: number;
  discountSubtotal: number | null;  // Admin only
  discountGrandTotal: number | null; // Admin only
  discountPerPerson: number | null;  // Admin only
  warnings?: string[];               // Edge case alerts
}
```

**Special Handling:**
- **Multi-day:** Supports `dayTypes` array to assign different day-type pricing per night
- **Mixed-day:** Example: Thu (weekday) + Fri + Sat booking gets varying daily rates
- **Profit margin:** Retrieved from pricingConfigs; override via `profitMarginOverride`
- **Admin visibility:** Returns discountCost fields only if `userRole === "admin"`

---

### 2.7 Room Allocator
**File:** `apps/api/src/modules/pricing/combo-room-allocator.ts`  
**Function:** `resolveRoomCandidatesMultiDay()`

**Optimization:** Single JOIN query instead of N queries per dayType.

**Query:**
```
SELECT properties, rooms, pricing
FROM marketProperties
  JOIN propertyRooms ON ...
  JOIN roomPricing ON ...
WHERE marketId = ? AND (comboType = ?) AND (dayType IN [...])
  AND seasonName = 'default'
GROUP BY roomId
```

**Returns:** Rooms with price maps keyed by dayType. Filters rooms that have pricing for ALL requested dayTypes.

**Guest Allocation Logic:**
- `standardGuests` for base price
- `pricePlus1`/`priceMinus1` for guest count adjustments
- `extraAdultSurcharge`/`extraChildSurcharge` for additional guests
- `underStandardPrice` for reduced occupancy

---

### 2.8 Transport Resolver
**File:** `apps/api/src/modules/pricing/combo-transport-resolver.ts`  
**Function:** `resolveTransportLine()`

**Input:**
- `marketId`, `category` (bus, ferry), `vehicleClass`
- `numAdults`, `numChildrenUnder10`, `numChildrenUnder5`
- `isAdmin`, `tripType`, `departureProvince`

**Pricing Logic:**
1. Lookup provider by marketId + category
2. Lookup pricing by vehicleClass (first match)
3. **Trip type selection:**
   - oneway → `onewayListedPrice`/`onewayDiscountPrice`
   - roundtrip → `roundtripListedPrice` (falls back to oneway)
4. **Child policies:**
   - Children under 5: free
   - Children 5-10: discounted by `childDiscountAmount`
5. **Cross-province surcharge:**
   - If `departureProvince` matches array entry, add surcharge to paying passengers
6. **Admin discount:**
   - Returns `totalDiscountCost` if admin and discount price exists

**Returns:** `ComboTransportLine` with pricePerPerson, totalCost, discounts.

---

## 3. Frontend Components

### 3.1 Pricing Options Hook
**File:** `apps/web/src/hooks/use-pricing-options.ts`

```typescript
usePricingOptions() → {
  comboOptions: PricingOption[];  // Filtered by category='combo_type'
  dayOptions: PricingOption[];    // Filtered by category='day_type'
  comboLabel: (key: string) => string;  // Label lookup
  dayLabel: (key: string) => string;    // Label lookup
  isLoading: boolean;
}
```

Caches for 5 minutes. Used by room/transport pricing forms.

---

### 3.2 Room Pricing Table
**File:** `apps/web/src/components/market-data/room-pricing-table.tsx`

Full CRUD table for room pricing with inline editing.

**Features:**
- Add/edit/delete pricing entries
- Dropdowns for comboType, dayType (populated from `usePricingOptions()`)
- Input fields: price, discountPrice, pricePlus1, priceMinus1, extraNight, surcharges
- Submits to `/rooms/:roomId/pricing` endpoints

---

### 3.3 Transport Pricing Editor
**File:** `apps/web/src/components/market-data/transport-pricing-editor.tsx`

Full CRUD for transport pricing (buses, ferries).

**Inputs:**
- vehicleClass, seatType, capacityPerUnit
- onewayListedPrice, onewayDiscountPrice
- roundtripListedPrice, roundtripDiscountPrice
- childFreeUnder, childDiscountUnder, childDiscountAmount
- **Cross-province surcharges** (text field, parsed as lines: `"Province: amount"`)
- onboardServices, notes

---

### 3.4 Combo Calculator Page
**File:** `apps/web/src/pages/combo-calculator-page.tsx`

User-facing calculator with market/property selection, guest counts, dates, transport.

**Inputs:**
- Market selector, property selector
- numAdults, numChildrenUnder10, numChildrenUnder5
- numNights (1-3 buttons)
- **Per-night day type** (supports different day-type per night, e.g., weekday, friday, saturday)
- transportClass, ferryClass dropdowns
- tripType (roundtrip/oneway)
- departureProvince (for surcharge)
- profitMarginOverride (admin only)

**Output:** `ComboResultCard` with price breakdown.

---

### 3.5 Pricing Options Manager
**File:** `apps/web/src/components/market-data/pricing-options-manager.tsx`

Admin interface to manage combo types and day types.

---

## 4. Seed Data (Hardcoded Initial Values)

### 4.1 Pricing Options
**File:** `apps/api/src/db/seed/data/pricing-options-seed-data.ts`

```
Combo Types:
- 3n2d: 3 days, 2 nights
- 2n1d: 2 days, 1 night
- per_night: Flexible per-night

Day Types:
- weekday (T2-T5): Mon-Thu, [1,2,3,4]
- friday: Fri, [5]
- saturday: Sat, [6]
- sunday: Sun, [0]
- holiday: Peak season
```

---

### 4.2 Transport Pricing
**File:** `apps/api/src/db/seed/data/transport-pricing-seed-data.ts`

**HG Provider (Halong Gulf tours):**
- Cabin Single: 400,000 oneway, 350,000 discount; 800,000 roundtrip, 700,000 discount
- Cabin Double: 600,000 oneway, 500,000 discount; 1,200,000 roundtrip, 1,000,000 discount
- Limousine (front/middle/back): 200-250k oneway, 180-220k discount
- Sleeper Single: 300,000 oneway, 270,000 discount
- **Cross-province surcharges:** Quảng Ninh +200k, Ninh Bình +300k
- **Child policies:** Free <5y, 100k discount <10y

**NH Provider:**
- Limousine Standard: 220k oneway, 200k discount

---

### 4.3 Pricing Configs (Global Rules)
**File:** `apps/api/src/db/seed/data/pricing-configs-seed-data.ts`

```
1. Child Policy:
   - 0-2 years: free
   - 3-6 years: 50%
   - 7-11 years: 75%

2. Extra Guest Surcharge: 200k/person/night

3. Profit Margin: 15% (default)

4. Dining Services:
   - Lẩu (Hotpot): 200-250k/person, min 2
   - BBQ: 250-300k/person, min 4
   - Set Menu: 200-500k/person, min 8
```

---

## 5. API Routes Summary

```
LEGACY PRICING (deprecated):
  POST   /pricing/rules              - Create
  GET    /pricing/rules              - List
  GET    /pricing/rules/:id          - Get
  PATCH  /pricing/rules/:id          - Update
  DELETE /pricing/rules/:id          - Delete
  POST   /pricing/calculate          - Calculate single room

MARKET-BASED PRICING (primary):
  GET    /pricing-options            - List combo/day types
  GET    /pricing-configs            - List rules
  PATCH  /pricing-configs/:id        - Update rule

ROOM PRICING:
  GET    /rooms/:roomId/pricing      - List
  POST   /rooms/:roomId/pricing      - Create
  PUT    /rooms/:roomId/pricing      - Bulk upsert
  PATCH  /rooms/:roomId/pricing/:id  - Update
  DELETE /rooms/:roomId/pricing/:id  - Delete

TRANSPORT PRICING:
  GET    /transport-providers/:providerId/pricing
  POST   /transport-providers/:providerId/pricing
  PATCH  /transport-providers/:providerId/pricing/:id
  DELETE /transport-providers/:providerId/pricing/:id

COMBO CALCULATOR (main entry point):
  POST   /combo-calculator/calculate - Calculate package price
```

---

## 6. Key Design Patterns

### 6.1 Multi-Day Support
- `dayTypes` array allows per-night day-type variations
- Single JOIN query prevents N+1 problem
- Rooms must have pricing for ALL requested dayTypes

### 6.2 Dual-Price System
- Listed price for public customers
- Discount price (admin-only visibility)
- `stripDiscountForNonAdmin()` filters on API responses

### 6.3 Trip Type Handling
- `tripType: "oneway" | "roundtrip"` determines price field selection
- Oneway: uses `onewayListedPrice`
- Roundtrip: uses `roundtripListedPrice` (falls back to oneway if null)

### 6.4 Child Policies
- Free: children under 5
- Discounted: children 5-10 (discount amount configurable)
- Surcharges: `extraChildSurcharge` for additional children

### 6.5 Cross-Province Surcharges
- JSON array in transport pricing
- Applied to paying passengers only (excludes free children)
- Used for inter-province transport markup

### 6.6 Profit Margin
- System-wide default 15% (from pricingConfigs)
- Market-specific override possible
- Admin can override per-calculation

### 6.7 Guest Count Variants
- `pricePlus1`/`priceMinus1` for capacity deviations
- `extraAdultSurcharge`, `extraChildSurcharge`
- `underStandardPrice` for reduced occupancy

### 6.8 Season Support
- Combo calculator filters by `seasonName = 'default'`
- Extensible for seasonal pricing (future)
- Stores `seasonStart`/`seasonEnd` for future use

### 6.9 Admin Visibility Control
- `aiVisible` flag on all pricing entities
- Separate from user role filtering
- Controls what AI system can access

---

## 7. Configuration Flow

**Admin Workflow:**
1. Set up pricing options (combo types, day types) → `/pricing-options` CRUD
2. Create rooms under properties
3. Add room pricing → `/rooms/:roomId/pricing`
4. Create transport providers
5. Add transport pricing → `/transport-providers/:providerId/pricing`
6. Configure business rules → `/pricing-configs` CRUD
7. Set profit margin and policies

**User Workflow (Combo Calculator):**
1. Select market, property
2. Enter guest counts, dates, transport preferences
3. System calculates:
   - Available rooms for selected combo/dayTypes
   - Matching transport options
   - Applies surcharges, margins
4. Returns detailed breakdown with per-person cost

---

## 8. Unresolved Questions

1. **Season Filtering:** Combo calculator hardcodes `seasonName = 'default'`. Should there be date-aware season detection?
2. **Room Allocation Algorithm:** Current allocator assigns cheapest rooms first. Should there be a best-fit algorithm?
3. **Discount Visibility in UI:** Frontend shows discount prices for admins, but should there be a UI flag to toggle admin-mode?
4. **Validation:** No validation that `dayTypes` length matches `numNights`. Should this be enforced?
5. **Caching Strategy:** Pricing options cached 5 minutes. Should room/transport pricing also be cached?

---

**Files Explored:** 18 source files + 5 seed files + 8 frontend components

