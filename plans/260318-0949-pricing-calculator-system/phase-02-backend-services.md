# Phase 2: Backend Services + API Routes

## Context Links
- Existing transport service: `apps/api/src/modules/market-data/transportation-service.ts`
- Property rooms service: `apps/api/src/modules/market-data/property-rooms-service.ts`
- Market data routes: `apps/api/src/modules/market-data/market-data-routes.ts`
- Extra routes: `apps/api/src/modules/market-data/market-data-extra-routes.ts`
- Route index: `apps/api/src/routes/index.ts`
- Auth middleware: `apps/api/src/middleware/auth-middleware.ts` (authMiddleware, adminMiddleware)
- AI toggle service pattern: `apps/api/src/modules/market-data/ai-toggle-service.ts`

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** CRUD services for transport providers/pricing, update room pricing service for dual-price fields, role-based price filtering

## Key Insights
- Follow existing CRUD pattern from `transportation-service.ts` and `property-rooms-service.ts`
- Role-based filtering: service functions accept `userRole` param; strip discount fields for non-admin
- Existing `propertyRoomsService.listRoomPricing()` returns all fields - must filter discount columns when role=user
- `market-data-routes.ts` is already 276 lines - new transport provider routes go in `market-data-extra-routes.ts` to stay under 200 lines
- AI toggle already supports adding new entity types - just register "transport_provider" and "transport_pricing" in the toggle service

## Requirements

### Functional
1. Transport provider CRUD (list, create, update, delete) scoped to marketId
2. Transport pricing CRUD (list, create, update, delete) scoped to providerId
3. Bulk upsert for transport pricing (like existing `bulkUpsertRoomPricing`)
4. Room pricing response filtering: strip `discountPrice*` fields when user role != admin
5. Transport pricing response filtering: strip `*_discount_price` fields when user role != admin

### Non-functional
- All write endpoints require admin role
- All read endpoints require auth
- Consistent error handling (HTTPException pattern)
- AI visibility toggle support for new entities

## Architecture

```
market-data-routes.ts (existing, add provider list/CRUD under /:marketId/transport-providers)
market-data-extra-routes.ts (add transport pricing routes: /transport-providers/:providerId/pricing)
  |
  v
transport-provider-service.ts (NEW - CRUD for providers)
transport-pricing-service.ts (NEW - CRUD for pricing rows)
property-rooms-service.ts (MODIFY - add role-based filtering to listRoomPricing)
```

## Related Code Files

### Files to CREATE:
1. `apps/api/src/modules/market-data/transport-provider-service.ts` (~80 lines)
2. `apps/api/src/modules/market-data/transport-pricing-service.ts` (~90 lines)

### Files to MODIFY:
1. `apps/api/src/modules/market-data/property-rooms-service.ts` - add role param to pricing queries, filter discount fields
2. `apps/api/src/modules/market-data/market-data-routes.ts` - add transport provider CRUD routes under `/:marketId/transport-providers`
3. `apps/api/src/modules/market-data/market-data-extra-routes.ts` - add transport pricing routes, export new route objects
4. `apps/api/src/routes/index.ts` - mount new routes
5. `apps/api/src/modules/market-data/ai-toggle-service.ts` - register new entity types

## Implementation Steps

### Step 1: Create transport-provider-service.ts

```ts
// Pattern: same as transportation-service.ts
// Functions:
// - listProviders(marketId: string, category?: "bus" | "ferry")
// - getProviderById(id: string)
// - createProvider(data)
// - updateProvider(id, data)
// - deleteProvider(id)
```

Key: filter by `transportCategory` when category param provided. Order by `sortOrder`.

### Step 2: Create transport-pricing-service.ts

```ts
// Functions:
// - listPricingByProvider(providerId: string, userRole: string)
// - createPricing(data)
// - bulkUpsertPricing(providerId: string, items[])
// - updatePricing(id, data)
// - deletePricing(id)
```

**Role filtering logic for listPricingByProvider:**
```ts
function filterByRole(pricing: TransportPricingRecord[], role: string) {
  if (role === "admin") return pricing;
  return pricing.map(p => ({
    ...p,
    onewayDiscountPrice: null,
    roundtripDiscountPrice: null,
  }));
}
```

### Step 3: Update property-rooms-service.ts

Add `userRole` parameter to `listRoomPricing`:
```ts
export async function listRoomPricing(roomId: string, userRole = "user") {
  const rows = await db.select()...;
  if (userRole !== "admin") {
    return rows.map(r => ({
      ...r,
      discountPrice: null,
      discountPricePlus1: null,
      discountPriceMinus1: null,
    }));
  }
  return rows;
}
```

Also update `listRooms` to accept and pass through `userRole`.

### Step 4: Add transport provider routes to market-data-routes.ts

Add AFTER the existing transportation section (~line 198):
```ts
// --- Transport Providers (structured pricing) ---
marketDataRoutes.get("/:marketId/transport-providers", async (c) => {
  const category = c.req.query("category"); // "bus" | "ferry" | undefined
  const data = await transportProviderService.listProviders(c.req.param("marketId"), category);
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/transport-providers", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await transportProviderService.createProvider({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/transport-providers/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await transportProviderService.updateProvider(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/transport-providers/:id", adminMiddleware, async (c) => {
  await transportProviderService.deleteProvider(c.req.param("id"));
  return c.json({ success: true, message: "Transport provider deleted" });
});
```

### Step 5: Add transport pricing routes to market-data-extra-routes.ts

New exported route object `transportPricingRoutes`:
```ts
export const transportPricingRoutes = new Hono();
transportPricingRoutes.use("*", authMiddleware);

// GET /transport-providers/:providerId/pricing
transportPricingRoutes.get("/:providerId/pricing", async (c) => {
  const user = c.get("user");
  const data = await transportPricingService.listPricingByProvider(
    c.req.param("providerId"), user.role
  );
  return c.json({ success: true, data });
});

// POST /transport-providers/:providerId/pricing (admin)
transportPricingRoutes.post("/:providerId/pricing", adminMiddleware, ...);

// PUT /transport-providers/:providerId/pricing (bulk upsert, admin)
transportPricingRoutes.put("/:providerId/pricing", adminMiddleware, ...);

// PATCH /transport-providers/:providerId/pricing/:id (admin)
transportPricingRoutes.patch("/:providerId/pricing/:id", adminMiddleware, ...);

// DELETE /transport-providers/:providerId/pricing/:id (admin)
transportPricingRoutes.delete("/:providerId/pricing/:id", adminMiddleware, ...);
```

### Step 6: Mount routes in routes/index.ts

```ts
import { transportPricingRoutes } from "../modules/market-data/market-data-extra-routes.js";

// Transport pricing: /transport-providers/:providerId/pricing
routes.route("/transport-providers", transportPricingRoutes);
```

### Step 7: Update room pricing routes for role filtering

In `market-data-extra-routes.ts`, update the existing `roomPricingRoutes.get("/:roomId/pricing")`:
```ts
roomPricingRoutes.get("/:roomId/pricing", async (c) => {
  const user = c.get("user");
  const data = await propertyRoomsService.listRoomPricing(c.req.param("roomId"), user.role);
  return c.json({ success: true, data });
});
```

### Step 8: Register new entity types in ai-toggle-service.ts

Add "transport_provider" and "transport_pricing" to the entity type map so AI visibility toggle works.

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/markets/:marketId/transport-providers?category=bus\|ferry` | auth | List providers |
| POST | `/markets/:marketId/transport-providers` | admin | Create provider |
| PATCH | `/markets/:marketId/transport-providers/:id` | admin | Update provider |
| DELETE | `/markets/:marketId/transport-providers/:id` | admin | Delete provider |
| GET | `/transport-providers/:providerId/pricing` | auth | List pricing (role-filtered) |
| POST | `/transport-providers/:providerId/pricing` | admin | Create pricing |
| PUT | `/transport-providers/:providerId/pricing` | admin | Bulk upsert pricing |
| PATCH | `/transport-providers/:providerId/pricing/:id` | admin | Update pricing |
| DELETE | `/transport-providers/:providerId/pricing/:id` | admin | Delete pricing |

## Todo List
- [ ] Create transport-provider-service.ts
- [ ] Create transport-pricing-service.ts
- [ ] Update property-rooms-service.ts with role-based discount filtering
- [ ] Add transport provider routes to market-data-routes.ts
- [ ] Add transport pricing routes to market-data-extra-routes.ts
- [ ] Mount new routes in routes/index.ts
- [ ] Update room pricing GET route to pass user role
- [ ] Register new entity types in ai-toggle-service.ts
- [ ] Run typecheck

## Success Criteria
- All CRUD endpoints return correct data
- Non-admin users see `null` for all discount price fields
- Admin users see full pricing data
- `pnpm typecheck` passes

## Risk Assessment
- **Breaking change risk:** Updating `listRoomPricing` signature - callers must be checked. Currently called from `market-data-extra-routes.ts` GET route only. Safe.
- **Route conflict:** New route path `/transport-providers` is new, no conflict.

## Security Considerations
- Discount prices MUST be null-filtered at service layer, not just UI
- All write operations require `adminMiddleware`
- AI data fetchers (Phase 4) must also respect role-based filtering
