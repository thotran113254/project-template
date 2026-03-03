import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { verifyAccessToken } from "../lib/jwt-utils.js";
import type { JwtPayload } from "@app/shared";

// Extend Hono's ContextVariableMap to include typed user variable
declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

/**
 * Middleware that verifies a JWT access token from the Authorization header.
 * Sets the decoded payload as `c.var.user` for downstream handlers.
 */
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = await verifyAccessToken(token);
    c.set("user", payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired access token" });
  }
}

/**
 * Middleware that requires the authenticated user to have the admin role.
 * Must be used AFTER authMiddleware.
 */
export async function adminMiddleware(c: Context, next: Next): Promise<void> {
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  if (user.role !== "admin") {
    throw new HTTPException(403, { message: "Admin access required" });
  }

  await next();
}
