import { Hono } from "hono";
import { comboCalculateSchema } from "@app/shared";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { calculateCombo } from "./combo-calculator-service.js";

export const comboCalculatorRoutes = new Hono();

comboCalculatorRoutes.use("*", authMiddleware);

// POST /combo-calculator/calculate
comboCalculatorRoutes.post("/calculate", async (c) => {
  const body = await c.req.json();
  const dto = comboCalculateSchema.parse(body);
  const user = c.get("user") as { role: string };
  const result = await calculateCombo(dto, user.role);
  return c.json({ success: true, data: result });
});
