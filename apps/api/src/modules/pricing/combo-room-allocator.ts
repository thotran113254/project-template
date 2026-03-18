import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  marketProperties,
  propertyRooms,
  roomPricing,
} from "../../db/schema/index.js";
import type { ComboRoomAllocation } from "@app/shared";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RoomPriceData {
  price: number;
  discountPrice: number | null;
  standardGuests: number;
  underStandardPrice: number | null;
  extraAdultSurcharge: number | null;
  extraChildSurcharge: number | null;
}

/** Single-dayType candidate (backward compat) */
export interface RoomCandidate {
  room: { id: string; roomType: string; bookingCode: string | null; capacity: number };
  price: RoomPriceData;
  propertyName: string;
}

/** Multi-dayType candidate: prices keyed by dayType */
export interface RoomCandidateMultiDay {
  room: { id: string; roomType: string; bookingCode: string | null; capacity: number };
  prices: Map<string, RoomPriceData>;
  propertyName: string;
}

// ─── Single JOIN query for all dayTypes ─────────────────────────────────────

/**
 * Fetch room candidates for multiple dayTypes in one query (avoids N+1).
 * Uses "default" season filter. Returns candidates that have pricing for ALL
 * requested dayTypes (rooms missing any dayType are excluded).
 */
export async function resolveRoomCandidatesMultiDay(
  marketId: string,
  propertySlug: string | undefined,
  comboType: string,
  dayTypes: string[],
): Promise<RoomCandidateMultiDay[]> {
  const uniqueDayTypes = [...new Set(dayTypes)];

  // Single JOIN query for all dayTypes at once
  const rows = await db
    .select({
      propName: marketProperties.name,
      roomId: propertyRooms.id,
      roomType: propertyRooms.roomType,
      bookingCode: propertyRooms.bookingCode,
      capacity: propertyRooms.capacity,
      dayType: roomPricing.dayType,
      price: roomPricing.price,
      discountPrice: roomPricing.discountPrice,
      standardGuests: roomPricing.standardGuests,
      underStandardPrice: roomPricing.underStandardPrice,
      extraAdultSurcharge: roomPricing.extraAdultSurcharge,
      extraChildSurcharge: roomPricing.extraChildSurcharge,
    })
    .from(marketProperties)
    .innerJoin(propertyRooms, eq(propertyRooms.propertyId, marketProperties.id))
    .innerJoin(roomPricing, eq(roomPricing.roomId, propertyRooms.id))
    .where(
      and(
        eq(marketProperties.marketId, marketId),
        ...(propertySlug ? [eq(marketProperties.slug, propertySlug)] : []),
        eq(roomPricing.comboType, comboType),
        inArray(roomPricing.dayType, uniqueDayTypes),
        eq(roomPricing.seasonName, "default"),
      ),
    );

  // Group rows by roomId
  const roomMap = new Map<string, RoomCandidateMultiDay>();
  for (const row of rows) {
    if (!roomMap.has(row.roomId)) {
      roomMap.set(row.roomId, {
        room: {
          id: row.roomId,
          roomType: row.roomType,
          bookingCode: row.bookingCode,
          capacity: row.capacity ?? 2,
        },
        prices: new Map(),
        propertyName: row.propName,
      });
    }
    const candidate = roomMap.get(row.roomId)!;
    candidate.prices.set(row.dayType, {
      price: row.price,
      discountPrice: row.discountPrice ?? null,
      standardGuests: row.standardGuests,
      underStandardPrice: row.underStandardPrice ?? null,
      extraAdultSurcharge: row.extraAdultSurcharge ?? null,
      extraChildSurcharge: row.extraChildSurcharge ?? null,
    });
  }

  // Only keep candidates that have pricing for ALL unique dayTypes
  const candidates: RoomCandidateMultiDay[] = [];
  for (const candidate of roomMap.values()) {
    const hasAll = uniqueDayTypes.every((dt) => candidate.prices.has(dt));
    if (hasAll) candidates.push(candidate);
  }

  return candidates.sort((a, b) => b.room.capacity - a.room.capacity);
}

/** Legacy single-dayType resolve (backward compat) */
export async function resolveRoomCandidates(
  marketId: string,
  propertySlug: string | undefined,
  comboType: string,
  dayType: string,
): Promise<RoomCandidate[]> {
  const multiDay = await resolveRoomCandidatesMultiDay(
    marketId, propertySlug, comboType, [dayType],
  );
  return multiDay.map((c) => ({
    room: c.room,
    price: c.prices.get(dayType)!,
    propertyName: c.propertyName,
  }));
}

// ─── Greedy room allocation (multi-day) ─────────────────────────────────────

/**
 * Calculate price per room for one night given a dayType.
 */
function calcRoomNightCost(
  p: RoomPriceData,
  guestsInRoom: number,
  isAdmin: boolean,
): { price: number; discount: number | null } {
  let pricePerRoom: number;
  let discountPerRoom: number | null = null;

  if (guestsInRoom < p.standardGuests && p.underStandardPrice !== null) {
    pricePerRoom = p.underStandardPrice;
  } else {
    pricePerRoom = p.price;
    if (isAdmin && p.discountPrice !== null) discountPerRoom = p.discountPrice;
  }

  const extraGuests = Math.max(0, guestsInRoom - p.standardGuests);
  if (extraGuests > 0 && p.extraAdultSurcharge) {
    pricePerRoom += extraGuests * p.extraAdultSurcharge;
    if (discountPerRoom !== null) discountPerRoom += extraGuests * p.extraAdultSurcharge;
  }

  return { price: pricePerRoom, discount: discountPerRoom };
}

/**
 * Allocate rooms across multiple nights with potentially different dayTypes.
 * dayTypes: one entry per night (length === numNights).
 */
export function allocateRoomsMultiDay(
  candidates: RoomCandidateMultiDay[],
  numPeople: number,
  dayTypes: string[],
  isAdmin: boolean,
): ComboRoomAllocation[] {
  // Count nights per dayType
  const nightsPerDayType = new Map<string, number>();
  for (const dt of dayTypes) {
    nightsPerDayType.set(dt, (nightsPerDayType.get(dt) ?? 0) + 1);
  }

  const allocations: ComboRoomAllocation[] = [];
  let remaining = numPeople;
  const availableCandidates = [...candidates];

  while (remaining > 0 && availableCandidates.length > 0) {
    const best =
      availableCandidates.find((c) => c.room.capacity <= remaining) ??
      availableCandidates[0]!;

    const guestsInRoom = Math.min(best.room.capacity, remaining);

    // Sum room cost across all night types
    let totalRoomCost = 0;
    let totalDiscountCost: number | null = isAdmin ? 0 : null;

    for (const [dt, nights] of nightsPerDayType.entries()) {
      const p = best.prices.get(dt)!;
      const { price, discount } = calcRoomNightCost(p, guestsInRoom, isAdmin);
      totalRoomCost += price * nights;
      if (totalDiscountCost !== null) {
        totalDiscountCost += (discount ?? price) * nights;
      }
    }

    // Use first night's dayType for per-room display price
    const firstDt = dayTypes[0]!;
    const firstP = best.prices.get(firstDt)!;
    const { price: pricePerRoom, discount: discountPerRoom } = calcRoomNightCost(firstP, guestsInRoom, isAdmin);

    allocations.push({
      propertyName: best.propertyName,
      roomType: best.room.roomType,
      roomCode: best.room.bookingCode,
      quantity: 1,
      guestsPerRoom: guestsInRoom,
      pricePerRoom,
      discountPricePerRoom: isAdmin ? discountPerRoom : null,
      totalRoomCost,
      totalDiscountCost: isAdmin ? totalDiscountCost : null,
    });

    remaining -= guestsInRoom;
  }

  // Merge identical room allocations
  const merged: ComboRoomAllocation[] = [];
  for (const alloc of allocations) {
    const existing = merged.find(
      (m) =>
        m.roomType === alloc.roomType &&
        m.propertyName === alloc.propertyName &&
        m.pricePerRoom === alloc.pricePerRoom,
    );
    if (existing) {
      existing.quantity += 1;
      existing.totalRoomCost += alloc.totalRoomCost;
      if (existing.totalDiscountCost !== null && alloc.totalDiscountCost !== null) {
        existing.totalDiscountCost += alloc.totalDiscountCost;
      }
    } else {
      merged.push({ ...alloc });
    }
  }

  return merged;
}

/** Legacy single-dayType allocator (backward compat) */
export function allocateRooms(
  candidates: RoomCandidate[],
  numPeople: number,
  isAdmin: boolean,
): ComboRoomAllocation[] {
  // Convert to multi-day format and delegate
  const multiDayCandidates: RoomCandidateMultiDay[] = candidates.map((c) => ({
    room: c.room,
    prices: new Map([["_single", c.price]]),
    propertyName: c.propertyName,
  }));
  // Use allocateRoomsMultiDay with a single synthetic dayType
  return allocateRoomsMultiDay(multiDayCandidates, numPeople, ["_single"], isAdmin);
}
