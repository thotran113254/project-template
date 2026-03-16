import { eq, and, ilike, count, sql, desc, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import {
  marketProperties,
  propertyRooms,
  propertyEvaluations,
  evaluationCriteria,
  pricingConfigs,
} from "../../db/schema/index.js";
import type { MarketPropertyRecord, NewMarketPropertyRecord } from "../../db/schema/index.js";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string, marketId: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (attempt < 10) {
    const condition = excludeId
      ? sql`${marketProperties.slug} = ${slug} AND ${marketProperties.marketId} = ${marketId} AND ${marketProperties.id} != ${excludeId}`
      : and(eq(marketProperties.slug, slug), eq(marketProperties.marketId, marketId));
    const [existing] = await db.select({ id: marketProperties.id }).from(marketProperties).where(condition!).limit(1);
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

export async function listProperties(marketId: string, page: number, limit: number, type?: string, status?: string) {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(marketProperties.marketId, marketId)];
  if (type) conditions.push(ilike(marketProperties.type, type));
  if (status) conditions.push(eq(marketProperties.status, status));
  const where = and(...conditions);

  const [rows, [countResult]] = await Promise.all([
    db.select().from(marketProperties).where(where).orderBy(desc(marketProperties.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(marketProperties).where(where),
  ]);
  return {
    data: rows,
    meta: { page, limit, total: countResult!.total, totalPages: Math.ceil(countResult!.total / limit) },
  };
}

export async function getPropertyById(id: string) {
  const [property] = await db.select().from(marketProperties).where(eq(marketProperties.id, id)).limit(1);
  if (!property) throw new HTTPException(404, { message: "Property not found" });

  const [rooms, evaluations, pricing] = await Promise.all([
    db.select().from(propertyRooms).where(eq(propertyRooms.propertyId, id)),
    db.select({ evaluation: propertyEvaluations, criteria: evaluationCriteria })
      .from(propertyEvaluations)
      .leftJoin(evaluationCriteria, eq(propertyEvaluations.criteriaId, evaluationCriteria.id))
      .where(eq(propertyEvaluations.propertyId, id)),
    db.select().from(pricingConfigs).where(eq(pricingConfigs.propertyId, id)),
  ]);

  return { ...property, rooms, evaluations, pricing };
}

export async function createProperty(data: Omit<NewMarketPropertyRecord, "id" | "slug" | "createdAt" | "updatedAt">) {
  const slug = await generateUniqueSlug(data.name, data.marketId);
  const [record] = await db.insert(marketProperties).values({ ...data, slug }).returning();
  return record!;
}

export async function updateProperty(id: string, data: Partial<MarketPropertyRecord>) {
  const [existing] = await db.select().from(marketProperties).where(eq(marketProperties.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Property not found" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { ...data, updatedAt: sql`now()` };
  if (data.name) updates.slug = await generateUniqueSlug(data.name, existing.marketId, id);
  const [updated] = await db.update(marketProperties).set(updates).where(eq(marketProperties.id, id)).returning();
  return updated!;
}

export async function deleteProperty(id: string) {
  const [existing] = await db.select().from(marketProperties).where(eq(marketProperties.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Property not found" });
  await db.delete(marketProperties).where(eq(marketProperties.id, id));
}
