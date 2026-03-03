import { Hono } from "hono";
import { createUserSchema, updateUserSchema, paginationQuerySchema } from "@app/shared";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as userService from "./user-service.js";

export const userRoutes = new Hono();

// All user management routes require admin
userRoutes.use("*", authMiddleware, adminMiddleware);

userRoutes.get("/", async (c) => {
  const query = paginationQuerySchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
  });
  const result = await userService.listUsers(query.page, query.limit);
  return c.json({ success: true, data: result.data, meta: result.meta });
});

userRoutes.get("/:id", async (c) => {
  const user = await userService.getUserById(c.req.param("id"));
  return c.json({ success: true, data: user });
});

userRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const dto = createUserSchema.parse(body);
  const user = await userService.createUser(dto);
  return c.json({ success: true, data: user }, 201);
});

userRoutes.patch("/:id", async (c) => {
  const body = await c.req.json();
  const dto = updateUserSchema.parse(body);
  const user = await userService.updateUser(c.req.param("id"), dto);
  return c.json({ success: true, data: user });
});

userRoutes.delete("/:id", async (c) => {
  const requester = c.get("user");
  await userService.deleteUser(c.req.param("id"), requester.sub);
  return c.json({ success: true, message: "User deleted" });
});
