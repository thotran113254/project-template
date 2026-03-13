import { Hono } from "hono";
import {
  createKbArticleSchema,
  updateKbArticleSchema,
  kbQuerySchema,
} from "@app/shared";
import {
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth-middleware.js";
import * as kbService from "./kb-service.js";
import { syncAllSheets } from "./google-sheets-sync-service.js";

export const kbRoutes = new Hono();

kbRoutes.use("*", authMiddleware);

kbRoutes.get("/", async (c) => {
  const query = kbQuerySchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    search: c.req.query("search"),
    category: c.req.query("category"),
    status: c.req.query("status"),
  });
  const result = await kbService.listArticles(query);
  return c.json({ success: true, data: result.data, meta: result.meta });
});

kbRoutes.get("/:id", async (c) => {
  const article = await kbService.getArticleById(c.req.param("id"));
  return c.json({ success: true, data: article });
});

kbRoutes.post("/", adminMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = createKbArticleSchema.parse(body);
  const article = await kbService.createArticle(dto, user.sub);
  return c.json({ success: true, data: article }, 201);
});

kbRoutes.patch("/:id", adminMiddleware, async (c) => {
  const body = await c.req.json();
  const dto = updateKbArticleSchema.parse(body);
  const article = await kbService.updateArticle(c.req.param("id"), dto);
  return c.json({ success: true, data: article });
});

kbRoutes.delete("/:id", adminMiddleware, async (c) => {
  await kbService.deleteArticle(c.req.param("id"));
  return c.json({ success: true, message: "Article deleted" });
});

kbRoutes.post("/sync", adminMiddleware, async (c) => {
  const result = await syncAllSheets();
  return c.json({ success: true, data: result });
});
