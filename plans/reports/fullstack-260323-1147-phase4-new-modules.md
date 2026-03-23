# Phase 4 Implementation Report: New Modules

## Executed Phase
- Phase: phase-04-new-modules
- Plan: plans/260323-1024-customer-feedback-implementation/
- Status: completed

## Files Modified

### Modified
- `apps/api/src/db/schema/index.ts` — exported 2 new schemas
- `apps/api/src/db/schema/market-data-relations.ts` — added relations for knowledgeUpdates + experiences
- `apps/api/src/modules/market-data/ai-toggle-service.ts` — added knowledge_update + experience entity types
- `apps/api/src/modules/market-data/ai-context-builder.ts` — added approved knowledge + experiences to AI context
- `apps/api/src/routes/index.ts` — mounted 3 new route groups
- `apps/web/src/pages/market-detail-page.tsx` — added 2 tabs (knowledge, experiences)
- `apps/web/src/components/layout/sidebar.tsx` — added BookPlus + ClipboardCheck nav items
- `apps/web/src/app.tsx` — registered 2 new pages

### Created (24 files)

**DB Schemas:**
- `apps/api/src/db/schema/market-knowledge-updates-schema.ts`
- `apps/api/src/db/schema/market-experiences-schema.ts`

**Shared types:**
- `packages/shared/src/types/knowledge-update.ts`
- `packages/shared/src/types/experience.ts`

**API — knowledge updates (FB-08):**
- `apps/api/src/modules/market-data/knowledge-updates-service.ts`
- `apps/api/src/modules/market-data/knowledge-updates-routes.ts`

**API — experiences (FB-09):**
- `apps/api/src/modules/market-data/experiences-service.ts`
- `apps/api/src/modules/market-data/experiences-routes.ts`

**API — review workflow (FB-13):**
- `apps/api/src/modules/knowledge-review/knowledge-review-service.ts`
- `apps/api/src/modules/knowledge-review/knowledge-review-routes.ts`

**Frontend components:**
- `apps/web/src/components/market-data/knowledge-updates-tab.tsx`
- `apps/web/src/components/market-data/knowledge-update-form-dialog.tsx`
- `apps/web/src/components/market-data/experiences-tab.tsx`
- `apps/web/src/components/market-data/experience-form-dialog.tsx`

**Frontend pages:**
- `apps/web/src/pages/knowledge-contribution-page.tsx`
- `apps/web/src/pages/knowledge-review-page.tsx`

## Tasks Completed
- [x] Create market-knowledge-updates-schema.ts
- [x] Create market-experiences-schema.ts
- [x] Export schemas in index.ts + add relations
- [x] Add shared types in packages/shared
- [x] Run pnpm db:push (both tables created successfully)
- [x] Create knowledge-updates API routes + service
- [x] Create experiences API routes + service
- [x] Create knowledge-review API routes + service (FB-13)
- [x] Create knowledge-updates-tab.tsx + form dialog
- [x] Create experiences-tab.tsx + form dialog (with ImageManager)
- [x] Add 2 new tabs to market-detail-page.tsx (Kiến thức TT, Trải nghiệm)
- [x] Create knowledge-contribution-page.tsx (staff submit)
- [x] Create knowledge-review-page.tsx (admin review queue)
- [x] Add sidebar nav items (BookPlus for staff, ClipboardCheck for admin)
- [x] Register new routes in React Router
- [x] Mount new API routes in routes/index.ts
- [x] Integrate approved knowledge + experiences into AI context builder
- [x] pnpm typecheck passes

## Tests Status
- Type check: PASS (all 3 workspace packages)
- Unit tests: not run (no test suite in project)
- Integration tests: not run

## Issues Encountered
1. `c.req.param()` returns `string | undefined` in standalone route handlers — fixed with `as string` cast (same pattern issue as elsewhere in codebase)
2. Badge variant `"destructive"` doesn't exist — codebase uses `"danger"` — fixed in all 3 frontend files
3. `KNOWLEDGE_ASPECTS[0]` is `string | undefined` under strictNullChecks — fixed with `?? "Văn hóa"` fallback

## Architecture Notes
- Knowledge updates table has dual use: FB-08 (admin CRUD) + FB-13 (staff contribution workflow via `status` field)
- Admin creates entries with `status=approved`; staff creates with `status=pending_review`
- Review workflow: GET /knowledge-reviews (admin sees all, staff sees own); PATCH /:id/approve|reject (admin only)
- AI context includes approved+aiVisible knowledge entries and aiVisible experiences in `buildMarketSection()`
- New entity types `knowledge_update` and `experience` added to AI toggle service TABLE_MAP
- Sidebar: "Đóng góp kiến thức" visible to all users; "Duyệt kiến thức" admin-only

## Next Steps
- None blocking; all success criteria met
- Optional: add rate limiting on staff submit endpoint to prevent spam
