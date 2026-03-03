import { eq, count, sql, desc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { users } from "../../db/schema/index.js";
import { hashPassword } from "../../lib/password-utils.js";
import type { User, CreateUserDto, UpdateUserDto, PaginationMeta } from "@app/shared";

const userSelect = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as "admin" | "user",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUsers(
  page: number,
  limit: number,
): Promise<{ data: User[]; meta: PaginationMeta }> {
  const offset = (page - 1) * limit;
  const [rows, [countResult]] = await Promise.all([
    db
      .select(userSelect)
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users),
  ]);

  return {
    data: rows.map(toUser),
    meta: {
      page,
      limit,
      total: countResult!.total,
      totalPages: Math.ceil(countResult!.total / limit),
    },
  };
}

export async function getUserById(id: string): Promise<User> {
  const [user] = await db
    .select(userSelect)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) throw new HTTPException(404, { message: "User not found" });
  return toUser(user);
}

export async function createUser(dto: CreateUserDto): Promise<User> {
  const passwordHash = await hashPassword(dto.password);

  // Let DB unique constraint handle race conditions
  let newUser: UserRow;
  try {
    const [inserted] = await db
      .insert(users)
      .values({ email: dto.email, name: dto.name, passwordHash })
      .returning(userSelect);
    newUser = inserted!;
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      throw new HTTPException(409, { message: "Email already exists" });
    }
    throw err;
  }

  return toUser(newUser);
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  // Check email uniqueness if email is being changed
  if (dto.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);
    if (existing && existing.id !== id) {
      throw new HTTPException(409, { message: "Email already in use" });
    }
  }

  const [updated] = await db
    .update(users)
    .set({ ...dto, updatedAt: sql`now()` })
    .where(eq(users.id, id))
    .returning(userSelect);

  if (!updated) throw new HTTPException(404, { message: "User not found" });
  return toUser(updated);
}

export async function deleteUser(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) {
    throw new HTTPException(400, { message: "Cannot delete yourself" });
  }

  const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (result.length === 0) throw new HTTPException(404, { message: "User not found" });
}
