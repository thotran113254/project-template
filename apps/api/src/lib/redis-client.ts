import Redis from "ioredis";
import { env } from "../env.js";
import { logger } from "./logger.js";

let redis: Redis | null = null;

/**
 * Get or create the Redis singleton instance.
 * Uses lazyConnect so connection is deferred until first command.
 */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });
  }

  return redis;
}

/** Connect to Redis. Call once on startup. */
export async function connectRedis(): Promise<void> {
  try {
    const client = getRedis();
    await client.connect();
    logger.info("Redis connected");
  } catch (err) {
    logger.warn("Redis failed to connect, falling back to in-memory", {
      error: (err as Error).message,
    });
  }
}

/** Gracefully close Redis connection. */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info("Redis connection closed");
  }
}

/** Check if Redis is connected and responsive. */
export function isRedisReady(): boolean {
  return redis?.status === "ready";
}
