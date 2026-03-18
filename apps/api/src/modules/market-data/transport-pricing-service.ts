import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { transportPricing } from "../../db/schema/index.js";
import type { TransportPricingRecord, NewTransportPricingRecord } from "../../db/schema/index.js";

type CreateData = Omit<NewTransportPricingRecord, "id" | "providerId" | "createdAt" | "updatedAt">;

function stripDiscountForNonAdmin(rows: TransportPricingRecord[], role: string) {
  if (role === "admin") return rows;
  return rows.map((p) => ({
    ...p,
    onewayDiscountPrice: null,
    roundtripDiscountPrice: null,
  }));
}

export async function listPricingByProvider(providerId: string, userRole: string) {
  const rows = await db.select().from(transportPricing)
    .where(eq(transportPricing.providerId, providerId))
    .orderBy(asc(transportPricing.sortOrder));
  return stripDiscountForNonAdmin(rows, userRole);
}

export async function createPricing(data: { providerId: string } & CreateData) {
  const [record] = await db.insert(transportPricing).values(data).returning();
  return record!;
}

export async function updatePricing(id: string, data: Partial<TransportPricingRecord>) {
  const [existing] = await db.select().from(transportPricing)
    .where(eq(transportPricing.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transport pricing not found" });

  const [updated] = await db.update(transportPricing)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(transportPricing.id, id))
    .returning();
  return updated!;
}

export async function deletePricing(id: string) {
  const [existing] = await db.select().from(transportPricing)
    .where(eq(transportPricing.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Transport pricing not found" });
  await db.delete(transportPricing).where(eq(transportPricing.id, id));
}

export async function bulkUpsertPricing(
  providerId: string,
  items: Omit<NewTransportPricingRecord, "providerId">[],
) {
  if (items.length === 0) {
    await db.delete(transportPricing).where(eq(transportPricing.providerId, providerId));
    return [];
  }
  const rows = items.map((item) => ({ ...item, providerId }));
  const inserted = await db.insert(transportPricing)
    .values(rows)
    .onConflictDoUpdate({
      target: [transportPricing.providerId, transportPricing.vehicleClass, transportPricing.seatType],
      set: {
        capacityPerUnit: sql`excluded.capacity_per_unit`,
        onewayListedPrice: sql`excluded.oneway_listed_price`,
        onewayDiscountPrice: sql`excluded.oneway_discount_price`,
        roundtripListedPrice: sql`excluded.roundtrip_listed_price`,
        roundtripDiscountPrice: sql`excluded.roundtrip_discount_price`,
        childFreeUnder: sql`excluded.child_free_under`,
        childDiscountUnder: sql`excluded.child_discount_under`,
        childDiscountAmount: sql`excluded.child_discount_amount`,
        onboardServices: sql`excluded.onboard_services`,
        crossProvinceSurcharges: sql`excluded.cross_province_surcharges`,
        notes: sql`excluded.notes`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return inserted;
}
