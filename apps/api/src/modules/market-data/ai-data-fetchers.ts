import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  markets,
  marketProperties,
  propertyRooms,
  roomPricing,
  itineraryTemplates,
  itineraryTemplateItems,
} from "../../db/schema/index.js";
import type { RoomPricingRecord } from "../../db/schema/room-pricing-schema.js";
import type { PropertyRoomRecord } from "../../db/schema/property-rooms-schema.js";
import type { MarketPropertyRecord } from "../../db/schema/market-properties-schema.js";

// ─── Types for optional filters ──────────────────────────────────────────────

export interface PricingFilters {
  propertySlug?: string;
  comboType?: string;
  dayType?: string;
}

export interface ItineraryFilters {
  durationDays?: number;
  customerType?: string;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Resolve active+visible market by slug */
export async function resolveMarket(slug: string) {
  const [market] = await db
    .select()
    .from(markets)
    .where(
      and(
        eq(markets.slug, slug),
        eq(markets.status, "active"),
        eq(markets.aiVisible, true),
      ),
    )
    .limit(1);
  if (!market) throw new Error(`Không tìm thấy thị trường: ${slug}`);
  return market;
}

/** Fetch properties with their rooms (and optionally pricing) */
export async function fetchPropertiesWithRooms(
  marketId: string,
  includePricing: boolean,
): Promise<
  Array<{
    prop: MarketPropertyRecord;
    rooms: Array<{ room: PropertyRoomRecord; prices: RoomPricingRecord[] }>;
  }>
> {
  const props = await db
    .select()
    .from(marketProperties)
    .where(
      and(
        eq(marketProperties.marketId, marketId),
        eq(marketProperties.aiVisible, true),
      ),
    );

  const result = [];
  for (const prop of props) {
    const rooms = await db
      .select()
      .from(propertyRooms)
      .where(
        and(
          eq(propertyRooms.propertyId, prop.id),
          eq(propertyRooms.aiVisible, true),
        ),
      );

    const roomsWithPrices = await Promise.all(
      rooms.map(async (room) => {
        if (!includePricing) return { room, prices: [] };
        const prices = await db
          .select()
          .from(roomPricing)
          .where(
            and(
              eq(roomPricing.roomId, room.id),
              eq(roomPricing.aiVisible, true),
            ),
          );
        return { room, prices };
      }),
    );

    result.push({ prop, rooms: roomsWithPrices });
  }
  return result;
}

/** Fetch itinerary templates with their items grouped by template */
export async function fetchItinerariesWithItems(
  marketId: string,
): Promise<{
  templates: (typeof itineraryTemplates.$inferSelect)[];
  itemsByTemplate: Map<string, (typeof itineraryTemplateItems.$inferSelect)[]>;
}> {
  const templates = await db
    .select()
    .from(itineraryTemplates)
    .where(
      and(
        eq(itineraryTemplates.marketId, marketId),
        eq(itineraryTemplates.aiVisible, true),
      ),
    );

  const itemsByTemplate = new Map<
    string,
    (typeof itineraryTemplateItems.$inferSelect)[]
  >();
  await Promise.all(
    templates.map(async (tpl) => {
      const items = await db
        .select()
        .from(itineraryTemplateItems)
        .where(eq(itineraryTemplateItems.templateId, tpl.id));
      itemsByTemplate.set(tpl.id, items);
    }),
  );

  return { templates, itemsByTemplate };
}

// ─── Lightweight property list (no rooms, no pricing) ─────────────────────────

/** Fetch property summary list for a market — name, slug, type, stars, room count, max capacity */
export async function fetchPropertiesLightweight(
  marketId: string,
): Promise<Array<{ name: string; slug: string; type: string; starRating: string | null; roomCount: number; maxCapacity: number }>> {
  const props = await db
    .select()
    .from(marketProperties)
    .where(and(eq(marketProperties.marketId, marketId), eq(marketProperties.aiVisible, true)));

  const result = [];
  for (const prop of props) {
    const rooms = await db
      .select({ capacity: propertyRooms.capacity })
      .from(propertyRooms)
      .where(and(eq(propertyRooms.propertyId, prop.id), eq(propertyRooms.aiVisible, true)));
    result.push({
      name: prop.name,
      slug: prop.slug,
      type: prop.type,
      starRating: prop.starRating,
      roomCount: rooms.length,
      maxCapacity: rooms.reduce((max, r) => Math.max(max, r.capacity), 0),
    });
  }
  return result;
}

/** Fetch a single property with rooms (and optionally pricing) by slug within a market */
export async function fetchSinglePropertyWithRooms(
  marketId: string,
  propertySlug: string,
  includePricing: boolean,
): Promise<{
  prop: MarketPropertyRecord;
  rooms: Array<{ room: PropertyRoomRecord; prices: RoomPricingRecord[] }>;
} | null> {
  const [prop] = await db
    .select()
    .from(marketProperties)
    .where(
      and(
        eq(marketProperties.marketId, marketId),
        eq(marketProperties.slug, propertySlug),
        eq(marketProperties.aiVisible, true),
      ),
    )
    .limit(1);
  if (!prop) return null;

  const rooms = await db
    .select()
    .from(propertyRooms)
    .where(and(eq(propertyRooms.propertyId, prop.id), eq(propertyRooms.aiVisible, true)));

  const roomsWithPrices = await Promise.all(
    rooms.map(async (room) => {
      if (!includePricing) return { room, prices: [] as RoomPricingRecord[] };
      const prices = await db
        .select()
        .from(roomPricing)
        .where(and(eq(roomPricing.roomId, room.id), eq(roomPricing.aiVisible, true)));
      return { room, prices };
    }),
  );
  return { prop, rooms: roomsWithPrices };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  fetchMarketOverview,
  fetchMarketPricing,
  fetchMarketAttractions,
  fetchItineraryTemplates,
  fetchMarketBusinessData,
  fetchPropertyDetails,
} from "./ai-market-data-fetchers.js";

export { fetchKnowledgeBaseArticles } from "./ai-kb-fetchers.js";

export { fetchTransportPricing, fetchFormattedCombo } from "./ai-transport-fetchers.js";
