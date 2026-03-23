import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as service from "./experiences-service.js";

export const experiencesRoutes = new Hono();
experiencesRoutes.use("*", authMiddleware);

// GET /markets/:marketId/experiences
experiencesRoutes.get("/", async (c) => {
  const data = await service.listExperiences(c.req.param("marketId") as string);
  return c.json({ success: true, data });
});

// POST /markets/:marketId/experiences (admin only)
experiencesRoutes.post("/", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await service.createExperience({
    ...body,
    marketId: c.req.param("marketId") as string,
  });
  return c.json({ success: true, data: record }, 201);
});

// PATCH /markets/:marketId/experiences/:id (admin only)
experiencesRoutes.patch("/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const record = await service.updateExperience(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

// DELETE /markets/:marketId/experiences/:id (admin only)
experiencesRoutes.delete("/:id", adminMiddleware, async (c) => {
  await service.deleteExperience(c.req.param("id"));
  return c.json({ success: true, message: "Experience deleted" });
});
