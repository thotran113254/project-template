import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../env.js";
import { getRedis, isRedisReady } from "../lib/redis-client.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback store
const memoryStore = new Map<string, RateLimitEntry>();

// Clean expired in-memory entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}, 5 * 60_000);

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

async function checkRedisRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const redis = getRedis();
  const key = `rl:${ip}`;
  const windowSec = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }

  if (count > env.RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSec };
  }

  return { allowed: true, retryAfter: 0 };
}

function checkMemoryRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = memoryStore.get(ip);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(ip, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > env.RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Rate limiter middleware using Redis with in-memory fallback.
 */
export async function rateLimiter(c: Context, next: Next): Promise<void> {
  const ip = getClientIp(c);

  let result: { allowed: boolean; retryAfter: number };

  if (isRedisReady()) {
    try {
      result = await checkRedisRateLimit(ip);
    } catch {
      result = checkMemoryRateLimit(ip);
    }
  } else {
    result = checkMemoryRateLimit(ip);
  }

  if (!result.allowed) {
    c.header("Retry-After", String(result.retryAfter));
    throw new HTTPException(429, { message: "Too many requests" });
  }

  await next();
}
