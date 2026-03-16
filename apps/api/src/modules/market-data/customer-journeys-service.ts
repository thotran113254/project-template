import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketCustomerJourneys } from "../../db/schema/index.js";
import type { MarketCustomerJourneyRecord, NewMarketCustomerJourneyRecord } from "../../db/schema/index.js";

export async function listCustomerJourneys(marketId: string) {
  return db.select().from(marketCustomerJourneys)
    .where(eq(marketCustomerJourneys.marketId, marketId))
    .orderBy(asc(marketCustomerJourneys.stageOrder));
}

export async function createCustomerJourney(data: Omit<NewMarketCustomerJourneyRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketCustomerJourneys).values(data).returning();
  return record!;
}

export async function updateCustomerJourney(id: string, data: Partial<MarketCustomerJourneyRecord>) {
  const [existing] = await db.select().from(marketCustomerJourneys).where(eq(marketCustomerJourneys.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Customer journey not found" });
  const [updated] = await db.update(marketCustomerJourneys)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketCustomerJourneys.id, id))
    .returning();
  return updated!;
}

export async function deleteCustomerJourney(id: string) {
  const [existing] = await db.select().from(marketCustomerJourneys).where(eq(marketCustomerJourneys.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Customer journey not found" });
  await db.delete(marketCustomerJourneys).where(eq(marketCustomerJourneys.id, id));
}
