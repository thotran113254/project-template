import { eq, and, or, lte, gte, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { pricingRules, hotelRooms } from "../../db/schema/index.js";
import type {
  PricingRule,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  PriceCalculation,
  CalculatePriceDto,
} from "@app/shared";

function toRule(row: typeof pricingRules.$inferSelect): PricingRule {
  return {
    id: row.id,
    hotelId: row.hotelId ?? null,
    name: row.name,
    seasonStart: row.seasonStart ? row.seasonStart.toISOString() : null,
    seasonEnd: row.seasonEnd ? row.seasonEnd.toISOString() : null,
    multiplier: row.multiplier ?? "1.00",
    minNights: row.minNights ?? 1,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRules(hotelId?: string): Promise<PricingRule[]> {
  const rows = hotelId
    ? await db
        .select()
        .from(pricingRules)
        .where(eq(pricingRules.hotelId, hotelId))
    : await db.select().from(pricingRules);

  return rows.map(toRule);
}

export async function getRuleById(id: string): Promise<PricingRule> {
  const [row] = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.id, id))
    .limit(1);

  if (!row) throw new HTTPException(404, { message: "Pricing rule not found" });
  return toRule(row);
}

export async function createRule(dto: CreatePricingRuleDto): Promise<PricingRule> {
  const [row] = await db
    .insert(pricingRules)
    .values({
      hotelId: dto.hotelId,
      name: dto.name,
      seasonStart: dto.seasonStart ? new Date(dto.seasonStart) : undefined,
      seasonEnd: dto.seasonEnd ? new Date(dto.seasonEnd) : undefined,
      multiplier: dto.multiplier?.toString() ?? "1.00",
      minNights: dto.minNights ?? 1,
      adminNotes: dto.adminNotes ?? "",
    })
    .returning();

  return toRule(row!);
}

export async function updateRule(
  id: string,
  dto: UpdatePricingRuleDto,
): Promise<PricingRule> {
  const [existing] = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.id, id))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "Pricing rule not found" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields: Record<string, any> = {};
  if (dto.hotelId !== undefined) updateFields.hotelId = dto.hotelId;
  if (dto.name !== undefined) updateFields.name = dto.name;
  if (dto.seasonStart !== undefined)
    updateFields.seasonStart = dto.seasonStart ? new Date(dto.seasonStart) : null;
  if (dto.seasonEnd !== undefined)
    updateFields.seasonEnd = dto.seasonEnd ? new Date(dto.seasonEnd) : null;
  if (dto.multiplier !== undefined)
    updateFields.multiplier = dto.multiplier.toString();
  if (dto.minNights !== undefined) updateFields.minNights = dto.minNights;
  if (dto.adminNotes !== undefined) updateFields.adminNotes = dto.adminNotes;

  const [updated] = await db
    .update(pricingRules)
    .set(updateFields)
    .where(eq(pricingRules.id, id))
    .returning();

  return toRule(updated!);
}

export async function deleteRule(id: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.id, id))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "Pricing rule not found" });

  await db.delete(pricingRules).where(eq(pricingRules.id, id));
}

export async function calculatePrice(
  dto: CalculatePriceDto,
): Promise<PriceCalculation> {
  const { hotelId, roomId, checkIn, checkOut, guests } = dto;

  const [room] = await db
    .select()
    .from(hotelRooms)
    .where(eq(hotelRooms.id, roomId))
    .limit(1);

  if (!room) throw new HTTPException(404, { message: "Room not found" });

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (nights <= 0)
    throw new HTTPException(400, { message: "Check-out must be after check-in" });

  // Find applicable rules: hotel-specific rules or global rules, within season dates
  const applicableRules = await db
    .select()
    .from(pricingRules)
    .where(
      and(
        or(eq(pricingRules.hotelId, hotelId), isNull(pricingRules.hotelId)),
        or(
          isNull(pricingRules.seasonStart),
          lte(pricingRules.seasonStart, checkOutDate),
        ),
        or(
          isNull(pricingRules.seasonEnd),
          gte(pricingRules.seasonEnd, checkInDate),
        ),
      ),
    );

  // Apply highest multiplier among matching rules
  let highestMultiplier = 1.0;
  for (const rule of applicableRules) {
    const m = parseFloat(rule.multiplier ?? "1.00");
    if (m > highestMultiplier) highestMultiplier = m;
  }

  const basePrice = room.pricePerNight;
  const totalPrice = Math.round(basePrice * highestMultiplier * nights);

  return {
    basePrice,
    multiplier: highestMultiplier,
    nights,
    guests,
    totalPrice,
    breakdown: [
      { label: `Base price (${nights} night${nights > 1 ? "s" : ""})`, amount: basePrice * nights },
      { label: "Pricing multiplier", amount: totalPrice - basePrice * nights },
    ],
  };
}
