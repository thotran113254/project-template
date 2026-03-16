import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketDiningSpots } from "../../db/schema/index.js";
import type { MarketDiningSpotRecord, NewMarketDiningSpotRecord } from "../../db/schema/index.js";

export async function listDiningSpots(marketId: string) {
  return db.select().from(marketDiningSpots)
    .where(eq(marketDiningSpots.marketId, marketId))
    .orderBy(asc(marketDiningSpots.sortOrder));
}

export async function createDiningSpot(data: Omit<NewMarketDiningSpotRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketDiningSpots).values(data).returning();
  return record!;
}

export async function updateDiningSpot(id: string, data: Partial<MarketDiningSpotRecord>) {
  const [existing] = await db.select().from(marketDiningSpots).where(eq(marketDiningSpots.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Dining spot not found" });
  const [updated] = await db.update(marketDiningSpots)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketDiningSpots.id, id))
    .returning();
  return updated!;
}

export async function deleteDiningSpot(id: string) {
  const [existing] = await db.select().from(marketDiningSpots).where(eq(marketDiningSpots.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Dining spot not found" });
  await db.delete(marketDiningSpots).where(eq(marketDiningSpots.id, id));
}
