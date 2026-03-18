import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as marketsService from "./markets-service.js";
import * as competitorsService from "./competitors-service.js";
import * as customerJourneysService from "./customer-journeys-service.js";
import * as targetCustomersService from "./target-customers-service.js";
import * as attractionsService from "./attractions-service.js";
import * as diningSpotsService from "./dining-spots-service.js";
import * as transportationService from "./transportation-service.js";
import * as inventoryStrategiesService from "./inventory-strategies-service.js";
import * as propertiesService from "./properties-service.js";
import * as propertyRoomsService from "./property-rooms-service.js";
import * as evaluationService from "./evaluation-service.js";
import * as itineraryService from "./itinerary-service.js";
import * as pricingConfigsService from "./pricing-configs-service.js";
import * as aiDataSettingsService from "./ai-data-settings-service.js";
import * as aiToggleService from "./ai-toggle-service.js";
import * as transportProviderService from "./transport-provider-service.js";

export const marketDataRoutes = new Hono();

// All routes require auth
marketDataRoutes.use("*", authMiddleware);

// ─── Markets ──────────────────────────────────────────────────────────────────

marketDataRoutes.get("/", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const limit = Number(c.req.query("limit") ?? 20);
  const search = c.req.query("search");
  const result = await marketsService.listMarkets(page, limit, search);
  return c.json({ success: true, ...result });
});

marketDataRoutes.get("/:marketId", async (c) => {
  const market = await marketsService.getMarketById(c.req.param("marketId"));
  return c.json({ success: true, data: market });
});

marketDataRoutes.post("/", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const market = await marketsService.createMarket(body);
  return c.json({ success: true, data: market }, 201);
});

marketDataRoutes.patch("/:marketId", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const market = await marketsService.updateMarket(c.req.param("marketId"), body);
  return c.json({ success: true, data: market });
});

marketDataRoutes.delete("/:marketId", adminMiddleware, async (c) => {
  await marketsService.deleteMarket(c.req.param("marketId"));
  return c.json({ success: true, message: "Market deleted" });
});

// ─── Competitors ──────────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/competitors", async (c) => {
  const data = await competitorsService.listCompetitors(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/competitors", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await competitorsService.createCompetitor({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/competitors/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await competitorsService.updateCompetitor(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/competitors/:id", adminMiddleware, async (c) => {
  await competitorsService.deleteCompetitor(c.req.param("id"));
  return c.json({ success: true, message: "Competitor deleted" });
});

// ─── Customer Journeys ────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/customer-journeys", async (c) => {
  const data = await customerJourneysService.listCustomerJourneys(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/customer-journeys", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await customerJourneysService.createCustomerJourney({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/customer-journeys/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await customerJourneysService.updateCustomerJourney(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/customer-journeys/:id", adminMiddleware, async (c) => {
  await customerJourneysService.deleteCustomerJourney(c.req.param("id"));
  return c.json({ success: true, message: "Customer journey deleted" });
});

// ─── Target Customers ─────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/target-customers", async (c) => {
  const data = await targetCustomersService.listTargetCustomers(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/target-customers", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await targetCustomersService.createTargetCustomer({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/target-customers/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await targetCustomersService.updateTargetCustomer(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/target-customers/:id", adminMiddleware, async (c) => {
  await targetCustomersService.deleteTargetCustomer(c.req.param("id"));
  return c.json({ success: true, message: "Target customer deleted" });
});

// ─── Attractions ──────────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/attractions", async (c) => {
  const data = await attractionsService.listAttractions(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/attractions", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await attractionsService.createAttraction({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/attractions/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await attractionsService.updateAttraction(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/attractions/:id", adminMiddleware, async (c) => {
  await attractionsService.deleteAttraction(c.req.param("id"));
  return c.json({ success: true, message: "Attraction deleted" });
});

// ─── Dining Spots ─────────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/dining-spots", async (c) => {
  const data = await diningSpotsService.listDiningSpots(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/dining-spots", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await diningSpotsService.createDiningSpot({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/dining-spots/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await diningSpotsService.updateDiningSpot(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/dining-spots/:id", adminMiddleware, async (c) => {
  await diningSpotsService.deleteDiningSpot(c.req.param("id"));
  return c.json({ success: true, message: "Dining spot deleted" });
});

// ─── Transportation ───────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/transportation", async (c) => {
  const data = await transportationService.listTransportation(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/transportation", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await transportationService.createTransportation({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/transportation/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await transportationService.updateTransportation(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/transportation/:id", adminMiddleware, async (c) => {
  await transportationService.deleteTransportation(c.req.param("id"));
  return c.json({ success: true, message: "Transportation deleted" });
});

// ─── Inventory Strategies ─────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/inventory-strategies", async (c) => {
  const data = await inventoryStrategiesService.listInventoryStrategies(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/inventory-strategies", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await inventoryStrategiesService.createInventoryStrategy({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/inventory-strategies/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await inventoryStrategiesService.updateInventoryStrategy(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/inventory-strategies/:id", adminMiddleware, async (c) => {
  await inventoryStrategiesService.deleteInventoryStrategy(c.req.param("id"));
  return c.json({ success: true, message: "Inventory strategy deleted" });
});

// ─── Properties ───────────────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/properties", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const limit = Number(c.req.query("limit") ?? 20);
  const result = await propertiesService.listProperties(
    c.req.param("marketId"), page, limit,
    c.req.query("type"), c.req.query("status"),
  );
  return c.json({ success: true, ...result });
});

marketDataRoutes.post("/:marketId/properties", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await propertiesService.createProperty({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/properties/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await propertiesService.updateProperty(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/properties/:id", adminMiddleware, async (c) => {
  await propertiesService.deleteProperty(c.req.param("id"));
  return c.json({ success: true, message: "Property deleted" });
});

// ─── Transport Providers ──────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/transport-providers", async (c) => {
  const category = c.req.query("category") as "bus" | "ferry" | undefined;
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

// ─── Itinerary Templates ──────────────────────────────────────────────────────

marketDataRoutes.get("/:marketId/itineraries", async (c) => {
  const data = await itineraryService.listTemplates(c.req.param("marketId"));
  return c.json({ success: true, data });
});

marketDataRoutes.post("/:marketId/itineraries", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await itineraryService.createTemplate({ ...body, marketId: c.req.param("marketId") });
  return c.json({ success: true, data: record }, 201);
});

marketDataRoutes.patch("/:marketId/itineraries/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await itineraryService.updateTemplate(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

marketDataRoutes.delete("/:marketId/itineraries/:id", adminMiddleware, async (c) => {
  await itineraryService.deleteTemplate(c.req.param("id"));
  return c.json({ success: true, message: "Itinerary template deleted" });
});
