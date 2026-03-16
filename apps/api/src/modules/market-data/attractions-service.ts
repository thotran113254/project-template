import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketAttractions } from "../../db/schema/index.js";
import type { MarketAttractionRecord, NewMarketAttractionRecord } from "../../db/schema/index.js";

export async function listAttractions(marketId: string) {
  return db.select().from(marketAttractions)
    .where(eq(marketAttractions.marketId, marketId))
    .orderBy(asc(marketAttractions.sortOrder));
}

export async function createAttraction(data: Omit<NewMarketAttractionRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketAttractions).values(data).returning();
  return record!;
}

export async function updateAttraction(id: string, data: Partial<MarketAttractionRecord>) {
  const [existing] = await db.select().from(marketAttractions).where(eq(marketAttractions.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Attraction not found" });
  const [updated] = await db.update(marketAttractions)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketAttractions.id, id))
    .returning();
  return updated!;
}

export async function deleteAttraction(id: string) {
  const [existing] = await db.select().from(marketAttractions).where(eq(marketAttractions.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Attraction not found" });
  await db.delete(marketAttractions).where(eq(marketAttractions.id, id));
}
