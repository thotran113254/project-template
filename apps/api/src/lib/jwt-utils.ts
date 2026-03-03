import { randomUUID } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";
import { env } from "../env.js";
import type { JwtPayload } from "@app/shared";

type TokenPayload = Omit<JwtPayload, "jti" | "iat" | "exp">;

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return parseInt(expiry, 10);
  }
}

/**
 * Generate access and refresh token pair for a user.
 */
export async function generateTokens(
  payload: TokenPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

  const accessExpiresIn = parseExpiry(env.JWT_ACCESS_EXPIRES_IN);
  const refreshExpiresIn = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  const accessToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + accessExpiresIn)
    .sign(accessSecret);

  const refreshToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + refreshExpiresIn)
    .sign(refreshSecret);

  return { accessToken, refreshToken };
}

/**
 * Verify an access token and return the decoded payload.
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return extractPayload(payload);
}

/**
 * Verify a refresh token and return the decoded payload.
 */
export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return extractPayload(payload);
}

function extractPayload(payload: JoseJWTPayload): JwtPayload {
  const sub = payload["sub"];
  const email = payload["email"];
  const role = payload["role"];

  if (typeof sub !== "string" || typeof email !== "string" || typeof role !== "string") {
    throw new Error("Invalid token payload: missing required fields");
  }

  return {
    sub,
    email,
    role,
    jti: payload.jti,
    iat: payload.iat,
    exp: payload.exp,
  };
}

/** Get the remaining TTL in seconds for a token (for blacklisting). */
export function getTokenRemainingTtl(payload: JwtPayload): number {
  if (!payload.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
