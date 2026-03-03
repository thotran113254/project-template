import { describe, it, expect } from "vitest";
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenRemainingTtl,
} from "../lib/jwt-utils.js";

const testPayload = { sub: "user-123", email: "test@example.com", role: "user" };

describe("jwt-utils", () => {
  it("should generate access and refresh tokens", async () => {
    const tokens = await generateTokens(testPayload);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe("string");
    expect(typeof tokens.refreshToken).toBe("string");
  });

  it("should verify a valid access token and return payload", async () => {
    const { accessToken } = await generateTokens(testPayload);
    const payload = await verifyAccessToken(accessToken);
    expect(payload.sub).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("user");
    expect(payload.jti).toBeDefined();
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
  });

  it("should verify a valid refresh token and return payload", async () => {
    const { refreshToken } = await generateTokens(testPayload);
    const payload = await verifyRefreshToken(refreshToken);
    expect(payload.sub).toBe("user-123");
    expect(payload.jti).toBeDefined();
  });

  it("should reject an invalid access token", async () => {
    await expect(verifyAccessToken("invalid-token")).rejects.toThrow();
  });

  it("should reject an access token verified as refresh token", async () => {
    const { accessToken } = await generateTokens(testPayload);
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
  });

  it("should generate unique jti for each token", async () => {
    const tokens1 = await generateTokens(testPayload);
    const tokens2 = await generateTokens(testPayload);
    const p1 = await verifyAccessToken(tokens1.accessToken);
    const p2 = await verifyAccessToken(tokens2.accessToken);
    expect(p1.jti).not.toBe(p2.jti);
  });

  it("getTokenRemainingTtl should return positive seconds for valid token", async () => {
    const { accessToken } = await generateTokens(testPayload);
    const payload = await verifyAccessToken(accessToken);
    const ttl = getTokenRemainingTtl(payload);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(15 * 60); // 15m max
  });

  it("getTokenRemainingTtl should return 0 for missing exp", () => {
    const ttl = getTokenRemainingTtl({ sub: "x", email: "x", role: "x" });
    expect(ttl).toBe(0);
  });
});
