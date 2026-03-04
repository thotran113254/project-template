import { Hono } from "hono";
import {
  createPricingRuleSchema,
  updatePricingRuleSchema,
  calculatePriceSchema,
} from "@app/shared";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth-middleware.js";
import * as pricingService from "./pricing-service.js";

export const pricingRoutes = new Hono();

pricingRoutes.use("*", authMiddleware);

pricingRoutes.get("/rules", async (c) => {
  const hotelId = c.req.query("hotelId");
  const rules = await pricingService.listRules(hotelId);
  return c.json({ success: true, data: rules });
});

pricingRoutes.get("/rules/:id", async (c) => {
  const rule = await pricingService.getRuleById(c.req.param("id"));
  return c.json({ success: true, data: rule });
});

pricingRoutes.post("/rules", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const dto = createPricingRuleSchema.parse(body);
  const rule = await pricingService.createRule(dto);
  return c.json({ success: true, data: rule }, 201);
});

pricingRoutes.patch("/rules/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const dto = updatePricingRuleSchema.parse(body);
  const rule = await pricingService.updateRule(c.req.param("id"), dto);
  return c.json({ success: true, data: rule });
});

pricingRoutes.delete("/rules/:id", adminMiddleware, async (c) => {
  await pricingService.deleteRule(c.req.param("id"));
  return c.json({ success: true, message: "Pricing rule deleted" });
});

pricingRoutes.post("/calculate", async (c) => {
  const body = await c.req.json();
  const dto = calculatePriceSchema.parse(body);
  const result = await pricingService.calculatePrice(dto);
  return c.json({ success: true, data: result });
});
