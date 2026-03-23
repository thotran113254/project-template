# Phase 6: Seed Data + Migration

## Context Links
- Existing seed runner: `apps/api/src/db/seed/seed-market-data.ts`
- Properties seed: `apps/api/src/db/seed/data/properties-seed-data.ts`
- Room pricing in properties seed or separate file
- Markets seed: `apps/api/src/db/seed/data/markets-seed-data.ts`
- Existing transport seed: `apps/api/src/db/seed/data/transportation-seed-data.ts`

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Seed transport providers, transport pricing, update room pricing with dual-price fields, add dining service pricing configs. Data from spreadsheet examples.

## Key Insights
- Existing seed data uses `upsert` pattern (insert or update on conflict) - follow same pattern
- Room pricing seed already exists - need to UPDATE existing rows to add discount prices, not duplicate
- Transport provider + pricing seeds are entirely new data
- Dining services (hotpot, BBQ, set menu) stored as `pricing_configs` with `ruleType: "dining_service"`
- Seed must be idempotent (safe to run multiple times)

## Requirements

1. Update existing room pricing seed rows with discount prices, under-standard prices, surcharges
2. Seed transport providers for at least 1 market (Tà Xùa example from spreadsheet)
3. Seed transport pricing rows (cabin, limousine, sleeper classes)
4. Seed ferry providers and pricing for at least 1 market (island example)
5. Seed dining service pricing configs
6. Seed profit margin pricing config

## Seed Data from Spreadsheet

### Room Pricing Updates (Market: Tà Xùa, Property: Khách sạn Mây Mơ Màng)

**Single Room (MMM02, capacity: 2):**
| comboType | dayType | price (listed) | discountPrice | underStandardPrice | standardGuests |
|-----------|---------|----------------|---------------|-------------------|----------------|
| 2n1d | weekday | 1000000 | 800000 | 700000 | 2 |
| 2n1d | fri_sun | 1200000 | 1000000 | null | 2 |
| 2n1d | saturday | 1500000 | 1500000 | null | 2 |
| 2n1d | holiday | 1700000 | 1500000 | null | 2 |

**Double Room (MMM01, capacity: 4):**
| comboType | dayType | price (listed) | discountPrice | underStandardPrice | standardGuests |
|-----------|---------|----------------|---------------|-------------------|----------------|
| 2n1d | weekday | 1500000 | 1300000 | 1000000 | 4 |
| 2n1d | fri_sun | 1700000 | 1500000 | null | 4 |
| 2n1d | saturday | 2000000 | 2000000 | null | 4 |
| 2n1d | holiday | 2500000 | 2500000 | null | 4 |

**Extra surcharges (applies to all rooms):**
- extraAdultSurcharge: 200000
- extraChildSurcharge: 100000
- includedAmenities: "Buffet sáng, hồ bơi, gym"

### Transport Provider Seed

```ts
// Provider 1: Bus
{
  providerName: "Nhà xe Hải Giang",
  providerCode: "HG",
  transportCategory: "bus",
  routeName: "Hà Nội <-> Tà Xùa",
  pickupPoints: [
    { name: "Điểm A", time: "6h40" },
    { name: "Điểm B", time: "7h00" },
    { name: "Điểm C", time: "8h00" },
  ],
}

// Provider 2: Ferry
{
  providerName: "Nhà tàu Nguyên Việt",
  providerCode: "NV",
  transportCategory: "ferry",
  routeName: "Cảng Ao Tiên -> Đảo",
}
```

### Transport Pricing Seed

**Bus (Provider: HG):**
| vehicleClass | seatType | capacity | 1way listed | 1way discount | RT listed | RT discount |
|-------------|----------|----------|-------------|---------------|-----------|-------------|
| cabin | single | 1 | 400000 | 350000 | 800000 | 700000 |
| cabin | double | 2 | 600000 | 500000 | 1200000 | 1000000 |
| limousine | front | 1 | 200000 | 180000 | 400000 | 360000 |
| limousine | middle | 1 | 250000 | 220000 | 500000 | 440000 |
| limousine | back | 1 | 200000 | 180000 | 400000 | 360000 |
| sleeper | single | 1 | 300000 | 270000 | 600000 | 540000 |

All bus rows: childFreeUnder=5, childDiscountUnder=10, childDiscountAmount=100000
Cross-province surcharges: `[{province:"Quảng Ninh",surcharge:200000},{province:"Ninh Bình",surcharge:300000}]`

**Ferry (Provider: NV):**
| vehicleClass | seatType | capacity | 1way listed | 1way discount | RT listed | RT discount | services |
|-------------|----------|----------|-------------|---------------|-----------|-------------|----------|
| small_boat | standard | 1 | 200000 | 180000 | 400000 | 360000 | null |
| speed_boat | vip | 1 | 200000 | 180000 | 400000 | 360000 | Nước + snack |
| speed_boat | standard | 1 | 250000 | 220000 | 500000 | 440000 | Nước + snack |
| speed_boat | sleeper | 1 | 200000 | 180000 | 400000 | 360000 | Nước + snack |

### Dining Service Pricing Configs

Stored in `pricing_configs` table with `ruleType: "dining_service"`:

```ts
[
  {
    ruleName: "Lẩu (Hotpot)",
    ruleType: "dining_service",
    config: {
      serviceType: "hotpot",
      pricePerPerson: { min: 200000, max: 250000 },
      minPeople: 2,
      notes: "Giá/người, tối thiểu 2 người",
    },
  },
  {
    ruleName: "BBQ nướng",
    ruleType: "dining_service",
    config: {
      serviceType: "bbq",
      pricePerPerson: { min: 250000, max: 300000 },
      minPeople: 4,
      notes: "Giá/người, tối thiểu 4 người",
    },
  },
  {
    ruleName: "Set menu",
    ruleType: "dining_service",
    config: {
      serviceType: "set_menu",
      pricePerPerson: { min: 200000, max: 500000 },
      minPeople: 8,
      notes: "Giá/người, tối thiểu 8 người, giá tùy menu",
    },
  },
]
```

### Profit Margin Config

```ts
{
  ruleName: "Biên lợi nhuận combo mặc định",
  ruleType: "profit_margin",
  config: {
    defaultPercent: 15,
    description: "Áp dụng cho tất cả combo trừ khi có override",
  },
}
```

## Related Code Files

### Files to CREATE:
1. `apps/api/src/db/seed/data/transport-providers-seed-data.ts` (~60 lines)
2. `apps/api/src/db/seed/data/transport-pricing-seed-data.ts` (~80 lines)
3. `apps/api/src/db/seed/data/dining-pricing-configs-seed-data.ts` (~50 lines)

### Files to MODIFY:
1. `apps/api/src/db/seed/data/properties-seed-data.ts` - update room pricing entries with discount fields
2. `apps/api/src/db/seed/seed-market-data.ts` - add seeding calls for new tables
3. `apps/api/src/db/seed/data/markets-seed-data.ts` - ensure ferry market exists if needed

## Implementation Steps

### Step 1: Update existing room pricing seed data
Add `discountPrice`, `underStandardPrice`, `extraAdultSurcharge`, `extraChildSurcharge`, `includedAmenities` to existing room pricing entries in the properties seed file.

### Step 2: Create transport-providers-seed-data.ts
Export array of provider objects. Use market slug references to resolve marketId at seed time.

### Step 3: Create transport-pricing-seed-data.ts
Export array of pricing objects keyed by provider code. Resolved to providerId at seed time.

### Step 4: Create dining-pricing-configs-seed-data.ts
Export array of pricing config objects for dining services + profit margin.

### Step 5: Update seed-market-data.ts
Add seeding steps after existing property/room seeding:
```ts
// 1. Seed transport providers
// 2. Seed transport pricing (needs provider IDs from step 1)
// 3. Seed dining + profit margin pricing configs
```

Follow existing pattern: insert with `onConflictDoUpdate` for idempotency.

### Step 6: Run seed
```bash
pnpm db:seed
```

## Todo List
- [ ] Update room pricing seed entries with dual-price fields
- [ ] Create transport-providers-seed-data.ts
- [ ] Create transport-pricing-seed-data.ts
- [ ] Create dining-pricing-configs-seed-data.ts
- [ ] Update seed-market-data.ts with new seeding logic
- [ ] Run pnpm db:seed and verify data
- [ ] Verify AI chatbot tools return seeded data correctly

## Success Criteria
- `pnpm db:seed` completes without errors
- Room pricing rows have discount prices populated
- Transport providers + pricing visible in admin UI
- AI chatbot `getTransportPricing` returns seeded data
- Combo calculator returns valid breakdown with seeded prices
- Re-running seed is idempotent (no duplicates)

## Risk Assessment
- **Existing seed conflict:** Room pricing updates must match existing comboType+dayType+seasonName unique constraint. Use upsert pattern.
- **Market reference:** Transport seeds reference market by slug. If slug changes, seed breaks. Use lookup-by-slug pattern.
- **Order dependency:** Transport pricing requires providers to exist first. Seed in correct order.

## Security Considerations
- Seed data includes discount prices - this is fine for development/staging
- Production seed should be reviewed to ensure no test data leaks
- Discount prices in seed are realistic but not actual business rates
