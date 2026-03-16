import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketCompetitors } from "../../db/schema/index.js";
import type { MarketCompetitorRecord, NewMarketCompetitorRecord } from "../../db/schema/index.js";

export async function listCompetitors(marketId: string) {
  return db.select().from(marketCompetitors)
    .where(eq(marketCompetitors.marketId, marketId))
    .orderBy(asc(marketCompetitors.sortOrder));
}

export async function createCompetitor(data: Omit<NewMarketCompetitorRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketCompetitors).values(data).returning();
  return record!;
}

export async function updateCompetitor(id: string, data: Partial<MarketCompetitorRecord>) {
  const [existing] = await db.select().from(marketCompetitors).where(eq(marketCompetitors.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Competitor not found" });
  const [updated] = await db.update(marketCompetitors)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketCompetitors.id, id))
    .returning();
  return updated!;
}

export async function deleteCompetitor(id: string) {
  const [existing] = await db.select().from(marketCompetitors).where(eq(marketCompetitors.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Competitor not found" });
  await db.delete(marketCompetitors).where(eq(marketCompetitors.id, id));
}
