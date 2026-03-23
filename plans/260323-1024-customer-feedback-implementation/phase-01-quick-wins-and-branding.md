# Phase 1: Quick Wins & Branding

## Overview
- **Priority**: HIGH
- **Effort**: 1-2 days
- **Status**: completed
- **FBs**: FB-01, FB-03 (schema only), FB-07 (schema only), FB-10.1, FB-11, FB-12

Small-scope changes: remove dashboard section, schema migrations, disable combo types, AI behavior fix, rebranding.

## Key Insights
- Dashboard trip planning uses `DashboardNextTrip` + `DashboardTripCard` components; entire section lines 82-171 in `dashboard-page.tsx` can be removed
- `transport_providers` schema confirmed NO `images` field — migration needed
- `market_properties` schema confirmed NO `propertyCode` field — migration needed
- Pricing skill in `pricing-search-skill.ts` returns raw data with no output filtering
- Sidebar line 59 hardcodes "AI Travel" text
- `pricing_options` table has `isActive` boolean — can disable combo types via SQL

## Requirements

### FB-01: Remove Dashboard Trip Planning
- Remove trip query, `findNextTrip()`, travel stat pills, next trip card, draft trips section, "plan new trip" CTA
- Keep greeting header + admin stats section
- Remove imports: `DashboardNextTrip`, `DashboardTripCard`, `Trip`, `Plus`, `Plane`, `CheckCircle2`, `Clock`

### FB-03 Schema: Add propertyCode
- Add `propertyCode: varchar("property_code", { length: 20 })` to `market_properties` schema
- Nullable, no unique constraint (codes may repeat across markets)

### FB-07 Schema: Add transport provider images
- Add `images: jsonb("images").default([])` to `transport_providers` schema
- Add `pricingNotes: text("pricing_notes")` for quick pricing note field

### FB-10.1: Disable Combo Types
- Set `isActive = false` for combo types "2n1d" and "3n2d" in `pricing_options`
- Seed script or migration SQL to update existing records
- UI in `pricing-room-overview-tab.tsx` already filters by `isActive` — verify

### FB-11: AI Pricing Behavior
- Update `pricing-search-skill.ts` system prompt: instruct to ONLY return combo total + price/person
- Add explicit rule: "NEVER show itemized costs (room price, transport price, etc.)"
- Update system prompt in `gemini-service.ts` if pricing instructions exist there

### FB-12: Rebranding
- "AI Travel" -> "AI Homesworld Travel" across all locations
- BLOCKED on brand hex codes; default: keep teal-600 until customer provides colors

## Related Code Files

### Files to Modify
| File | Change |
|------|--------|
| `/home/automation/project-template/apps/web/src/pages/dashboard-page.tsx` | Remove trip planning section (lines 82-171), remove trip query + imports |
| `/home/automation/project-template/apps/api/src/db/schema/market-properties-schema.ts` | Add `propertyCode` field after `slug` |
| `/home/automation/project-template/apps/api/src/db/schema/transport-providers-schema.ts` | Add `images` jsonb + `pricingNotes` text fields |
| `/home/automation/project-template/apps/api/src/db/schema/index.ts` | Verify new fields exported |
| `/home/automation/project-template/apps/api/src/modules/chat/skills/pricing-search-skill.ts` | Add output filter rules to prompt |
| `/home/automation/project-template/apps/web/src/components/layout/sidebar.tsx` | Line 59: "AI Travel" -> "AI Homesworld Travel" |
| `/home/automation/project-template/apps/web/src/pages/login-page.tsx` | Update brand name text |
| `/home/automation/project-template/apps/web/src/pages/chat-page.tsx` | Update header brand text if present |

### Files to Delete (optional cleanup)
| File | Reason |
|------|--------|
| `/home/automation/project-template/apps/web/src/components/dashboard/dashboard-next-trip.tsx` | No longer used after FB-01 |
| `/home/automation/project-template/apps/web/src/components/dashboard/dashboard-trip-card.tsx` | No longer used after FB-01 |

## Implementation Steps

### Step 1: FB-01 — Remove Dashboard Trip Planning
1. Open `dashboard-page.tsx`
2. Remove imports: `DashboardNextTrip`, `DashboardTripCard`, `Trip` type, `Plus`, `Plane`, `CheckCircle2`, `Clock`
3. Remove `useQuery` for `itinerary-trips` (lines 82-88)
4. Remove `findNextTrip`, `TravelStatPill` functions
5. Remove all trip-related JSX: travel stat pills, next trip section, draft trips section, "plan new trip" CTA (lines 110-171 approx, everything before admin section)
6. Keep greeting header (`getGreeting`, `getTodayLabel`) + admin section
7. Simplify: greeting + stats for admin, greeting-only for user
8. Remove `tripsLoading` check; use `statsLoading` for admin only
9. Verify `dashboard-next-trip.tsx` and `dashboard-trip-card.tsx` have no other importers, then delete

### Step 2: FB-03/FB-07 — Schema Migrations
1. In `market-properties-schema.ts`, add after line 21 (`slug` field):
   ```ts
   propertyCode: varchar("property_code", { length: 20 }),
   ```
2. In `transport-providers-schema.ts`, add after `notes` field (line 26):
   ```ts
   images: jsonb("images").default([]),
   pricingNotes: text("pricing_notes"),
   ```
3. Update shared types if `MarketProperty` / `TransportProvider` types are manually defined in `packages/shared/`
4. Run `pnpm db:push` to apply schema changes
5. Verify no compile errors: `pnpm typecheck`

### Step 3: FB-10.1 — Disable Combo Types
1. Create a seed/migration to set `isActive = false`:
   ```sql
   UPDATE pricing_options SET is_active = false WHERE category = 'combo_type' AND option_key IN ('2n1d', '3n2d');
   ```
2. Verify `pricing-room-overview-tab.tsx` and `room-pricing-form-dialog.tsx` filter combo options by `isActive`
3. If not filtered: add `.filter(o => o.isActive)` to combo options list in relevant components
4. Verify pricing matrix in `pricing-price-matrix.tsx` also respects `isActive`

### Step 4: FB-11 — AI Pricing Behavior
1. Update `pricing-search-skill.ts` — append rules:
   ```
   ## QUAN TRONG - BẢO MẬT GIÁ
   7. KHÔNG BAO GIỜ trả về giá chi tiết từng hạng mục (giá phòng riêng, giá xe riêng, giá tàu riêng)
   8. CHỈ trả về: giá combo TỔNG và giá TRUNG BÌNH/NGƯỜI
   9. Nếu người dùng hỏi giá chi tiết từng mục: trả lời "Vui lòng liên hệ quản lý để biết chi tiết giá từng hạng mục"
   ```
2. Check `gemini-service.ts` for system prompt — add similar instruction if pricing context is injected there
3. Test with sample query: "Tính giá combo Cat Ba cho 4 người" — verify no itemized breakdown

### Step 5: FB-12 — Rebranding
1. `sidebar.tsx` line 58-59: change `"AI Travel"` to `"AI Homesworld Travel"`
2. `login-page.tsx`: search for "AI Travel" text, replace with "AI Homesworld Travel"
3. `chat-page.tsx`: search for any brand text in header area
4. Search entire codebase: `grep -r "AI Travel" apps/web/src/` to catch any other occurrences
5. For now keep `bg-teal-600` colors; when customer provides hex codes, update CSS variables

### Step 6: Verify & Push Schema
1. `pnpm typecheck` — ensure no TS errors
2. `pnpm db:push` — apply migrations
3. Test dashboard loads without trip section
4. Test pricing management page shows only "Gia/dem" column

## Todo List
- [x] FB-01: Remove trip planning section from dashboard
- [x] FB-01: Delete unused dashboard-next-trip.tsx and dashboard-trip-card.tsx
- [x] FB-03: Add `propertyCode` to market_properties schema
- [x] FB-07: Add `images` + `pricingNotes` to transport_providers schema
- [x] FB-10.1: Disable combo types 2n1d/3n2d in pricing_options
- [x] FB-10.1: Verify UI filters by isActive
- [x] FB-11: Update pricing skill prompt to hide itemized prices
- [x] FB-11: Verify gemini-service system prompt
- [x] FB-12: Update sidebar brand name
- [x] FB-12: Update login page brand name
- [x] FB-12: Update chat page brand name (if applicable)
- [x] FB-12: Search for remaining "AI Travel" references
- [x] Run `pnpm db:push` and `pnpm typecheck`

## Success Criteria
- Dashboard shows greeting + admin stats only; no trip cards
- `propertyCode` column exists in `market_properties` table
- `images` + `pricing_notes` columns exist in `transport_providers` table
- Pricing management shows only "Gia/dem" column, no 2N1D/3N2D
- AI chat returns only combo total + per-person price, no itemized costs
- All UI shows "AI Homesworld Travel" brand name

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Removing trip components breaks other pages | Low — only used in dashboard | Search all importers before deleting |
| Disabling combos breaks existing pricing data | Medium — data stays, just hidden | Keep records; only set isActive=false |
| AI skill prompt change too aggressive | Low | Test with multiple query types |
| Brand colors TBD from customer | Low | Keep teal defaults, easy CSS swap later |

## Security Considerations
- FB-11: Ensures staff cannot see cost breakdown through AI — business data protection
- No auth changes in this phase
