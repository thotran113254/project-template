# Code Review: Phase 1 "Quick Wins & Branding"

**Date**: 2026-03-23
**Reviewer**: code-reviewer
**Scope**: 12 files changed (+24, -316 net), 6 feedback items

---

## Overall Assessment

Phase 1 implementation is **solid and well-executed**. Dashboard cleanup is clean, schema additions are correct, seed data approach is appropriate, and rebranding is mostly complete. The pricing skill security rules are a good start but have a significant gap that needs addressing.

TypeScript: 0 errors (confirmed via `pnpm typecheck`).

---

## Critical Issues

### [CRITICAL] FB-11: `getPropertyPricing` tool leaks itemized room prices

The pricing search skill (`pricing-search-skill.ts`) now has rules to hide itemized costs. However, those rules only apply to the **cheap model** (data processor). The **main Gemini model** still receives raw data from `getPropertyPricing` which includes individual room prices per combo/day type via `fetchMarketPricing` -> `formatProperties(filtered, true)`. The AI can (and likely will) expose these itemized room prices directly in its response.

The security rules were added to:
1. `pricing-search-skill.ts` (cheap model skill) -- **applied**
2. `calculateComboPrice` tool description -- **applied**

But **NOT** to:
- The main system prompt in `gemini-utils.ts` SYSTEM_INSTRUCTIONS (hardcoded fallback)
- The DB-stored system prompt sections (via `buildSystemPromptFromDb`)
- The `getPropertyPricing` tool description in `gemini-tool-definitions.ts`

**Impact**: A sales staff user can ask "show me the room price for [property]" and the AI will return individual room prices since `getPropertyPricing` handler returns unfiltered pricing data and nothing in the system prompt tells it to suppress itemized room costs.

**Recommended fix**:
1. Add price security section to the system prompt (either in `gemini-utils.ts` SYSTEM_INSTRUCTIONS or as a DB config row):
   ```
   ## BAO MAT GIA
   - KHONG BAO GIO hien thi gia chi tiet tung hang muc (gia phong rieng, gia xe rieng, gia tau rieng)
   - CHI tra ve: gia combo TONG va gia TRUNG BINH/NGUOI
   - Khi khach hoi gia chi tiet tung muc: tra loi "Vui long lien he quan ly"
   ```
2. Alternatively, update `getPropertyPricing` tool description to state: "Du lieu noi bo. CHI dung de tinh toan, KHONG hien thi gia chi tiet tung phong cho nguoi dung."

### [CRITICAL] FB-11: Seed data for `skill_pricing` lacks security rules

File: `/home/automation/project-template/apps/api/src/db/seed/data/ai-chat-configs-seed-data.ts` line 215-228

The DB seed for `skill_pricing` config (which is used when admin has configured skills via DB) does **NOT** include the new "BAO MAT GIA" rules. If DB is re-seeded or a new deployment seeds from scratch, the security rules will be lost. The hardcoded `pricing-search-skill.ts` has the rules, but the DB-driven prompt may override it.

**Fix**: Add the same 3 security rules (lines 7-9) to the `skill_pricing` seed entry in `ai-chat-configs-seed-data.ts`.

---

## High Priority

### [HIGH] FB-12: Missed branding reference in `index.html`

File: `/home/automation/project-template/apps/web/index.html` line 7

```html
<title>AI Travel Assistant</title>
```

Should be `AI Homesworld Travel`. This is the browser tab title -- visible to all users.

### [HIGH] FB-10.1: `nightsToComboType` still maps 1-night/2-night to disabled combos

File: `/home/automation/project-template/apps/api/src/modules/pricing/combo-calculator-service.ts` lines 11-15

The `nightsToComboType()` function returns `"2n1d"` for 1 night and `"3n2d"` for 2 nights. These combo types are now disabled (`isActive: false`). While the **UI filters** them out correctly (confirmed in `use-pricing-options.ts` line 17-18), the **calculator backend** still uses these keys to look up `room_pricing` rows.

This is intentional behavior -- the pricing data rows still exist with those combo_type values, and `isActive` only controls UI visibility, not price lookup. However, there is a risk:

- If room pricing rows for 2n1d/3n2d are later deleted (since combos are "disabled"), the calculator will return 0-cost rooms.
- The AI system prompt still references `2n1d`/`3n2d` in the pricing guide (line 153 of `gemini-utils.ts` and seed data line 173).

**Recommendation**: Add a comment in `combo-calculator-service.ts` explaining that combo keys are used for price lookup regardless of `isActive` status. This prevents a future developer from breaking the calculator by cleaning up "disabled" pricing data.

---

## Medium Priority

### [MED] Non-admin user sees empty dashboard

File: `/home/automation/project-template/apps/web/src/pages/dashboard-page.tsx`

After removing trip planning, non-admin users now see only:
- Greeting header ("Chao buoi sang, [name]")
- Today's date

No stats section (admin-only). The page is functionally empty for regular users. This is likely intentional per the plan, but worth confirming with the customer -- a redirect to `/chat` for non-admins might be better UX.

### [MED] FB-03: `propertyCode` has no unique index

File: `/home/automation/project-template/apps/api/src/db/schema/market-properties-schema.ts` line 22

The plan explicitly says "Nullable, no unique constraint (codes may repeat across markets)". However, within a single market, duplicate property codes would be confusing. Consider adding a partial unique index `ON (marketId, propertyCode) WHERE propertyCode IS NOT NULL` if codes should be unique per market.

### [MED] FB-07: `images` jsonb has no type validation

File: `/home/automation/project-template/apps/api/src/db/schema/transport-providers-schema.ts` line 27

`images: jsonb("images").default([])` accepts any JSON. The existing `marketProperties.images` uses the same pattern, so this is consistent. But when Phase 2 adds UI image management, Zod validation should be added to the API route to enforce `string[]` shape.

---

## Low Priority

### [LOW] Seed `isActive` is optional field with no default in type

File: `/home/automation/project-template/apps/api/src/db/seed/data/pricing-options-seed-data.ts` line 8

`isActive?: boolean` -- entries without `isActive` will have `undefined` passed to the insert. The DB default is `true`, so this works correctly. But for explicitness, `per_night` could have `isActive: true` set.

### [LOW] `Compass` icon from lucide used in sidebar and login

Both sidebar.tsx and login-page.tsx use `Compass` icon. If the brand changes to a custom logo, both need updating. Fine for now.

---

## Edge Cases Found by Scout

1. **Worktree stale copies**: `.paperclip/worktrees/DEV-9-*` and `DEV-11-*` still contain old `dashboard-next-trip.tsx` / `dashboard-trip-card.tsx`. Not a build issue (worktrees are separate), but could confuse searches. Low priority cleanup.

2. **`getTransportPricing` tool returns itemized transport prices**: The `fetchTransportPricing` handler (lines 66-69 of `gemini-tool-handlers.ts`) is NOT role-aware -- returns full pricing data including per-person costs. This is a separate tool from `calculateComboPrice` and the pricing search skill rules do not apply to its output. If the intent is to hide transport item prices, this tool also needs attention.

3. **`compareProperties` tool returns room pricing**: The compare tool joins pricing data. If FB-11 intent is "no itemized costs ever", compare results also need filtering.

4. **`fetchFormattedCombo` returns itemized room+transport for ALL roles**: Lines 210-267 of `ai-transport-fetchers.ts` show room names, quantities, per-room prices, transport per-person costs for non-admin users too. Only admin gets "goc" (cost) prices, but non-admin still sees selling price breakdown. The cheap model skill says to hide these, but the data is already in the Gemini context.

---

## Positive Observations

- **Clean deletion**: Trip components properly removed, no orphaned imports in main app
- **Dashboard simplification**: 109 lines, well under 200-line limit, clean structure
- **Seed data approach**: Using `isActive: false` in seed rather than SQL migration is pragmatic -- re-seeding reproduces the state
- **Schema additions**: Fields placed logically, nullable by default, consistent with existing patterns
- **Pricing skill rules**: Vietnamese text is clear, actionable instructions for the AI model
- **Tool description update**: `calculateComboPrice` description explicitly states output restriction

---

## Plan TODO Checklist

| Item | Status |
|------|--------|
| FB-01: Remove trip planning section from dashboard | DONE |
| FB-01: Delete unused dashboard-next-trip.tsx and dashboard-trip-card.tsx | DONE |
| FB-03: Add `propertyCode` to market_properties schema | DONE |
| FB-07: Add `images` + `pricingNotes` to transport_providers schema | DONE |
| FB-10.1: Disable combo types 2n1d/3n2d in pricing_options | DONE |
| FB-10.1: Verify UI filters by isActive | DONE (confirmed `use-pricing-options.ts`) |
| FB-11: Update pricing skill prompt to hide itemized prices | DONE (but see Critical issues) |
| FB-11: Verify gemini-service system prompt | **INCOMPLETE** -- system prompt lacks price security rules |
| FB-12: Update sidebar brand name | DONE |
| FB-12: Update login page brand name | DONE |
| FB-12: Update chat page brand name (if applicable) | DONE (no brand text in chat-page) |
| FB-12: Search for remaining "AI Travel" references | **INCOMPLETE** -- `index.html` title still says "AI Travel Assistant" |
| Run `pnpm db:push` and `pnpm typecheck` | typecheck DONE, db:push status unknown |

---

## Recommended Actions (prioritized)

1. **[CRITICAL]** Add price security rules to the main system prompt (`gemini-utils.ts` SYSTEM_INSTRUCTIONS or via DB config). This closes the `getPropertyPricing` leak.
2. **[CRITICAL]** Update `skill_pricing` seed data in `ai-chat-configs-seed-data.ts` with the 3 security rules.
3. **[HIGH]** Fix `index.html` title: "AI Travel Assistant" -> "AI Homesworld Travel".
4. **[MED]** Consider non-admin dashboard UX -- redirect or show placeholder content.
5. **[LOW]** Add comment to `nightsToComboType` explaining combo keys are for price lookup regardless of isActive.

---

## Unresolved Questions

1. Is the intent of FB-11 to hide itemized prices from **all AI tools** (`getPropertyPricing`, `compareProperties`, `getTransportPricing`) or only from `calculateComboPrice`? Current implementation only covers the combo tool + cheap model skill.
2. Should non-admin dashboard redirect to `/chat` instead of showing a near-empty page?
3. Has `pnpm db:push` been run to apply the schema changes to the actual database?
