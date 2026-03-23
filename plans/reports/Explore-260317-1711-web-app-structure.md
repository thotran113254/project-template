# Web App Exploration Report

## Directory Structure
/home/automation/project-template/apps/web/src/
```
├── app.tsx                 # Root routing (BrowserRouter + Routes)
├── main.tsx               # App entry point (React 19 + QueryClient + Auth)
├── app.css                # Global styles
├── pages/                 # Route page components (lazy loaded)
│   ├── login-page.tsx
│   ├── register-page.tsx
│   ├── dashboard-page.tsx
│   ├── chat-page.tsx
│   ├── ai-settings-page.tsx  # ← Admin AI data settings
│   ├── knowledge-base-page.tsx
│   ├── profile-page.tsx
│   ├── users-page.tsx
│   ├── markets-page.tsx
│   ├── market-detail-page.tsx
│   ├── hotels*
│   ├── resources*
│   ├── itinerary*
│   └── ...
├── components/            # UI & feature components
│   ├── auth/
│   │   ├── protected-route.tsx  # Route guard + auth loader
│   │   └── ...
│   ├── chat/
│   │   ├── chat-input.tsx
│   │   ├── chat-message-bubble.tsx
│   │   ├── chat-session-sidebar.tsx
│   │   ├── chat-suggestion-chips.tsx
│   │   ├── chat-token-usage.tsx
│   │   └── markdown-renderer.tsx
│   ├── layout/
│   │   ├── app-layout.tsx       # Main layout wrapper
│   │   └── sidebar.tsx          # Navigation sidebar
│   ├── market-data/
│   │   ├── pricing-options-manager.tsx  # Combo/day type mgmt
│   │   └── ...
│   ├── knowledge-base/
│   │   └── kb-article-modal.tsx
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── spinner.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   └── ...
├── hooks/                 # React hooks
│   ├── use-auth.tsx       # Auth context + auth operations
│   ├── use-chat-stream.ts # SSE streaming for AI chat
│   ├── use-pricing-options.ts
│   ├── use-theme.ts
│   ├── use-confirm-action.ts
│   ├── use-optimistic-mutation.ts
│   └── ...
├── lib/                   # Utilities
│   ├── api-client.ts      # Axios instance with JWT + refresh
│   ├── error-utils.ts
│   ├── utils.ts           # cn() utility, etc.
│   └── ...
└── pages/
    └── (listed above)
```

## Routing Pattern

**File:** `/home/automation/project-template/apps/web/src/app.tsx`

```typescript
// Uses React Router v6
// Public routes: /login, /register
// Protected routes: everything else, guarded by <ProtectedRoute />
// Lazy loading: all page components are lazy() imported for code splitting

Routes:
  /login                    (public)
  /register                 (public)
  /dashboard                (protected)
  /chat                     (protected)
  /hotels                   (protected)
  /hotels/:slug             (protected)
  /knowledge-base           (protected, admin only via UI)
  /resources                (protected)
  /resources/:id            (protected)
  /users                    (protected, admin only)
  /profile                  (protected)
  /markets                  (protected, admin only)
  /markets/:id              (protected, admin only)
  /settings/ai              (protected, admin only)  ← Current AI settings
  /itinerary/:id            (protected)
  *                         → /dashboard
```

**Navigation:** Sidebar (`sidebar.tsx`) shows nav items based on user role:
- Admin-only items: /markets, /knowledge-base, /settings/ai, /users
- Regular user items: /dashboard, /chat, /hotels, /profile

---

## API Hook Pattern

**Primary Pattern:** TanStack React Query (useQuery, useMutation)

### Example 1: Simple Data Fetch (use-pricing-options.ts)
```typescript
export function usePricingOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ["pricing-options"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PricingOption[] }>("/pricing-options");
      return res.data.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  return { comboOptions, dayOptions, comboLabel, dayLabel, all, isLoading };
}
```

### Example 2: Mutations (ai-settings-page.tsx)
```typescript
const { data, isLoading, isError } = useQuery({
  queryKey: ["ai-data-settings"],
  queryFn: async () => {
    const res = await apiClient.get<{ data: AiDataSetting[] }>("/ai-data-settings");
    return res.data.data ?? [];
  },
});

const toggleMutation = useMutation({
  mutationFn: async ({ category, isEnabled }: { category: string; isEnabled: boolean }) => {
    await apiClient.patch(`/ai-data-settings/${category}`, { isEnabled });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["ai-data-settings"] });
  },
});
```

### Example 3: SSE Streaming (use-chat-stream.ts)
- Manual fetch() for SSE (not axios)
- Parses Server-Sent Events (event: / data: format)
- Buffered flushing at 50ms intervals (20fps)
- Returns: send, streamingText, isStreaming, error, lastUsage, pendingUserMessage, toolCalls

---

## Existing AI Settings UI (ai-settings-page.tsx)

**File:** `/home/automation/project-template/apps/web/src/pages/ai-settings-page.tsx` (117 lines)

**Functionality:**
- Admin-only page: checks `user?.role === "admin"`, redirects to /dashboard if not
- Lists AI data categories: market, competitor, target_customer, journey, attraction, dining, transportation, inventory_strategy, property, pricing, itinerary, evaluation
- Toggle switches to enable/disable each category
- Shows `updatedAt` date
- Includes `PricingOptionsManager` sub-component for combo/day type management

**API Calls:**
- GET `/ai-data-settings` (fetch all settings)
- PATCH `/ai-data-settings/{category}` (toggle enable/disable)

**UI Components Used:**
- PageSpinner (loading)
- Toggle switches (custom role="switch" buttons with aria-checked)
- TanStack Query (useQuery, useMutation, useQueryClient)

---

## API Client (lib/api-client.ts)

**Axios instance** with:
- Base URL: `import.meta.env.VITE_API_URL ?? "/api/v1"`
- JWT Bearer token from localStorage (request interceptor)
- Automatic token refresh on 401 (response interceptor)
- Queueing for concurrent requests during refresh
- NO_REFRESH_PATHS: /auth/login, /auth/register, /auth/refresh, /auth/logout

**Usage:**
```typescript
const res = await apiClient.get<{ data: T }>("/endpoint");
return res.data.data;
```

---

## Auth Pattern (hooks/use-auth.tsx)

**Context-based auth:**
```typescript
interface AuthContextValue extends AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}
```

**On mount:** Calls `GET /auth/me` to hydrate user from JWT tokens
**Login:** `POST /auth/login` → stores tokens in localStorage
**Protected routes:** Use `<ProtectedRoute />` which checks `isAuthenticated` and `isLoading`

---

## Component Patterns

### Admin Mgmt Components (e.g., pricing-options-manager.tsx)
Pattern:
1. Query with queryKey
2. useState for form state, dialog open, edit target
3. Two mutations: save (POST/PATCH) and delete (DELETE)
4. Modal dialog for add/edit
5. ConfirmDialog for delete
6. Validation: button disabled while pending or required fields empty

Key hooks:
- useQuery (list items)
- useMutation (save + delete)
- useQueryClient (invalidate cache after mutations)

---

## Key Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| /app.tsx | 77 | Root routes + lazy loading |
| /main.tsx | 31 | App entry (QueryClient, AuthProvider) |
| /pages/ai-settings-page.tsx | 117 | Admin AI data settings |
| /pages/chat-page.tsx | 293 | Full chat UI with SSE + session mgmt |
| /hooks/use-auth.tsx | 122 | Auth context + operations |
| /hooks/use-chat-stream.ts | 243 | SSE streaming hook |
| /hooks/use-pricing-options.ts | 29 | Pricing options query hook |
| /lib/api-client.ts | 124 | Axios + JWT + refresh logic |
| /components/layout/sidebar.tsx | 103+ | Navigation sidebar |
| /components/market-data/pricing-options-manager.tsx | 220 | Combo/day type CRUD |
| /components/auth/protected-route.tsx | 29 | Route guard |

---

## Unresolved Questions

- Are there database-level AI data settings stored per user vs. global?
- Should KB/RAG settings be per-market or per-user or global admin?
- Does the AI context caching feature need separate UI settings?
- Should there be KB search result limit settings?
