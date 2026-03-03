import { eq, and, or, ilike, count, sql, desc, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { resources } from "../../db/schema/index.js";
import type {
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
  ResourceAction,
  PaginationMeta,
} from "@app/shared";
import type { ResourceQuery } from "@app/shared";

function toResource(row: typeof resources.$inferSelect): Resource {
  return {
    ...row,
    status: row.status as Resource["status"],
    metadata: (row.metadata ?? {}) as Record<string, string>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function canAccess(
  resource: typeof resources.$inferSelect,
  userId: string,
  role: string,
): boolean {
  return role === "admin" || resource.userId === userId;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate a unique slug, appending a counter suffix on collision. */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;

  while (attempt < 10) {
    const condition = excludeId
      ? sql`${resources.slug} = ${slug} AND ${resources.id} != ${excludeId}`
      : eq(resources.slug, slug);
    const [existing] = await db
      .select({ id: resources.id })
      .from(resources)
      .where(condition)
      .limit(1);

    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }

  // Fallback: append timestamp
  return `${base}-${Date.now()}`;
}

export async function listResources(
  userId: string,
  role: string,
  query: ResourceQuery,
): Promise<{ data: Resource[]; meta: PaginationMeta }> {
  const { page, limit, search, status, category } = query;
  const offset = (page - 1) * limit;

  // Build conditions array
  const conditions: SQL[] = [];
  if (role !== "admin") conditions.push(eq(resources.userId, userId));
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(resources.name, pattern), ilike(resources.description, pattern))!,
    );
  }
  if (status) conditions.push(eq(resources.status, status));
  if (category) conditions.push(eq(resources.category, category));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countResult]] = await Promise.all([
    whereClause
      ? db.select().from(resources).where(whereClause).orderBy(desc(resources.createdAt)).limit(limit).offset(offset)
      : db.select().from(resources).orderBy(desc(resources.createdAt)).limit(limit).offset(offset),
    whereClause
      ? db.select({ total: count() }).from(resources).where(whereClause)
      : db.select({ total: count() }).from(resources),
  ]);

  return {
    data: rows.map(toResource),
    meta: {
      page,
      limit,
      total: countResult!.total,
      totalPages: Math.ceil(countResult!.total / limit),
    },
  };
}

export async function getResourceById(
  id: string,
  userId: string,
  role: string,
): Promise<Resource> {
  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  if (!resource)
    throw new HTTPException(404, { message: "Resource not found" });
  if (!canAccess(resource, userId, role))
    throw new HTTPException(403, { message: "Access denied" });

  return toResource(resource);
}

export async function createResource(
  dto: CreateResourceDto,
  userId: string,
): Promise<Resource> {
  const slug = await generateUniqueSlug(dto.name);

  const [resource] = await db
    .insert(resources)
    .values({
      name: dto.name,
      slug,
      description: dto.description,
      category: dto.category,
      metadata: dto.metadata ?? {},
      status: "inactive",
      userId,
    })
    .returning();

  return toResource(resource!);
}

export async function updateResource(
  id: string,
  dto: UpdateResourceDto,
  userId: string,
  role: string,
): Promise<Resource> {
  const [existing] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);
  if (!existing)
    throw new HTTPException(404, { message: "Resource not found" });
  if (!canAccess(existing, userId, role))
    throw new HTTPException(403, { message: "Access denied" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields: Record<string, any> = {
    ...dto,
    updatedAt: sql`now()`,
  };

  if (dto.name) {
    updateFields.slug = await generateUniqueSlug(dto.name, id);
  }

  const [updated] = await db
    .update(resources)
    .set(updateFields)
    .where(eq(resources.id, id))
    .returning();

  return toResource(updated!);
}

export async function deleteResource(
  id: string,
  userId: string,
  role: string,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);
  if (!existing)
    throw new HTTPException(404, { message: "Resource not found" });
  if (!canAccess(existing, userId, role))
    throw new HTTPException(403, { message: "Access denied" });

  await db.delete(resources).where(eq(resources.id, id));
}

const ACTION_STATUS_MAP: Record<ResourceAction, string> = {
  activate: "active",
  deactivate: "inactive",
  archive: "inactive",
  restore: "active",
};

export async function performAction(
  id: string,
  action: ResourceAction,
  userId: string,
  role: string,
): Promise<Resource> {
  const [existing] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);
  if (!existing)
    throw new HTTPException(404, { message: "Resource not found" });
  if (!canAccess(existing, userId, role))
    throw new HTTPException(403, { message: "Access denied" });

  const newStatus = ACTION_STATUS_MAP[action];
  const [updated] = await db
    .update(resources)
    .set({ status: newStatus, updatedAt: sql`now()` })
    .where(eq(resources.id, id))
    .returning();

  return toResource(updated!);
}
