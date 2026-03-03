import { Hono } from "hono";
import {
  createResourceSchema,
  updateResourceSchema,
  resourceActionSchema,
  resourceQuerySchema,
} from "@app/shared";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import * as resourceService from "./resource-service.js";

export const resourceRoutes = new Hono();

// All resource routes require authentication
resourceRoutes.use("*", authMiddleware);

resourceRoutes.get("/", async (c) => {
  const user = c.get("user");
  const query = resourceQuerySchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    search: c.req.query("search"),
    status: c.req.query("status"),
    category: c.req.query("category"),
  });
  const result = await resourceService.listResources(
    user.sub,
    user.role,
    query,
  );
  return c.json({ success: true, data: result.data, meta: result.meta });
});

resourceRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const resource = await resourceService.getResourceById(
    c.req.param("id"),
    user.sub,
    user.role,
  );
  return c.json({ success: true, data: resource });
});

resourceRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = createResourceSchema.parse(body);
  const resource = await resourceService.createResource(dto, user.sub);
  return c.json({ success: true, data: resource }, 201);
});

resourceRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = updateResourceSchema.parse(body);
  const resource = await resourceService.updateResource(
    c.req.param("id"),
    dto,
    user.sub,
    user.role,
  );
  return c.json({ success: true, data: resource });
});

resourceRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  await resourceService.deleteResource(
    c.req.param("id"),
    user.sub,
    user.role,
  );
  return c.json({ success: true, message: "Resource deleted" });
});

resourceRoutes.post("/:id/action", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { action } = resourceActionSchema.parse(body);
  const resource = await resourceService.performAction(
    c.req.param("id"),
    action,
    user.sub,
    user.role,
  );
  return c.json({ success: true, data: resource });
});
