import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as service from "./knowledge-review-service.js";

export const knowledgeReviewRoutes = new Hono();
knowledgeReviewRoutes.use("*", authMiddleware);

// GET /knowledge-reviews — admin: all/filtered; staff: own submissions
knowledgeReviewRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (user.role === "admin") {
    const status = c.req.query("status");
    const data = await service.listAllForReview(status);
    return c.json({ success: true, data });
  }
  // Staff: only their own submissions
  const data = await service.listMySubmissions(user.sub);
  return c.json({ success: true, data });
});

// GET /knowledge-reviews/mine — staff: own submissions explicitly
knowledgeReviewRoutes.get("/mine", async (c) => {
  const user = c.get("user");
  const data = await service.listMySubmissions(user.sub);
  return c.json({ success: true, data });
});

// PATCH /knowledge-reviews/:id/approve — admin only
knowledgeReviewRoutes.patch("/:id/approve", adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const record = await service.approveEntry(c.req.param("id"), user.sub, body.reviewNotes);
  return c.json({ success: true, data: record });
});

// PATCH /knowledge-reviews/:id/reject — admin only
knowledgeReviewRoutes.patch("/:id/reject", adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const record = await service.rejectEntry(c.req.param("id"), user.sub, body.reviewNotes);
  return c.json({ success: true, data: record });
});
