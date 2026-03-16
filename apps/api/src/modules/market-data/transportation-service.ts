import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketTransportation } from "../../db/schema/index.js";
import type { MarketTransportationRecord, NewMarketTransportationRecord } from "../../db/schema/index.js";

export async function listTransportation(marketId: string) {
  return db.select().from(marketTransportation)
    .where(eq(marketTransportation.marketId, marketId))
    .orderBy(asc(marketTransportation.sortOrder));
}

export async function createTransportation(data: Omit<NewMarketTransportationRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketTransportation).values(data).returning();
  return record!;
}

export async function updateTransportation(id: string, data: Partial<MarketTransportationRecord>) {
  const [existing] = await db.select().from(marketTransportation).where(eq(marketTransportation.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transportation not found" });
  const [updated] = await db.update(marketTransportation)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketTransportation.id, id))
    .returning();
  return updated!;
}

export async function deleteTransportation(id: string) {
  const [existing] = await db.select().from(marketTransportation).where(eq(marketTransportation.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transportation not found" });
  await db.delete(marketTransportation).where(eq(marketTransportation.id, id));
}
