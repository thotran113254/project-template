import { getRedis, isRedisReady } from "./redis-client.js";

const BLACKLIST_PREFIX = "bl:";

// In-memory fallback when Redis is unavailable
const memoryBlacklist = new Map<string, number>();

// Clean expired in-memory entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of memoryBlacklist) {
    if (now > expiresAt) memoryBlacklist.delete(key);
  }
}, 5 * 60_000);

/**
 * Blacklist a token by its JTI so it can no longer be used.
 * @param jti - JWT ID of the token
 * @param ttlSec - Time to live in seconds (should match token's remaining lifetime)
 */
export async function blacklistToken(jti: string, ttlSec: number): Promise<void> {
  if (isRedisReady()) {
    const redis = getRedis();
    await redis.set(`${BLACKLIST_PREFIX}${jti}`, "1", "EX", ttlSec);
  } else {
    memoryBlacklist.set(jti, Date.now() + ttlSec * 1000);
  }
}

/**
 * Check if a token's JTI has been blacklisted.
 */
export async function isBlacklisted(jti: string): Promise<boolean> {
  if (isRedisReady()) {
    const redis = getRedis();
    const exists = await redis.exists(`${BLACKLIST_PREFIX}${jti}`);
    return exists === 1;
  }

  const expiresAt = memoryBlacklist.get(jti);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    memoryBlacklist.delete(jti);
    return false;
  }
  return true;
}
