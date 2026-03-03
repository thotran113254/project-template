import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { users } from "../../db/schema/index.js";
import { hashPassword, comparePassword } from "../../lib/password-utils.js";
import { generateTokens, verifyRefreshToken, getTokenRemainingTtl } from "../../lib/jwt-utils.js";
import { blacklistToken, isBlacklisted } from "../../lib/token-blacklist.js";
import type {
  AuthTokens,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  User,
} from "@app/shared";

interface AuthResult {
  tokens: AuthTokens;
  user: User;
}

function toPublicUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as "admin" | "user",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function register(dto: RegisterDto): Promise<AuthResult> {
  const passwordHash = await hashPassword(dto.password);

  let newUser: typeof users.$inferSelect;
  try {
    const [inserted] = await db
      .insert(users)
      .values({
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: "user",
      })
      .returning();
    newUser = inserted!;
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      throw new HTTPException(409, { message: "Email already registered" });
    }
    throw err;
  }

  const tokens = await generateTokens({
    sub: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return { tokens, user: toPublicUser(newUser) };
}

export async function login(dto: LoginDto): Promise<AuthResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  const isValid = await comparePassword(dto.password, user.passwordHash);
  if (!isValid) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  const tokens = await generateTokens({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { tokens, user: toPublicUser(user) };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const payload = await verifyRefreshToken(refreshToken).catch(() => {
    throw new HTTPException(401, { message: "Invalid or expired refresh token" });
  });

  // Check if the refresh token has been blacklisted (logged out)
  if (payload.jti && (await isBlacklisted(payload.jti))) {
    throw new HTTPException(401, { message: "Token has been revoked" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) {
    throw new HTTPException(401, { message: "User not found" });
  }

  // Blacklist the old refresh token to prevent reuse
  if (payload.jti) {
    const ttl = getTokenRemainingTtl(payload);
    if (ttl > 0) await blacklistToken(payload.jti, ttl);
  }

  return generateTokens({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}

/** Blacklist the provided refresh token so it can't be reused. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload.jti) {
      const ttl = getTokenRemainingTtl(payload);
      if (ttl > 0) await blacklistToken(payload.jti, ttl);
    }
  } catch {
    // Token already invalid or expired — nothing to blacklist
  }
}

export async function getProfile(userId: string): Promise<User> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return toPublicUser(user);
}

export async function updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
  if (dto.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (existing && existing.id !== userId) {
      throw new HTTPException(409, { message: "Email already in use" });
    }
  }

  const updateFields: Record<string, unknown> = { ...dto, updatedAt: sql`now()` };
  const [updated] = await db
    .update(users)
    .set(updateFields)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) throw new HTTPException(404, { message: "User not found" });
  return toPublicUser(updated);
}

export async function changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new HTTPException(404, { message: "User not found" });

  const isValid = await comparePassword(dto.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new HTTPException(400, { message: "Current password is incorrect" });
  }

  const newHash = await hashPassword(dto.newPassword);
  await db.update(users).set({ passwordHash: newHash, updatedAt: sql`now()` }).where(eq(users.id, userId));
}
