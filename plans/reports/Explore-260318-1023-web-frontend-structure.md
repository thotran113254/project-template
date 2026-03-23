# Web Frontend Structure Exploration

**Date:** 2026-03-18  
**Focus:** Admin and market data pages structure  
**Status:** Complete

---

## 1. Page Structure Overview

### All Pages in `/apps/web/src/pages/`

| File | Purpose | Access | Tabs/Sections |
|------|---------|--------|---|
| `dashboard-page.tsx` | Admin dashboard with stats & bookings | Protected | N/A - Single view |
| `markets-page.tsx` | List all markets for admin | Admin-only | N/A - Table view |
| `market-detail-page.tsx` | Market details with 10 tabs | Admin-only | See below |
| `chat-page.tsx` | AI chat assistant interface | Protected | N/A |
| `ai-settings-page.tsx` | Configure AI settings | Admin-only | Configuration form |
| `knowledge-base-page.tsx` | KB article management | Admin-only | Article list/detail |
| `hotel-search-page.tsx` | Search hotels by criteria | Public | Filters + results |
| `hotel-detail-page.tsx` | Hotel detail with reviews | Public | N/A |
| `itinerary-detail-page.tsx` | Itinerary timeline view | Protected | N/A |
| `resource-list-page.tsx` | CRUD list for resources | Admin-only | Table + create modal |
| `resource-detail-page.tsx` | Single resource detail | Admin-only | Form editor |
| `users-page.tsx` | User management table | Admin-only | Table + create modal |
| `profile-page.tsx` | User profile/settings | Protected | User data form |
| `login-page.tsx` | Authentication | Public | Login form |
| `register-page.tsx` | User signup | Public | Registration form |

### Router Configuration (apps/web/src/app.tsx)

```
/                          → /dashboard (redirect)
├─ Public routes
│  ├─ /login
│  └─ /register
│
└─ Protected routes (ProtectedRoute → AppLayout)
   ├─ /dashboard
   ├─ /chat
   ├─ /hotels
   ├─ /hotels/:slug
   ├─ /knowledge-base
   ├─ /resources
   ├─ /resources/:id
   ├─ /users
   ├─ /profile
   ├─ /itinerary/:id
   ├─ /markets                    (admin-only)
   ├─ /markets/:id                (admin-only)
   └─ /settings/ai                (admin-only)
```

---

## 2. Market Detail Page Tab Pattern

File: `/apps/web/src/pages/market-detail-page.tsx`

### Tab Structure (10 tabs)

```typescript
TABS = [
  { id: "overview", label: "Tổng quan" },           // MarketOverviewTab
  { id: "properties", label: "Cơ sở lưu trú" },     // PropertiesTab
  { id: "itineraries", label: "Lịch trình" },       // ItinerariesTab
  { id: "competitors", label: "Đối thủ" },          // CompetitorsTab
  { id: "target-customers", label: "KH mục tiêu" }, // TargetCustomersTab
  { id: "customer-journeys", label: "Hành trình KH" }, // CustomerJourneysTab
  { id: "attractions", label: "Điểm du lịch" },     // AttractionsTab
  { id: "dining", label: "Ẩm thực" },               // DiningSpotsTab
  { id: "transportation", label: "Phương tiện" },   // TransportationTab
  { id: "inventory", label: "Ôm quỹ phòng" },       // InventoryStrategiesTab
]
```

### Tab Component Pattern

Each tab is a separate component in `/apps/web/src/components/market-data/`:
- **Props:** `marketId`, `isAdmin` (for edit/delete permissions)
- **Styling:** Uses TailwindCSS v4 with CSS variables for theming
- **State:** Tabs use `useState` for active tab, component-level data fetching with React Query

### Key Implementation Details

```tsx
// Tab navigation pattern
<div className="flex gap-1 border-b border-[var(--border)] min-w-max">
  {TABS.map((tab) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={cn(
        activeTab === tab.id
          ? "border-teal-600 text-teal-700 dark:text-teal-400"
          : "border-transparent text-[var(--muted-foreground)]"
      )}
    >
      {tab.label}
    </button>
  ))}
</div>

// Tab content rendering
{activeTab === "overview" && <MarketOverviewTab market={market} isAdmin={isAdmin} />}
{activeTab === "properties" && <PropertiesTab marketId={market.id} isAdmin={isAdmin} />}
// ... etc
```

---

## 3. Market Data Components

Location: `/apps/web/src/components/market-data/`

**Tab Components (10 files):**
- `market-overview-tab.tsx` - Display market summary info
- `properties-tab.tsx` - Hotels/accommodations list & editor
- `itineraries-tab.tsx` - Travel itinerary templates
- `competitors-tab.tsx` - Competitor analysis data
- `target-customers-tab.tsx` - Customer segment definitions
- `customer-journeys-tab.tsx` - Customer journey mapping
- `attractions-tab.tsx` - Tourist attractions list
- `dining-spots-tab.tsx` - Restaurant/dining options
- `transportation-tab.tsx` - Transit options
- `inventory-strategies-tab.tsx` - Room inventory management

**Supporting Components (7 files):**
- `image-manager.tsx` - Upload/manage images for properties
- `property-detail-dialog.tsx` - Modal for property details
- `property-rooms-editor.tsx` - Room configuration interface
- `room-pricing-table.tsx` - Display room pricing matrix
- `pricing-options-manager.tsx` - Configure pricing options
- `itinerary-items-editor.tsx` - Edit itinerary items
- `ai-visibility-toggle.tsx` - Control AI context visibility

---

## 4. Navigation Structure

### Sidebar Navigation (components/layout/sidebar.tsx)

**Admin Section** (`adminOnly: true`):
- `"Thị trường"` → /markets (Globe icon)
- `"Cơ sở tri thức"` → /knowledge-base (BookOpen icon)
- `"Cài đặt AI"` → /settings/ai (Settings icon)
- `"Người dùng"` → /users (Users icon)

**Public Section**:
- `"Tổng quan"` → /dashboard (LayoutDashboard icon)
- `"Trợ lý AI"` → /chat (MessageSquare icon)
- `"Khách sạn"` → /hotels (Hotel icon)
- `"Hồ sơ"` → /profile (UserCircle icon)

Role-based visibility uses `useAuth()` hook to check `user.role === "admin"`

---

## 5. Data Layer Integration

### Query Pattern
All pages use React Query (TanStack Query) with:
- `useQuery()` hook for fetching data
- Query keys in format: `["entity", id]` e.g., `["market", id]`
- Default stale time: 5 minutes
- Auto-retry once on failure

### API Client
Uses custom `apiClient` from `/lib/api-client` with:
- Base path: `/api/v1`
- TypeScript response typing: `apiClient.get<{ data: T }>()`
- Handles auth tokens automatically

### Example from market-detail-page:
```tsx
const { data: market, isLoading, isError } = useQuery({
  queryKey: ["market", id],
  enabled: !!id,
  queryFn: async () => {
    const res = await apiClient.get<{ data: Market }>(`/markets/${id}`);
    return res.data.data;
  },
});
```

---

## 6. Theme & Styling System

### CSS Variables (Dark mode support)
- `--foreground` - Primary text color
- `--muted-foreground` - Secondary text color
- `--background` - Page background
- `--card` - Card background
- `--border` - Border color
- `--primary` - Primary action color (teal-600)

### Utility Classes
- Using `cn()` utility (clsx equivalent) for conditional classes
- TailwindCSS v4 with predefined color scheme (teal/slate)
- Responsive classes for mobile-first design
- `dark:` prefix for dark mode overrides

---

## 7. Component Composition Pattern

### Standard Tab Component Structure
```tsx
export function PropertiesTab({ marketId, isAdmin }: {
  marketId: string;
  isAdmin: boolean;
}) {
  // 1. Fetch data with useQuery
  const { data, isLoading } = useQuery({...})
  
  // 2. Local UI state
  const [selectedId, setSelectedId] = useState(null)
  
  // 3. Edit/create handlers (if admin)
  
  // 4. Render data table + dialogs for edit/create
  return (...)
}
```

---

## Key Architectural Observations

1. **Lazy Loading:** Pages use React `lazy()` + `Suspense` for code-splitting
2. **Auth Protection:** All non-login routes protected by `ProtectedRoute` wrapper
3. **Admin Gating:** `isAdmin` prop passed through component tree, no mid-tree redirects
4. **Localization:** UI text in Vietnamese (Tiếng Việt), suggesting i18n support planned
5. **Accessibility:** Uses semantic HTML, Lucide icons for visual consistency
6. **Type Safety:** Full TypeScript, imported types from `@app/shared` package
7. **Error Handling:** Simple error fallback UI, no detailed error messages shown

---

## Unresolved Questions

1. How are the tab components internally managing CRUD operations (create, update, delete)?
2. What's the exact schema of `Market` type in shared package?
3. Is there pagination on the market data tables?
4. How are images uploaded and stored for properties?
5. What's the real-time sync strategy for market data edits?
