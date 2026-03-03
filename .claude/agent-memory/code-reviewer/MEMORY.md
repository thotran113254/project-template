# Code Reviewer Agent Memory

## Project: project-template

### Stack
- Web: React 18, Vite, TailwindCSS v4, shadcn/ui (custom), React Router, TanStack Query
- API: Hono.js, Drizzle ORM, PostgreSQL, JWT
- Shared: `@app/shared` monorepo package (types, Zod schemas, constants)
- Typecheck: `pnpm --filter web typecheck`

### Key Paths
- Frontend src: `apps/web/src/`
- Shared types: `packages/shared/src/`
- UI components: `apps/web/src/components/ui/`
- Pages: `apps/web/src/pages/`

### Patterns Confirmed
- shadcn/ui pattern: forwardRef + displayName + cn() + cva variants
- Auth: Context + useCallback/useMemo, tokens in localStorage
- API: Axios with interceptors, bearer token auto-attach
- CRUD modals: Optimistic updates with onMutate/onError/onSettled
- Dialog: Custom portal-based (not Radix), body scroll lock + ESC
- Routing: React Router v6 layout routes, lazy() code splitting
- Query keys: "resource-list", ["resource", id], "users-list", "resource-list-summary"

### Recurring Issues Found (2026-03-03)
- Axios error messages not extracted (err.response.data.message lost)
- Non-null assertions (resource!) instead of proper guards
- Spinner component duplicated in 3 places
- No Error Boundary
- Mixed Vietnamese/English UI text
- No token refresh implementation despite storing refresh_token
- Forms skip Zod validation (auth pages use it, resource pages don't)

### DB Schema Issues (2026-03-03)
- `reset.ts` references stale VPS table names instead of `resources`
- `slug` column lacks UNIQUE constraint, no collision handling
- No ORDER BY on paginated list queries (non-deterministic pagination)
- `updatedAt` requires manual `sql\`now()\`` in every update call
- `archive` action maps to same status as `deactivate` (no "archived" status)
- `category` not validated against RESOURCE_CATEGORIES in Zod
- Duplicate DTO types alongside Zod inferred types in shared package
- `name` max length: DB=255 vs Zod=100 (mismatch)
- No migration files committed; only db:push workflow

### Review Checklist
- Check DB constraints match Zod validation rules
- Check ORDER BY on all paginated queries
- Check updatedAt handling in update operations
- Check for stale references from VPS->Resources refactor
- Verify type alignment between DB inferred types and shared types

### File Size Monitoring
- resource-list-page.tsx: 265 lines (over 200-line limit)
