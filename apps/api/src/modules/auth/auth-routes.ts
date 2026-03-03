import { Hono } from "hono";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@app/shared";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import * as authService from "./auth-service.js";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const dto = registerSchema.parse(body);
  const result = await authService.register(dto);
  return c.json({ success: true, data: result }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const dto = loginSchema.parse(body);
  const result = await authService.login(dto);
  return c.json({ success: true, data: result });
});

authRoutes.post("/refresh", async (c) => {
  const body = await c.req.json();
  const { refreshToken } = refreshSchema.parse(body);
  const tokens = await authService.refresh(refreshToken);
  return c.json({ success: true, data: tokens });
});

authRoutes.post("/logout", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = logoutSchema.safeParse(body);

  if (parsed.success) {
    await authService.logout(parsed.data.refreshToken);
  }

  return c.json({ success: true, message: "Logged out" });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await authService.getProfile(user.sub);
  return c.json({ success: true, data: profile });
});

authRoutes.patch("/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = updateProfileSchema.parse(body);
  const updated = await authService.updateProfile(user.sub, dto);
  return c.json({ success: true, data: updated });
});

authRoutes.post("/change-password", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = changePasswordSchema.parse(body);
  await authService.changePassword(user.sub, dto);
  return c.json({ success: true, message: "Password changed successfully" });
});
