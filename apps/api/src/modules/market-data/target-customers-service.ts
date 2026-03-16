import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketTargetCustomers } from "../../db/schema/index.js";
import type { MarketTargetCustomerRecord, NewMarketTargetCustomerRecord } from "../../db/schema/index.js";

export async function listTargetCustomers(marketId: string) {
  return db.select().from(marketTargetCustomers)
    .where(eq(marketTargetCustomers.marketId, marketId))
    .orderBy(asc(marketTargetCustomers.sortOrder));
}

export async function createTargetCustomer(data: Omit<NewMarketTargetCustomerRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(marketTargetCustomers).values(data).returning();
  return record!;
}

export async function updateTargetCustomer(id: string, data: Partial<MarketTargetCustomerRecord>) {
  const [existing] = await db.select().from(marketTargetCustomers).where(eq(marketTargetCustomers.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Target customer not found" });
  const [updated] = await db.update(marketTargetCustomers)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketTargetCustomers.id, id))
    .returning();
  return updated!;
}

export async function deleteTargetCustomer(id: string) {
  const [existing] = await db.select().from(marketTargetCustomers).where(eq(marketTargetCustomers.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Target customer not found" });
  await db.delete(marketTargetCustomers).where(eq(marketTargetCustomers.id, id));
}
