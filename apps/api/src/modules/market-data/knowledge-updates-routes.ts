import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as service from "./knowledge-updates-service.js";

export const knowledgeUpdatesRoutes = new Hono();
knowledgeUpdatesRoutes.use("*", authMiddleware);

// GET /markets/:marketId/knowledge-updates
knowledgeUpdatesRoutes.get("/", async (c) => {
  const user = c.get("user");
  const marketId = c.req.param("marketId") as string;
  // Admin sees all statuses; staff sees only approved
  const data = await service.listKnowledgeUpdates(marketId, user.role === "admin");
  return c.json({ success: true, data });
});

// POST /markets/:marketId/knowledge-updates
knowledgeUpdatesRoutes.post("/", async (c) => {
  const user = c.get("user");
  const marketId = c.req.param("marketId") as string;
  const body = await c.req.json();
  // Admin creates as approved; staff creates as pending_review
  const status = user.role === "admin" ? "approved" : "pending_review";
  const record = await service.createKnowledgeUpdate({
    ...body,
    marketId,
    createdBy: user.sub,
    status,
  });
  return c.json({ success: true, data: record }, 201);
});

// PATCH /markets/:marketId/knowledge-updates/:id
knowledgeUpdatesRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  // Staff can only edit their own pending entries
  if (user.role !== "admin") {
    const { and, eq } = await import("drizzle-orm");
    const { db } = await import("../../db/connection.js");
    const { marketKnowledgeUpdates } = await import("../../db/schema/index.js");
    const [existing] = await db.select().from(marketKnowledgeUpdates)
      .where(and(
        eq(marketKnowledgeUpdates.id, c.req.param("id")),
        eq(marketKnowledgeUpdates.createdBy, user.sub),
      )).limit(1);
    if (!existing) {
      return c.json({ success: false, message: "Not found or not authorized" }, 403);
    }
    // Staff cannot change status to approved
    delete body.status;
    delete body.aiVisible;
  }
  const record = await service.updateKnowledgeUpdate(c.req.param("id"), body);
  return c.json({ success: true, data: record });
});

// DELETE /markets/:marketId/knowledge-updates/:id (admin only)
knowledgeUpdatesRoutes.delete("/:id", adminMiddleware, async (c) => {
  await service.deleteKnowledgeUpdate(c.req.param("id"));
  return c.json({ success: true, message: "Knowledge update deleted" });
});
