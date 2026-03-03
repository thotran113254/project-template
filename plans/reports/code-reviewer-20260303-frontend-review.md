# Frontend Code Review Report

**Date:** 2026-03-03
**Reviewer:** code-reviewer
**Scope:** `apps/web/src/` (29 files, ~2222 LOC)
**Focus:** React patterns, state management, UI components, CRUD modals, pages, hooks, routing, error handling, type safety, performance

---

## Overall Assessment

The frontend is **well-structured and above average** for a template project. Clean component composition, proper shadcn/ui patterns, correct forwardRef usage, solid optimistic update implementations, and good type safety throughout. The codebase is lean, consistent, and under the 200-line file limit.

**Grade: B+** -- Several medium-priority issues prevent an A rating.

---

## Critical Issues

### CRIT-1: Login error handler loses Axios error messages
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\login-page.tsx:18-21`
**Also:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\register-page.tsx:18-21`

```typescript
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Da xay ra loi, vui long thu lai.";
}
```

Axios errors are `AxiosError` instances where the server message is in `err.response?.data?.message`, but `err.message` is the generic Axios message (e.g., "Request failed with status code 400"). The user-facing server validation message (e.g., "Email already exists") is never displayed.

**Fix:**
```typescript
import type { AxiosError } from "axios";

function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string }>;
  if (axiosErr?.response?.data?.message) return axiosErr.response.data.message;
  if (err instanceof Error) return err.message;
  return "An error occurred. Please try again.";
}
```

**Impact:** Users see "Request failed with status code 409" instead of "Email already exists."

---

### CRIT-2: Duplicate `getErrorMessage` function
**Files:** `login-page.tsx:18` and `register-page.tsx:18`

Same function duplicated verbatim. Extract to `lib/utils.ts` or create `lib/error-utils.ts`.

---

## High Priority

### HIGH-1: `resource!.id` non-null assertions in edit modal (potential crash)
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\resource\resource-edit-modal.tsx:55,63,72,76,79,93`

Six `resource!` non-null assertions. If the dialog somehow opens with `resource === null`, every mutation callback crashes. The `resource` prop is typed as `Resource | null`.

**Fix:** Add early guard in mutation functions:
```typescript
mutationFn: async (dto: UpdateResourceDto) => {
  if (!resource) throw new Error("No resource selected");
  const res = await apiClient.patch<ApiResponse<Resource>>(
    `/resources/${resource.id}`,
    dto,
  );
  return res.data.data!;
},
```

### HIGH-2: Optimistic update data shape mismatch in create modal
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\resource\resource-create-modal.tsx:47-61`

The optimistic resource uses `metadata: dto.metadata ?? {}` but `Resource.metadata` is typed as `Record<string, string>` while the optimistic object provides `Record<string, string> | undefined` resolved to `{}`. More critically, the query cache for `resource-list` stores `Resource[]` but the actual query fetches from `PaginatedResponse<Resource>` and extracts `res.data.data ?? []`. The optimistic data assumes the cache is a flat `Resource[]` array -- this is correct because of the `queryFn` transform, but if the API response shape changes or pagination is added, this will silently break.

**Recommendation:** Consider a comment documenting this assumption, or use a typed query factory pattern.

### HIGH-3: No error boundary component
**All pages** use `isError` from React Query but there is no React Error Boundary wrapping the route tree. If a component throws during render (not during async fetch), the entire app white-screens.

**Fix:** Add an `ErrorBoundary` component wrapping the `<Outlet />` in `AppLayout` or around the `<Routes>` in `app.tsx`.

### HIGH-4: Missing `aria-describedby` and accessibility roles in Dialog
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\ui\dialog.tsx`

The `Dialog` component lacks `role="dialog"` and `aria-modal="true"` on the overlay/content. The `DialogContent` should have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`/`aria-describedby` linking to `DialogTitle`/`DialogDescription`. Screen readers won't announce the modal properly.

### HIGH-5: Auth logout doesn't call server endpoint
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\hooks\use-auth.tsx:83-86`

```typescript
const logout = useCallback((): void => {
  clearTokens();
  setUser(null);
}, []);
```

Tokens are cleared client-side only. The refresh token remains valid server-side. If the refresh token was compromised, it can still be used.

**Fix:** Call `apiClient.post("/auth/logout")` before clearing tokens (fire-and-forget is acceptable).

### HIGH-6: No redirect-after-login preservation
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\auth\protected-route.tsx:21`

When unauthenticated, the user is redirected to `/login` but the original URL is lost. After login, they always go to `/dashboard` instead of where they originally intended.

**Fix:**
```typescript
if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
```
Then in `login-page.tsx`, read `location.state?.from` and navigate there on success.

---

## Medium Priority

### MED-1: Dashboard fetches all resources (limit: 100) just for counts
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\dashboard-page.tsx:43-52`

```typescript
queryFn: async () => {
  const res = await apiClient.get<PaginatedResponse<Resource>>(
    "/resources",
    { params: { limit: 100 } },
  );
  return res.data.data ?? [];
},
```

Fetches up to 100 full resource objects to compute 4 count values. Should use a dedicated `/resources/stats` endpoint or at minimum share the cache key with `resource-list` to avoid duplicate fetches.

**Also:** Uses different query key (`resource-list-summary`) than resource list page (`resource-list`), so same data is fetched twice.

### MED-2: `resource-list` query data shape inconsistency
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\resource-list-page.tsx:45-52`

The `queryFn` transforms `PaginatedResponse<Resource>` into `Resource[]`, losing pagination metadata. The `PaginationMeta` (page, total, totalPages) is discarded. When the list grows past default page size, users see a truncated list with no pagination controls.

### MED-3: `actionMutation` in `resource-list-page.tsx` is shared across all rows
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\resource-list-page.tsx:185-186`

```typescript
disabled={actionMutation.isPending}
```

When one row's action is pending, ALL action buttons across ALL rows are disabled. Should track which specific resource action is in flight.

### MED-4: ResourceForm does not use Zod schema for client-side validation
**Files:** `resource-create-modal.tsx:86-89`, `resource-edit-modal.tsx:117-119`

Both modals only check `!form.name.trim()`. The shared `createResourceSchema` from `@app/shared` validates name length (max 100), description (max 500), and required category. Login and register pages correctly use Zod -- the resource forms should too for consistency.

### MED-5: Select component missing `forwardRef`
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\ui\select.tsx`

Unlike `Input`, `Button`, `Textarea`, and `Card` which all use `forwardRef`, `Select` is a plain function component. This inconsistency means it can't participate in ref-based form libraries (react-hook-form, etc.).

### MED-6: Badge component missing `forwardRef`
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\ui\badge.tsx`

Same inconsistency as Select.

### MED-7: CardTitle type mismatch
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\ui\card.tsx:30-39`

```typescript
const CardTitle = forwardRef<
  HTMLParagraphElement,  // <-- ref type says <p>
  HTMLAttributes<HTMLHeadingElement>  // <-- props say <h3>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} ...  // <-- renders <h3>
));
```

The generic ref type is `HTMLParagraphElement` but the element is `<h3>`. Should be `HTMLHeadingElement`.

### MED-8: No token refresh mechanism
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\lib\api-client.ts`

The response interceptor handles 401 by clearing tokens and redirecting to login. There's a `refresh_token` stored in localStorage but no refresh flow -- the token is stored and cleared but never used for refresh. When the access token expires, users are force-logged-out.

### MED-9: Mixed language in UI
**Files:** `login-page.tsx`, `register-page.tsx` (Vietnamese), `dashboard-page.tsx`, `resource-list-page.tsx` (English)

Auth pages use Vietnamese text, resource pages use English. Inconsistent UX. Should pick one language or implement i18n.

### MED-10: `resource-list-page.tsx` exceeds 200-line guideline
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\resource-list-page.tsx` (265 lines)

Per project rules, files should stay under 200 lines. Extract the table body or action buttons into a sub-component.

---

## Low Priority

### LOW-1: `PageLoader` in `app.tsx` duplicates `PageSpinner` from `spinner.tsx`
**Files:** `app.tsx:16-22` vs `spinner.tsx:26-32`

```typescript
// app.tsx
function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
    </div>
  );
}
```

This is essentially `PageSpinner` with `size="md"` instead of `size="lg"`. Use `PageSpinner` or `<Spinner />` instead.

### LOW-2: `AuthLoader` in `protected-route.tsx` also duplicates spinner
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\components\auth\protected-route.tsx:5-11`

Same spinner pattern duplicated a third time. Import `Spinner` from UI components.

### LOW-3: Lazy-loaded auth pages comment is misleading
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\app.tsx:6`

```typescript
// Auth pages -- loaded eagerly so they feel instant
const LoginPage = lazy(() => import("@/pages/login-page"));
```

Comment says "eagerly" but code uses `lazy()`. They're lazy-loaded.

### LOW-4: Unused `Link` import in `login-page.tsx`
**File:** The `Navigate` import is used (line 2) and `Link` is used (line 134). Actually, both are used -- disregard.

### LOW-5: `confirm-dialog.tsx` doesn't prevent double-click on confirm
The `onConfirm` callback fires on each click even while `isLoading` is true because `disabled` only prevents new clicks after React re-renders. For fast connections where `isLoading` toggles quickly, this is fine, but for slow connections, two clicks can land before `isPending` flips. Consumer must handle idempotency.

---

## Edge Cases Found by Scouting

### EDGE-1: `deleteOpen` can be true with `deletingResource` as null
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\resource-list-page.tsx:40-43`

The two state values are managed independently. If `setDeleteOpen(true)` fires without `setDeletingResource(item)` (unlikely in current code but possible via state race), the confirm dialog shows with `undefined?.name`. Use a single state variable or a reducer.

### EDGE-2: Closing edit modal during pending mutation
**Files:** `resource-edit-modal.tsx`, `resource-create-modal.tsx`

If user closes the dialog while mutation is in-flight, the `onSuccess` callback still calls `onOpenChange(false)` on an unmounted component. React Query handles this gracefully (no crash), but the optimistic update may flash back and forth.

### EDGE-3: `resource-detail-page.tsx` action buttons include "archive" and "restore" but optimistic update only maps "activate" and "deactivate"
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\pages\resource-detail-page.tsx:54-57`

```typescript
const statusMap: Record<string, string> = {
  activate: "active",
  deactivate: "inactive",
};
```

Clicking "Archive" or "Restore" sends the API call but no optimistic UI update happens. The button stays enabled with no visual feedback until the network request completes and `onSettled` invalidates the query.

### EDGE-4: Users page has no route-level authorization guard
**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\web\src\app.tsx:45`

The sidebar filters out the "Users" link for non-admins, but the route `/users` is not guarded. A non-admin can type `/users` directly in the URL bar and access the page (API would reject the request, but the page renders and makes the call).

---

## Positive Observations

1. **Optimistic updates** are implemented correctly with rollback in create, edit, delete, and action mutations. The `onMutate` / `onError` / `onSettled` pattern is textbook React Query.
2. **Component composition** follows shadcn/ui conventions faithfully -- `forwardRef`, `displayName`, `cn()` utility, `cva` for variants.
3. **Auth context** is well-designed with `useMemo` on context value, `useCallback` on actions, preventing unnecessary re-renders.
4. **Body scroll lock** in Dialog is properly cleaned up via effect return.
5. **Proper escape key handling** in Dialog.
6. **File organization** is clean: `components/ui/` for primitives, `components/resource/` for domain, `components/layout/` for layout, `pages/` for routes.
7. **Shared types** via `@app/shared` monorepo package -- single source of truth for types and schemas.
8. **Portal-based dialog** avoids z-index stacking issues.
9. **Backdrop click** handling is correct (checks `e.target === overlayRef.current`).
10. **Self-delete prevention** in users page (`isSelf` check).

---

## Recommended Actions (Priority Order)

1. **[CRIT-1]** Fix `getErrorMessage` to extract Axios response messages and deduplicate into shared utility
2. **[HIGH-3]** Add React Error Boundary (even a simple one wrapping `<Outlet />`)
3. **[HIGH-1]** Replace `resource!` non-null assertions with proper guards
4. **[HIGH-5]** Add server-side logout call
5. **[HIGH-6]** Preserve redirect URL through login flow
6. **[MED-4]** Use Zod schemas for resource form validation (consistency with auth forms)
7. **[MED-10]** Split `resource-list-page.tsx` below 200 lines
8. **[MED-7]** Fix `CardTitle` ref type from `HTMLParagraphElement` to `HTMLHeadingElement`
9. **[MED-1]** Unify dashboard/list query keys or add stats endpoint
10. **[EDGE-3]** Add "archive" and "restore" to optimistic status maps
11. **[EDGE-4]** Add admin-only route guard component

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 29 |
| Total LOC | ~2222 |
| TypeScript check | PASS (0 errors) |
| Files over 200 lines | 1 (`resource-list-page.tsx`: 265) |
| Critical issues | 2 |
| High issues | 6 |
| Medium issues | 10 |
| Low issues | 5 |
| Edge cases | 4 |

---

## Unresolved Questions

1. Is there a planned refresh token flow, or is the stored `refresh_token` vestigial?
2. Is Vietnamese the intended UI language (auth pages) or English (resource pages)?
3. Should non-admin users see a 403 page or be redirected when navigating to `/users`?
4. Will pagination be needed for the resource list, or is the 100-item limit sufficient?
