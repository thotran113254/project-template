# Phase 1: Schema Changes

## Context Links
- Current room pricing: `apps/api/src/db/schema/room-pricing-schema.ts`
- Current transport: `apps/api/src/db/schema/market-transportation-schema.ts`
- Schema index: `apps/api/src/db/schema/index.ts`
- Relations: `apps/api/src/db/schema/market-data-relations.ts`
- Shared types: `packages/shared/src/types/market-property-types.ts`
- Shared schemas: `packages/shared/src/schemas/market-property-schemas.ts`

## Overview
- **Priority:** P1 (blocking all other phases)
- **Status:** pending
- **Description:** Add dual pricing to room_pricing, create transport_providers + transport_pricing + ferry_providers + ferry_pricing schemas

## Key Insights
- `room_pricing` already has `price`, `pricePlus1`, `priceMinus1` - add `discountPrice`, `discountPricePlus1`, `discountPriceMinus1`, `underStandardPrice`
- `market_transportation` stores descriptive route info (keep as-is) - new tables store STRUCTURED pricing per provider/class
- Ferry is structurally identical to transport but with different fields (boat type, seat class, onboard services)
- Existing `pricingOptions` already has `day_type` category with `holiday` support via `config.isHoliday` flag - no schema change needed there
- Property `dining_services` (hotpot, BBQ, set menu) can be stored as JSONB on `market_properties` or as a `pricing_configs` rule entry since it's property-level config, not a separate entity. Using `pricing_configs` with `ruleType: "dining_service"` is cleanest (table already exists, already AI-visible).

## Requirements

### 1A. Alter `room_pricing` table - ADD columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `discount_price` | integer | YES | null | Confidential discount price (admin-only) |
| `discount_price_plus1` | integer | YES | null | Discount +1 person surcharge |
| `discount_price_minus1` | integer | YES | null | Discount -1 person (under-standard) |
| `under_standard_price` | integer | YES | null | Price when fewer than standardGuests |
| `extra_adult_surcharge` | integer | YES | null | Extra adult surcharge amount |
| `extra_child_surcharge` | integer | YES | null | Extra child (<10) surcharge amount |
| `included_amenities` | text | YES | null | What's included (breakfast, pool, etc.) |

**Backward compat:** All new columns nullable, existing data unaffected. Unique index unchanged.

### 1B. New table: `transport_providers`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid PK | NO | defaultRandom |
| `market_id` | uuid FK→markets | NO | cascade delete |
| `provider_name` | varchar(255) | NO | e.g., "Nhà xe Hải Giang" |
| `provider_code` | varchar(50) | YES | Short code |
| `transport_category` | varchar(30) | NO | "bus" or "ferry" |
| `route_name` | varchar(255) | NO | e.g., "Hà Nội <-> Tà Xùa" |
| `contact_info` | jsonb | YES | Phone, etc. |
| `pickup_points` | jsonb | YES | Array of {name, time} |
| `notes` | text | YES | |
| `sort_order` | integer | NO | default 0 |
| `ai_visible` | boolean | NO | default true |
| `created_at` | timestamptz | NO | defaultNow |
| `updated_at` | timestamptz | NO | defaultNow |

Indexes: `market_id`, unique(`market_id`, `provider_code`) if code present

### 1C. New table: `transport_pricing`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid PK | NO | defaultRandom |
| `provider_id` | uuid FK→transport_providers | NO | cascade delete |
| `vehicle_class` | varchar(50) | NO | "cabin", "limousine", "sleeper", "speed_boat", "small_boat" |
| `seat_type` | varchar(50) | NO | "single", "double", "front", "middle", "back", "vip", "standard" |
| `capacity_per_unit` | integer | NO | How many people per unit (1 for single, 2 for double) |
| `oneway_listed_price` | integer | NO | Listed one-way price |
| `oneway_discount_price` | integer | YES | Discount one-way (admin-only) |
| `roundtrip_listed_price` | integer | YES | Listed round-trip price |
| `roundtrip_discount_price` | integer | YES | Discount round-trip (admin-only) |
| `child_free_under` | integer | YES | default 5 (age) |
| `child_discount_under` | integer | YES | default 10 (age) |
| `child_discount_amount` | integer | YES | Amount subtracted from listed |
| `onboard_services` | text | YES | "Water + snacks" etc. |
| `cross_province_surcharges` | jsonb | YES | Array of {province, surchargePerPerson} |
| `notes` | text | YES | |
| `sort_order` | integer | NO | default 0 |
| `ai_visible` | boolean | NO | default true |
| `created_at` | timestamptz | NO | defaultNow |
| `updated_at` | timestamptz | NO | defaultNow |

Indexes: `provider_id`, unique(`provider_id`, `vehicle_class`, `seat_type`)

**Design decision:** Ferry and bus pricing share the same `transport_providers` + `transport_pricing` tables. Differentiated by `transport_category` on provider ("bus" vs "ferry") and `vehicle_class` values. Avoids duplicating identical schema structure for ferries.

## Related Code Files

### Files to MODIFY:
1. `apps/api/src/db/schema/room-pricing-schema.ts` - add 7 columns
2. `apps/api/src/db/schema/index.ts` - add new schema exports
3. `apps/api/src/db/schema/market-data-relations.ts` - add provider/pricing relations
4. `packages/shared/src/types/market-property-types.ts` - update RoomPricing type, add TransportProvider + TransportPricing types
5. `packages/shared/src/schemas/market-property-schemas.ts` - update createRoomPricingSchema, add transport schemas

### Files to CREATE:
1. `apps/api/src/db/schema/transport-providers-schema.ts` (~40 lines)
2. `apps/api/src/db/schema/transport-pricing-schema.ts` (~50 lines)

## Implementation Steps

### Step 1: Update room-pricing-schema.ts
Add after `priceMinus1` field:
```ts
discountPrice: integer("discount_price"),
discountPricePlus1: integer("discount_price_plus1"),
discountPriceMinus1: integer("discount_price_minus1"),
underStandardPrice: integer("under_standard_price"),
extraAdultSurcharge: integer("extra_adult_surcharge"),
extraChildSurcharge: integer("extra_child_surcharge"),
includedAmenities: text("included_amenities"),
```

### Step 2: Create transport-providers-schema.ts
Follow pattern of `market-transportation-schema.ts`. FK to `markets`.

### Step 3: Create transport-pricing-schema.ts
FK to `transport_providers`. Include all pricing fields from spec above.

### Step 4: Update index.ts
Add exports:
```ts
export * from "./transport-providers-schema";
export * from "./transport-pricing-schema";
```

### Step 5: Update market-data-relations.ts
Add:
- `markets` → `many(transportProviders)`
- `transportProviders` → `one(markets)`, `many(transportPricing)`
- `transportPricing` → `one(transportProviders)`

### Step 6: Update shared types
Add to `market-property-types.ts`:
- Update `RoomPricing` interface with new fields
- Add `TransportProvider` interface
- Add `TransportPricing` interface

### Step 7: Update shared schemas
Add to `market-property-schemas.ts`:
- Update `createRoomPricingSchema` with optional new fields
- Add `createTransportProviderSchema`
- Add `createTransportPricingSchema`

### Step 8: Run db:push
```bash
pnpm db:push
```

## Todo List
- [ ] Update room-pricing-schema.ts (add 7 columns)
- [ ] Create transport-providers-schema.ts
- [ ] Create transport-pricing-schema.ts
- [ ] Update schema index.ts with new exports
- [ ] Update market-data-relations.ts with new relations
- [ ] Update shared types (market-property-types.ts)
- [ ] Update shared schemas (market-property-schemas.ts)
- [ ] Run db:push and verify migration
- [ ] Run typecheck to verify no breaks

## Success Criteria
- `pnpm db:push` succeeds without errors
- `pnpm typecheck` passes
- Existing room_pricing data is preserved (all new columns null for existing rows)
- New tables created empty and ready for seeding

## Risk Assessment
- **Migration risk:** All new columns nullable, so existing data is safe
- **Index risk:** Existing unique index on room_pricing unchanged
- **Type break risk:** Shared types are additive (new optional fields) - no breaks expected

## Security Considerations
- `discountPrice` fields must NEVER be exposed to non-admin users
- Filtering happens at service/API layer (Phase 2), not schema layer
