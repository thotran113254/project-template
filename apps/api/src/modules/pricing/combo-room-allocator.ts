import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  marketProperties,
  propertyRooms,
  roomPricing,
} from "../../db/schema/index.js";
import type { ComboRoomAllocation } from "@app/shared";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RoomCandidate {
  room: { id: string; roomType: string; bookingCode: string | null; capacity: number };
  price: {
    price: number; discountPrice: number | null; standardGuests: number;
    underStandardPrice: number | null; extraAdultSurcharge: number | null;
    extraChildSurcharge: number | null;
  };
  propertyName: string;
}

// ─── Resolve candidates from DB ─────────────────────────────────────────────

export async function resolveRoomCandidates(
  marketId: string,
  propertySlug: string | undefined,
  comboType: string,
  dayType: string,
): Promise<RoomCandidate[]> {
  const props = await db
    .select()
    .from(marketProperties)
    .where(
      and(
        eq(marketProperties.marketId, marketId),
        ...(propertySlug ? [eq(marketProperties.slug, propertySlug)] : []),
      ),
    );

  const candidates: RoomCandidate[] = [];
  for (const prop of props) {
    const rooms = await db
      .select()
      .from(propertyRooms)
      .where(eq(propertyRooms.propertyId, prop.id));

    for (const room of rooms) {
      const [price] = await db
        .select()
        .from(roomPricing)
        .where(
          and(
            eq(roomPricing.roomId, room.id),
            eq(roomPricing.comboType, comboType),
            eq(roomPricing.dayType, dayType),
          ),
        )
        .limit(1);

      if (price) {
        candidates.push({ room, price, propertyName: prop.name });
      }
    }
  }

  return candidates.sort((a, b) => b.room.capacity - a.room.capacity);
}

// ─── Greedy room allocation ─────────────────────────────────────────────────

export function allocateRooms(
  candidates: RoomCandidate[],
  numPeople: number,
  isAdmin: boolean,
): ComboRoomAllocation[] {
  const allocations: ComboRoomAllocation[] = [];
  let remaining = numPeople;

  while (remaining > 0 && candidates.length > 0) {
    const best =
      candidates.find((c) => c.room.capacity <= remaining) ??
      candidates[0]!;

    const guestsInRoom = Math.min(best.room.capacity, remaining);
    const p = best.price;

    let pricePerRoom: number;
    let discountPerRoom: number | null = null;

    if (guestsInRoom < p.standardGuests && p.underStandardPrice !== null) {
      pricePerRoom = p.underStandardPrice;
    } else {
      pricePerRoom = p.price;
      if (isAdmin && p.discountPrice !== null) discountPerRoom = p.discountPrice;
    }

    // Extra surcharges for guests beyond standard
    const extraGuests = Math.max(0, guestsInRoom - p.standardGuests);
    if (extraGuests > 0 && p.extraAdultSurcharge) {
      pricePerRoom += extraGuests * p.extraAdultSurcharge;
      if (discountPerRoom !== null) {
        discountPerRoom += extraGuests * p.extraAdultSurcharge;
      }
    }

    allocations.push({
      propertyName: best.propertyName,
      roomType: best.room.roomType,
      roomCode: best.room.bookingCode,
      quantity: 1,
      guestsPerRoom: guestsInRoom,
      pricePerRoom,
      discountPricePerRoom: isAdmin ? discountPerRoom : null,
      totalRoomCost: pricePerRoom,
      totalDiscountCost: isAdmin && discountPerRoom !== null ? discountPerRoom : null,
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
      existing.totalRoomCost += alloc.pricePerRoom;
      if (existing.totalDiscountCost !== null && alloc.discountPricePerRoom !== null) {
        existing.totalDiscountCost += alloc.discountPricePerRoom;
      }
    } else {
      merged.push({ ...alloc });
    }
  }

  return merged;
}
