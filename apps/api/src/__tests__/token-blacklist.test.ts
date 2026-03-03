import { describe, it, expect, beforeEach } from "vitest";

// Import after env is set by setup.ts — blacklist falls back to in-memory
import { blacklistToken, isBlacklisted } from "../lib/token-blacklist.js";

describe("token-blacklist (in-memory fallback)", () => {
  const testJti = `test-jti-${Date.now()}`;

  it("should not be blacklisted initially", async () => {
    const result = await isBlacklisted(`unknown-jti-${Date.now()}`);
    expect(result).toBe(false);
  });

  it("should blacklist a token and detect it", async () => {
    await blacklistToken(testJti, 60);
    const result = await isBlacklisted(testJti);
    expect(result).toBe(true);
  });

  it("should not detect a different jti", async () => {
    const result = await isBlacklisted("different-jti");
    expect(result).toBe(false);
  });
});
