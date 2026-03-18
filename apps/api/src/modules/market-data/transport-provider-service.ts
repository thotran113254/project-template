import { eq, and, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { transportProviders } from "../../db/schema/index.js";
import type { TransportProviderRecord, NewTransportProviderRecord } from "../../db/schema/index.js";

export type CreateTransportProviderData = Omit<NewTransportProviderRecord, "id" | "marketId" | "createdAt" | "updatedAt">;

export async function listProviders(marketId: string, category?: "bus" | "ferry") {
  const conditions = [eq(transportProviders.marketId, marketId)];
  if (category) conditions.push(eq(transportProviders.transportCategory, category));

  return db.select().from(transportProviders)
    .where(and(...conditions))
    .orderBy(asc(transportProviders.sortOrder));
}

export async function getProviderById(id: string) {
  const [record] = await db.select().from(transportProviders)
    .where(eq(transportProviders.id, id)).limit(1);
  if (!record) throw new HTTPException(404, { message: "Transport provider not found" });
  return record;
}

export async function createProvider(data: { marketId: string } & CreateTransportProviderData) {
  const [record] = await db.insert(transportProviders).values(data).returning();
  return record!;
}

export async function updateProvider(id: string, data: Partial<TransportProviderRecord>) {
  const [existing] = await db.select().from(transportProviders)
    .where(eq(transportProviders.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transport provider not found" });

  const [updated] = await db.update(transportProviders)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(transportProviders.id, id))
    .returning();
  return updated!;
}

export async function deleteProvider(id: string) {
  const [existing] = await db.select().from(transportProviders)
    .where(eq(transportProviders.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transport provider not found" });
  await db.delete(transportProviders).where(eq(transportProviders.id, id));
}
