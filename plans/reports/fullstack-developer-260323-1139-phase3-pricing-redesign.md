# Phase 3: Pricing System Redesign — Implementation Report

## Executed Phase
- Phase: phase-03-pricing-system-redesign
- Plan: plans/260323-1024-customer-feedback-implementation/
- Status: completed

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/db/schema/room-pricing-schema.ts` | +`jsonb` import, +`surchargeRules` field, new unique index |
| `packages/shared/src/types/market-property-types.ts` | +`surchargeRules` array field to `RoomPricing` interface |
| `apps/web/src/components/market-data/room-pricing-form-dialog.tsx` | Full rewrite — period-based form state + 3-section layout |
| `apps/web/src/components/market-data/room-pricing-table.tsx` | Rewrite — period grouping, role-based price hiding, margin badges |
| `apps/web/src/components/pricing/pricing-price-matrix.tsx` | Rewrite — period tables, margin column, role-based visibility |
| `apps/web/src/components/pricing/pricing-room-overview-tab.tsx` | +margin summary section (collapsible, admin only) |
| `apps/api/src/modules/chat/skills/pricing-search-skill.ts` | Updated: remove combo mappings, add period/date-range awareness |

## Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/components/market-data/surcharge-rules-editor.tsx` | Dynamic surcharge rules (adult + child age-range rows) |
| `apps/web/src/components/market-data/room-pricing-period-editor.tsx` | Collapsible period cards with date pickers + per-dayType prices |
| `apps/web/src/components/pricing/pricing-margin-summary.tsx` | Margin % summary: per-room table + 3 stat cards (avg/max/min) |

## DB Migration Applied
```sql
ALTER TABLE room_pricing ADD COLUMN IF NOT EXISTS surcharge_rules jsonb DEFAULT '[]'::jsonb;
DROP INDEX IF EXISTS room_pricing_combo_day_season_idx;
CREATE UNIQUE INDEX IF NOT EXISTS room_pricing_room_day_season_idx ON room_pricing(room_id, day_type, season_name, season_start);
```

## Tasks Completed
- [x] Add `surchargeRules` jsonb to room_pricing schema
- [x] Update unique index (remove comboType, add seasonStart)
- [x] Apply DB migration directly
- [x] Add `surchargeRules` to shared `RoomPricing` type
- [x] Create surcharge-rules-editor.tsx (adult row + dynamic child rules)
- [x] Create room-pricing-period-editor.tsx (collapsible periods, date inputs, per-dayType CurrencyInputs)
- [x] Rewrite room-pricing-form-dialog.tsx (3 sections: periods, room settings, surcharges)
- [x] Rewrite room-pricing-table.tsx (period grouping, edit/delete per period, role-based price hiding, margin badges)
- [x] Rewrite pricing-price-matrix.tsx (period tables, margin column, role-based visibility)
- [x] Create pricing-margin-summary.tsx (per-room avg + 3 stat cards color-coded)
- [x] Update pricing-room-overview-tab.tsx (collapsible margin analysis panel, bulk pricing fetch)
- [x] Update pricing-search-skill.ts (period awareness, remove combo mappings)
- [x] Fix TS type error in period editor (dayPrices spread undefined)
- [x] `pnpm typecheck` passes

## Tests Status
- Type check: PASS
- Unit tests: not applicable (no test suite for these components)

## Key Design Decisions
- Save logic: each period × dayType = one `room_pricing` row with `comboType="per_night"`
- Load logic: `recordsToPeriods()` groups flat records by `seasonName|seasonStart` key
- Role-based: prices show `---` for non-admin in both table and matrix; discount section hidden entirely
- Margin formula: `(price - discountPrice) / price * 100`, color green >20%, yellow 10-20%, red <10%
- Margin summary only fetches pricings when `isAdmin=true` (YAGNI — staff don't need bulk fetch)
- `ConfirmDialog` has no `error` prop — removed unused deleteError state from matrix

## Issues Encountered
- TS error in period editor: `{ ...existing, [field]: value }` where `existing` could be undefined — fixed with explicit fallback `?? { price: "", discountPrice: "" }`
- `ConfirmDialog` does not accept `error` prop — removed from pricing-price-matrix.tsx

## Next Steps
- Phase 4 (if any): test with real period data via UI
- Consider adding period overlap validation on save
- API-level price stripping for non-admin users (currently frontend-only) — medium priority
