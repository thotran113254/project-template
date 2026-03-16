import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketInventoryStrategies } from "../../db/schema/index.js";
import type { MarketInventoryStrategyRecord, NewMarketInventoryStrategyRecord } from "../../db/schema/index.js";

export async function listInventoryStrategies(marketId: string) {
  return db.select().from(marketInventoryStrategies)
    .where(eq(marketInventoryStrategies.marketId, marketId))
    .orderBy(asc(marketInventoryStrategies.sortOrder));
}

export async function createInventoryStrategy(data: Omit<NewMarketInventoryStrategyRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketInventoryStrategies).values(data).returning();
  return record!;
}

export async function updateInventoryStrategy(id: string, data: Partial<MarketInventoryStrategyRecord>) {
  const [existing] = await db.select().from(marketInventoryStrategies).where(eq(marketInventoryStrategies.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Inventory strategy not found" });
  const [updated] = await db.update(marketInventoryStrategies)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketInventoryStrategies.id, id))
    .returning();
  return updated!;
}

export async function deleteInventoryStrategy(id: string) {
  const [existing] = await db.select().from(marketInventoryStrategies).where(eq(marketInventoryStrategies.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Inventory strategy not found" });
  await db.delete(marketInventoryStrategies).where(eq(marketInventoryStrategies.id, id));
}
