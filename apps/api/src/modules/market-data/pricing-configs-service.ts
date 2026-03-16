import { eq, and, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { pricingConfigs } from "../../db/schema/index.js";
import type { PricingConfigRecord, NewPricingConfigRecord } from "../../db/schema/index.js";

export async function listPricingConfigs(marketId?: string, propertyId?: string) {
  const conditions: SQL[] = [];
  if (marketId) conditions.push(eq(pricingConfigs.marketId, marketId));
  if (propertyId) conditions.push(eq(pricingConfigs.propertyId, propertyId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return where
    ? db.select().from(pricingConfigs).where(where)
    : db.select().from(pricingConfigs);
}

export async function createPricingConfig(data: Omit<NewPricingConfigRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(pricingConfigs).values(data).returning();
  return record!;
}

export async function updatePricingConfig(id: string, data: Partial<PricingConfigRecord>) {
  const [existing] = await db.select().from(pricingConfigs).where(eq(pricingConfigs.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Pricing config not found" });
  const [updated] = await db.update(pricingConfigs)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(pricingConfigs.id, id))
    .returning();
  return updated!;
}

export async function deletePricingConfig(id: string) {
  const [existing] = await db.select().from(pricingConfigs).where(eq(pricingConfigs.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Pricing config not found" });
  await db.delete(pricingConfigs).where(eq(pricingConfigs.id, id));
}
