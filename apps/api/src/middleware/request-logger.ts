import type { Context, Next } from "hono";
import { logger } from "../lib/logger.js";

/** Structured request logging middleware. Skips health check. */
export async function requestLogger(c: Context, next: Next): Promise<void> {
  // Skip health check to reduce noise
  if (c.req.path === "/health") {
    await next();
    return;
  }

  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  const user = c.get("user" as never) as { sub?: string } | undefined;

  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    userId: user?.sub,
    ip:
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown",
  });
}
