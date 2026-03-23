import { eq, asc, and, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketKnowledgeUpdates } from "../../db/schema/index.js";
import type { MarketKnowledgeUpdateRecord, NewMarketKnowledgeUpdateRecord } from "../../db/schema/index.js";

export async function listKnowledgeUpdates(marketId: string, includeAll = false) {
  const conditions = includeAll
    ? eq(marketKnowledgeUpdates.marketId, marketId)
    : and(
        eq(marketKnowledgeUpdates.marketId, marketId),
        eq(marketKnowledgeUpdates.status, "approved"),
      );
  return db.select().from(marketKnowledgeUpdates)
    .where(conditions)
    .orderBy(asc(marketKnowledgeUpdates.sortOrder), asc(marketKnowledgeUpdates.createdAt));
}

export async function listByCreatedBy(marketId: string, userId: string) {
  return db.select().from(marketKnowledgeUpdates)
    .where(
      and(
        eq(marketKnowledgeUpdates.marketId, marketId),
        eq(marketKnowledgeUpdates.createdBy, userId),
      ),
    )
    .orderBy(asc(marketKnowledgeUpdates.createdAt));
}

export async function createKnowledgeUpdate(
  data: Omit<NewMarketKnowledgeUpdateRecord, "id" | "createdAt" | "updatedAt">,
) {
  const [record] = await db.insert(marketKnowledgeUpdates).values(data).returning();
  return record!;
}

export async function updateKnowledgeUpdate(
  id: string,
  data: Partial<MarketKnowledgeUpdateRecord>,
) {
  const [existing] = await db.select().from(marketKnowledgeUpdates)
    .where(eq(marketKnowledgeUpdates.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Knowledge update not found" });
  const [updated] = await db.update(marketKnowledgeUpdates)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketKnowledgeUpdates.id, id))
    .returning();
  return updated!;
}

export async function deleteKnowledgeUpdate(id: string) {
  const [existing] = await db.select().from(marketKnowledgeUpdates)
    .where(eq(marketKnowledgeUpdates.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Knowledge update not found" });
  await db.delete(marketKnowledgeUpdates).where(eq(marketKnowledgeUpdates.id, id));
}
