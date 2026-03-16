import { eq, ilike, count, sql, desc, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import {
  markets,
  marketCompetitors,
  marketCustomerJourneys,
  marketTargetCustomers,
  marketAttractions,
  marketDiningSpots,
  marketTransportation,
  marketInventoryStrategies,
  marketProperties,
  itineraryTemplates,
} from "../../db/schema/index.js";
import type { MarketRecord, NewMarketRecord } from "../../db/schema/index.js";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (attempt < 10) {
    const condition = excludeId
      ? sql`${markets.slug} = ${slug} AND ${markets.id} != ${excludeId}`
      : eq(markets.slug, slug);
    const [existing] = await db.select({ id: markets.id }).from(markets).where(condition).limit(1);
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

export async function listMarkets(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(markets.name, `%${search}%`));
  const where = conditions.length > 0 ? conditions[0] : undefined;

  const [rows, [countResult]] = await Promise.all([
    where
      ? db.select().from(markets).where(where).orderBy(desc(markets.createdAt)).limit(limit).offset(offset)
      : db.select().from(markets).orderBy(desc(markets.createdAt)).limit(limit).offset(offset),
    where
      ? db.select({ total: count() }).from(markets).where(where)
      : db.select({ total: count() }).from(markets),
  ]);
  return {
    data: rows,
    meta: { page, limit, total: countResult!.total, totalPages: Math.ceil(countResult!.total / limit) },
  };
}

export async function getMarketById(id: string) {
  const [market] = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  if (!market) throw new HTTPException(404, { message: "Market not found" });

  const [
    [competitorsCount],
    [journeysCount],
    [customersCount],
    [attractionsCount],
    [diningCount],
    [transportCount],
    [inventoryCount],
    [propertiesCount],
    [itinerariesCount],
  ] = await Promise.all([
    db.select({ total: count() }).from(marketCompetitors).where(eq(marketCompetitors.marketId, id)),
    db.select({ total: count() }).from(marketCustomerJourneys).where(eq(marketCustomerJourneys.marketId, id)),
    db.select({ total: count() }).from(marketTargetCustomers).where(eq(marketTargetCustomers.marketId, id)),
    db.select({ total: count() }).from(marketAttractions).where(eq(marketAttractions.marketId, id)),
    db.select({ total: count() }).from(marketDiningSpots).where(eq(marketDiningSpots.marketId, id)),
    db.select({ total: count() }).from(marketTransportation).where(eq(marketTransportation.marketId, id)),
    db.select({ total: count() }).from(marketInventoryStrategies).where(eq(marketInventoryStrategies.marketId, id)),
    db.select({ total: count() }).from(marketProperties).where(eq(marketProperties.marketId, id)),
    db.select({ total: count() }).from(itineraryTemplates).where(eq(itineraryTemplates.marketId, id)),
  ]);

  return {
    ...market,
    counts: {
      competitors: competitorsCount!.total,
      customerJourneys: journeysCount!.total,
      targetCustomers: customersCount!.total,
      attractions: attractionsCount!.total,
      diningSpots: diningCount!.total,
      transportation: transportCount!.total,
      inventoryStrategies: inventoryCount!.total,
      properties: propertiesCount!.total,
      itineraries: itinerariesCount!.total,
    },
  };
}

export async function createMarket(data: Omit<NewMarketRecord, "id" | "slug" | "createdAt" | "updatedAt">) {
  const slug = await generateUniqueSlug(data.name);
  const [market] = await db.insert(markets).values({ ...data, slug }).returning();
  return market!;
}

export async function updateMarket(id: string, data: Partial<MarketRecord>) {
  const [existing] = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Market not found" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { ...data, updatedAt: sql`now()` };
  if (data.name) updates.slug = await generateUniqueSlug(data.name, id);
  const [updated] = await db.update(markets).set(updates).where(eq(markets.id, id)).returning();
  return updated!;
}

export async function deleteMarket(id: string) {
  const [existing] = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Market not found" });
  await db.delete(markets).where(eq(markets.id, id));
}
