# Phase Implementation Report

### Executed Phase
- Phase: phase-05-admin-analytics-and-reporting
- Plan: /home/automation/project-template/plans/260323-1024-customer-feedback-implementation/
- Status: completed

### Files Modified
| File | Change |
|------|--------|
| `apps/api/src/db/schema/chat-sessions-schema.ts` | Added `lastMessageAt` timestamp field |
| `apps/api/src/modules/chat/chat-service.ts` | Set `lastMessageAt` in `sendMessage` + `saveAssistantMessage` |
| `apps/api/src/routes/index.ts` | Mounted `/admin/analytics` routes |
| `apps/web/src/app.tsx` | Registered `/admin/analytics` lazy route |
| `apps/web/src/components/layout/sidebar.tsx` | Added "Báo cáo & Phân tích" nav item (BarChart3, adminOnly) |

### Files Created
| File | Purpose |
|------|---------|
| `apps/api/src/modules/admin-analytics/faq-aggregator.ts` | Keyword-based FAQ extraction, 9 Vietnamese travel categories |
| `apps/api/src/modules/admin-analytics/analytics-service.ts` | DB queries: FAQ, staff usage, sessions, messages, users list |
| `apps/api/src/modules/admin-analytics/analytics-routes.ts` | 5 endpoints under `/admin/analytics/*` with auth+admin middleware |
| `apps/web/src/pages/admin-analytics-page.tsx` | Page shell with 3 custom tabs |
| `apps/web/src/components/admin/faq-analytics-tab.tsx` | FAQ table with period filter, uses data-table.tsx |
| `apps/web/src/components/admin/staff-usage-tab.tsx` | Staff metrics table with inline bar chart, period filter |
| `apps/web/src/components/admin/staff-chat-viewer-tab.tsx` | User selector dropdown + session list |
| `apps/web/src/components/admin/chat-session-viewer-dialog.tsx` | Read-only dialog reusing ChatMessageBubble |

### Tasks Completed
- [x] Add `lastMessageAt` to chat_sessions schema
- [x] Apply column via `docker exec` + backfill 40 existing sessions
- [x] Update chat-service to set lastMessageAt on new messages (sendMessage + saveAssistantMessage)
- [x] Create faq-aggregator.ts with keyword-based extraction (9 categories, Option A)
- [x] Create analytics-routes.ts + analytics-service.ts
- [x] Admin chat session/message endpoints (under /admin/analytics/sessions)
- [x] Create admin-analytics-page.tsx with 3 tabs
- [x] Create faq-analytics-tab.tsx
- [x] Create staff-usage-tab.tsx
- [x] Create staff-chat-viewer-tab.tsx + chat-session-viewer-dialog.tsx
- [x] Add sidebar nav item for analytics (BarChart3, adminOnly)
- [x] Register frontend route + API routes
- [x] pnpm typecheck passes

### Tests Status
- Type check: PASS (all 3 packages)
- Unit tests: N/A (no test suite configured)
- Integration tests: N/A

### Issues Encountered
1. No `@/components/ui/table` — used existing `data-table.tsx` (Table/THead/TBody/TR/TH/TD/TableHeaderRow)
2. `Select` from `select.tsx` uses `options` prop pattern, not shadcn compound components — adapted staff-chat-viewer-tab accordingly
3. `ChatRole` includes "system" but `ChatMessageBubble` only accepts "user"|"assistant" — filter applied in dialog
4. `pnpm db:push` ran interactively; used direct `ALTER TABLE` + UPDATE SQL instead

### API Endpoints
- `GET /api/v1/admin/analytics/faq?period=7d|30d|90d|all`
- `GET /api/v1/admin/analytics/usage?period=7d|30d|90d|all`
- `GET /api/v1/admin/analytics/users`
- `GET /api/v1/admin/analytics/sessions?userId=&page=1`
- `GET /api/v1/admin/analytics/sessions/:id/messages`

All endpoints require Bearer JWT + admin role (403 for non-admin).

### Security
- All routes protected by `authMiddleware` + `adminMiddleware` at Hono router level
- Session duration capped at 120 min in usage query to prevent tab-open inflation
- FAQ examples truncated to max 3 per category, questions capped at 200 chars

### Next Steps
- Future: Gemini batch FAQ categorization (Option B)
- Future: CSV/PDF export
- Future: cache FAQ results with 5-min TTL for expensive queries on large datasets
