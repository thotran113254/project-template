import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import {
  marketAttractions,
  marketDiningSpots,
  marketTransportation,
  marketCompetitors,
  marketCustomerJourneys,
  marketTargetCustomers,
  marketInventoryStrategies,
  pricingConfigs,
  pricingOptions,
} from "../../db/schema/index.js";
import {
  formatMarketHeader,
  formatProperties,
  formatPropertiesLightweight,
  formatProperty,
  formatTargetCustomers,
  formatAttractions,
  formatDining,
  formatTransportation,
  formatItineraries,
  formatCompetitors,
  formatInventoryStrategies,
  formatCustomerJourneys,
  formatPricingRules,
  setPricingOptionLabels,
  formatPricingOptionDefinitions,
  setPricingOptionConfigs,
} from "./ai-context-format-helpers.js";
import {
  resolveMarket,
  fetchPropertiesWithRooms,
  fetchPropertiesLightweight,
  fetchSinglePropertyWithRooms,
  fetchItinerariesWithItems,
  type PricingFilters,
  type ItineraryFilters,
} from "./ai-data-fetchers.js";

/** Fetch market overview: header + lightweight property list (no room details, no pricing).
 *  Use getPropertyDetails for full details of a specific property. */
export async function fetchMarketOverview(slug: string): Promise<string> {
  const market = await resolveMarket(slug);
  let text = formatMarketHeader(market);
  const props = await fetchPropertiesLightweight(market.id);
  text += formatPropertiesLightweight(props);
  return text;
}

/** Fetch full details of a single property: description, amenities, rooms (no pricing).
 *  Use getPropertyPricing for pricing of a specific property. */
export async function fetchPropertyDetails(slug: string, propertySlug: string): Promise<string> {
  const market = await resolveMarket(slug);
  const result = await fetchSinglePropertyWithRooms(market.id, propertySlug, false);
  if (!result) return `Không tìm thấy cơ sở lưu trú "${propertySlug}" trong thị trường ${market.name}.`;
  let text = `[CHI TIẾT CƠ SỞ LƯU TRÚ — ${market.name}]\n`;
  text += formatProperty(result.prop, result.rooms, false);
  text += `\n→ Dùng getPropertyPricing("${slug}", "${propertySlug}") để xem bảng giá.\n`;
  return text;
}

/** Fetch pricing with optional filters on propertySlug / comboType / dayType.
 *  When propertySlug is provided, returns pricing for that property only (most efficient). */
export async function fetchMarketPricing(
  slug: string,
  filters?: PricingFilters,
): Promise<string> {
  const market = await resolveMarket(slug);

  // Load pricing option labels + configs so formatters display correct names
  const allPricingOptions = await db
    .select()
    .from(pricingOptions)
    .where(and(eq(pricingOptions.isActive, true), eq(pricingOptions.aiVisible, true)));
  setPricingOptionLabels(allPricingOptions);
  setPricingOptionConfigs(allPricingOptions);

  // If propertySlug given → fetch only that property (token efficient)
  let propsWithRooms;
  if (filters?.propertySlug) {
    const single = await fetchSinglePropertyWithRooms(market.id, filters.propertySlug, true);
    propsWithRooms = single ? [single] : [];
  } else {
    propsWithRooms = await fetchPropertiesWithRooms(market.id, true);
  }

  // Apply combo / day type filters
  let filtered = propsWithRooms;
  if (filters?.comboType || filters?.dayType) {
    filtered = propsWithRooms
      .map(({ prop, rooms }) => ({
        prop,
        rooms: rooms
          .map(({ room, prices }) => ({
            room,
            prices: prices.filter((p) => {
              if (filters?.comboType && p.comboType !== filters.comboType) return false;
              if (filters?.dayType && p.dayType !== filters.dayType) return false;
              return true;
            }),
          }))
          .filter(({ prices }) => prices.length > 0),
      }))
      .filter(({ rooms }) => rooms.length > 0);
  }

  let text = formatPricingOptionDefinitions();
  text += formatProperties(filtered, true);

  const configs = await db
    .select()
    .from(pricingConfigs)
    .where(eq(pricingConfigs.aiVisible, true));
  text += formatPricingRules(configs, market.id);

  return text;
}

/** Fetch attractions, dining spots, and transportation for a market */
export async function fetchMarketAttractions(slug: string): Promise<string> {
  const market = await resolveMarket(slug);
  const [attrs, dining, transport] = await Promise.all([
    db
      .select()
      .from(marketAttractions)
      .where(
        and(eq(marketAttractions.marketId, market.id), eq(marketAttractions.aiVisible, true)),
      ),
    db
      .select()
      .from(marketDiningSpots)
      .where(
        and(eq(marketDiningSpots.marketId, market.id), eq(marketDiningSpots.aiVisible, true)),
      ),
    db
      .select()
      .from(marketTransportation)
      .where(
        and(eq(marketTransportation.marketId, market.id), eq(marketTransportation.aiVisible, true)),
      ),
  ]);
  return formatAttractions(attrs) + formatDining(dining) + formatTransportation(transport);
}

/** Fetch itinerary templates for a market with optional duration filter */
export async function fetchItineraryTemplates(
  slug: string,
  filters?: ItineraryFilters,
): Promise<string> {
  const market = await resolveMarket(slug);
  const { templates, itemsByTemplate } = await fetchItinerariesWithItems(market.id);

  let filtered = templates;
  if (filters?.durationDays) {
    filtered = templates.filter((t) => t.durationDays === filters.durationDays);
  }

  return formatItineraries(filtered, itemsByTemplate);
}

/** Fetch business intelligence data: competitors, target customers, strategies, journeys */
export async function fetchMarketBusinessData(slug: string): Promise<string> {
  const market = await resolveMarket(slug);
  const [comps, targets, strategies, journeys] = await Promise.all([
    db
      .select()
      .from(marketCompetitors)
      .where(
        and(eq(marketCompetitors.marketId, market.id), eq(marketCompetitors.aiVisible, true)),
      ),
    db
      .select()
      .from(marketTargetCustomers)
      .where(
        and(eq(marketTargetCustomers.marketId, market.id), eq(marketTargetCustomers.aiVisible, true)),
      ),
    db
      .select()
      .from(marketInventoryStrategies)
      .where(
        and(eq(marketInventoryStrategies.marketId, market.id), eq(marketInventoryStrategies.aiVisible, true)),
      ),
    db
      .select()
      .from(marketCustomerJourneys)
      .where(
        and(eq(marketCustomerJourneys.marketId, market.id), eq(marketCustomerJourneys.aiVisible, true)),
      ),
  ]);
  return (
    formatCompetitors(comps) +
    formatTargetCustomers(targets) +
    formatInventoryStrategies(strategies) +
    formatCustomerJourneys(journeys)
  );
}
