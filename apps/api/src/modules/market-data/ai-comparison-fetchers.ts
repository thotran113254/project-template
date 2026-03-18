import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  markets,
  marketProperties,
  propertyRooms,
  roomPricing,
  pricingOptions,
} from "../../db/schema/index.js";
import {
  formatProperty,
  setPricingOptionLabels,
  setPricingOptionConfigs,
  formatPricingOptionDefinitions,
} from "./ai-context-format-helpers.js";
import { resolveMarket, fetchSinglePropertyWithRooms } from "./ai-data-fetchers.js";

/** Item to compare — market slug + property slug */
interface CompareItem {
  slug: string;
  propertySlug: string;
}

/** Pricing filters for comparison */
interface CompareFilters {
  comboType?: string;
  dayType?: string;
}

/** Compare 2-5 specific properties side-by-side with pricing.
 *  Single tool call handles the entire comparison — saves tool rounds. */
export async function fetchCompareProperties(
  items: CompareItem[],
  filters?: CompareFilters,
): Promise<string> {
  if (items.length === 0) return "(Không có cơ sở để so sánh)";
  if (items.length > 5) return "(Tối đa so sánh 5 cơ sở cùng lúc)";

  // Load pricing option labels
  const allPricingOptions = await db
    .select()
    .from(pricingOptions)
    .where(and(eq(pricingOptions.isActive, true), eq(pricingOptions.aiVisible, true)));
  setPricingOptionLabels(allPricingOptions);
  setPricingOptionConfigs(allPricingOptions);

  let text = formatPricingOptionDefinitions();
  text += `\n[SO SÁNH ${items.length} CƠ SỞ LƯU TRÚ]\n`;

  for (const item of items) {
    try {
      const market = await resolveMarket(item.slug);
      const result = await fetchSinglePropertyWithRooms(market.id, item.propertySlug, true);
      if (!result) {
        text += `\n❌ Không tìm thấy "${item.propertySlug}" trong ${market.name}\n`;
        continue;
      }

      // Apply pricing filters
      const filtered = {
        prop: result.prop,
        rooms: result.rooms
          .map(({ room, prices }) => ({
            room,
            prices: prices.filter((p) => {
              if (filters?.comboType && p.comboType !== filters.comboType) return false;
              if (filters?.dayType && p.dayType !== filters.dayType) return false;
              return true;
            }),
          })),
      };

      text += `\n--- ${market.name} ---\n`;
      text += formatProperty(filtered.prop, filtered.rooms, true);
    } catch (err) {
      text += `\n❌ Lỗi tra cứu "${item.slug}/${item.propertySlug}": ${err instanceof Error ? err.message : "unknown"}\n`;
    }
  }

  return text;
}

/** Search filters for cross-market property search */
interface SearchFilters {
  type?: string;
  starMin?: number;
  region?: string;
  capacity?: number;
}

/** Search properties across ALL active markets. Returns lightweight list.
 *  Useful for "tìm resort 4 sao trở lên", "homestay cho 4 người", etc. */
export async function fetchSearchProperties(
  filters?: SearchFilters,
): Promise<string> {
  // Fetch all active markets
  const activeMarkets = await db
    .select()
    .from(markets)
    .where(and(eq(markets.status, "active"), eq(markets.aiVisible, true)));

  if (activeMarkets.length === 0) return "(Chưa có thị trường nào trong hệ thống)";

  // Filter by region if specified
  const filteredMarkets = filters?.region
    ? activeMarkets.filter((m) => m.region?.toLowerCase() === filters.region?.toLowerCase())
    : activeMarkets;

  if (filteredMarkets.length === 0) return `(Không có thị trường nào thuộc vùng "${filters?.region}")`;

  type SearchResult = {
    marketName: string;
    marketSlug: string;
    propName: string;
    propSlug: string;
    type: string;
    starRating: string | null;
    roomCount: number;
    maxCapacity: number;
    minPrice: number | null;
  };

  const results: SearchResult[] = [];

  for (const market of filteredMarkets) {
    // Build property query conditions
    const conditions = [
      eq(marketProperties.marketId, market.id),
      eq(marketProperties.aiVisible, true),
      eq(marketProperties.status, "active"),
    ];

    let props = await db.select().from(marketProperties).where(and(...conditions));

    // Apply type filter
    if (filters?.type) {
      props = props.filter((p) => p.type === filters.type);
    }

    // Apply star rating filter
    if (filters?.starMin) {
      props = props.filter((p) => p.starRating && parseFloat(p.starRating) >= filters.starMin!);
    }

    for (const prop of props) {
      const rooms = await db
        .select()
        .from(propertyRooms)
        .where(and(eq(propertyRooms.propertyId, prop.id), eq(propertyRooms.aiVisible, true)));

      const maxCapacity = rooms.reduce((max, r) => Math.max(max, r.capacity), 0);

      // Apply capacity filter
      if (filters?.capacity && maxCapacity < filters.capacity) continue;

      // Get min price (optional, lightweight)
      let minPrice: number | null = null;
      for (const room of rooms) {
        const prices = await db
          .select({ price: roomPricing.price })
          .from(roomPricing)
          .where(and(eq(roomPricing.roomId, room.id), eq(roomPricing.aiVisible, true)));
        for (const p of prices) {
          if (minPrice === null || p.price < minPrice) minPrice = p.price;
        }
      }

      results.push({
        marketName: market.name,
        marketSlug: market.slug,
        propName: prop.name,
        propSlug: prop.slug,
        type: prop.type,
        starRating: prop.starRating,
        roomCount: rooms.length,
        maxCapacity,
        minPrice,
      });
    }
  }

  if (results.length === 0) {
    let desc = "Không tìm thấy cơ sở lưu trú";
    if (filters?.type) desc += ` loại ${filters.type}`;
    if (filters?.starMin) desc += ` từ ${filters.starMin}⭐`;
    if (filters?.capacity) desc += ` chứa ${filters.capacity} người`;
    return `(${desc})`;
  }

  // Sort by star rating desc, then min price asc
  results.sort((a, b) => {
    const starA = a.starRating ? parseFloat(a.starRating) : 0;
    const starB = b.starRating ? parseFloat(b.starRating) : 0;
    if (starB !== starA) return starB - starA;
    return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
  });

  let text = `[KẾT QUẢ TÌM KIẾM — ${results.length} cơ sở`;
  if (filters?.type) text += `, loại: ${filters.type}`;
  if (filters?.starMin) text += `, từ ${filters.starMin}⭐`;
  if (filters?.capacity) text += `, ≥${filters.capacity} người`;
  text += "]\n";

  for (const r of results) {
    const priceStr = r.minPrice ? ` | từ ${r.minPrice.toLocaleString("vi-VN")}₫` : "";
    text += `- ${r.propName} [${r.marketSlug}/${r.propSlug}] (${r.type}${r.starRating ? ` ⭐${r.starRating}` : ""}) — ${r.marketName}, ${r.roomCount} loại phòng, tối đa ${r.maxCapacity} người${priceStr}\n`;
  }

  text += `\n→ Dùng compareProperties để so sánh chi tiết 2-5 cơ sở cụ thể.\n`;
  text += `→ Dùng getPropertyDetails(marketSlug, propertySlug) để xem chi tiết 1 cơ sở.\n`;
  return text;
}
