import { eq, and } from "drizzle-orm";
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
  pricingConfigs,
  pricingOptions,
  knowledgeBase,
  aiDataSettings,
  marketKnowledgeUpdates,
  marketExperiences,
} from "../../db/schema/index.js";
import {
  fetchPropertiesWithRooms,
  fetchItinerariesWithItems,
} from "./ai-data-fetchers.js";
import {
  formatMarketHeader,
  formatProperties,
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

// Simple in-memory cache (5 min TTL)
let cachedContext: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Catalog cache (lightweight ~500-token summary for system prompts)
let cachedCatalog: string | null = null;
let catalogCachedAt = 0;

export function invalidateAiContextCache(): void {
  cachedContext = null;
  cachedCatalog = null;
  catalogCachedAt = 0;
}

async function getAiSettings(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(aiDataSettings);
  return Object.fromEntries(rows.map((r) => [r.dataCategory, r.isEnabled]));
}

async function buildMarketSection(
  market: typeof markets.$inferSelect,
  settings: Record<string, boolean>,
  allPricingConfigs: (typeof pricingConfigs.$inferSelect)[],
): Promise<string> {
  let text = formatMarketHeader(market);

  if (settings["property"]) {
    const propsWithRooms = await fetchPropertiesWithRooms(
      market.id,
      !!settings["pricing"],
    );
    text += formatProperties(propsWithRooms, !!settings["pricing"]);
  }

  if (settings["target_customer"]) {
    const targets = await db
      .select()
      .from(marketTargetCustomers)
      .where(
        and(
          eq(marketTargetCustomers.marketId, market.id),
          eq(marketTargetCustomers.aiVisible, true),
        ),
      );
    text += formatTargetCustomers(targets);
  }

  if (settings["attraction"]) {
    const attrs = await db
      .select()
      .from(marketAttractions)
      .where(
        and(
          eq(marketAttractions.marketId, market.id),
          eq(marketAttractions.aiVisible, true),
        ),
      );
    text += formatAttractions(attrs);
  }

  if (settings["dining"]) {
    const dining = await db
      .select()
      .from(marketDiningSpots)
      .where(
        and(
          eq(marketDiningSpots.marketId, market.id),
          eq(marketDiningSpots.aiVisible, true),
        ),
      );
    text += formatDining(dining);
  }

  if (settings["transportation"]) {
    const transport = await db
      .select()
      .from(marketTransportation)
      .where(
        and(
          eq(marketTransportation.marketId, market.id),
          eq(marketTransportation.aiVisible, true),
        ),
      );
    text += formatTransportation(transport);
  }

  if (settings["itinerary"]) {
    const { templates, itemsByTemplate } = await fetchItinerariesWithItems(
      market.id,
    );
    text += formatItineraries(templates, itemsByTemplate);
  }

  if (settings["competitor"]) {
    const comps = await db
      .select()
      .from(marketCompetitors)
      .where(
        and(
          eq(marketCompetitors.marketId, market.id),
          eq(marketCompetitors.aiVisible, true),
        ),
      );
    text += formatCompetitors(comps);
  }

  if (settings["inventory_strategy"]) {
    const strategies = await db
      .select()
      .from(marketInventoryStrategies)
      .where(
        and(
          eq(marketInventoryStrategies.marketId, market.id),
          eq(marketInventoryStrategies.aiVisible, true),
        ),
      );
    text += formatInventoryStrategies(strategies);
  }

  if (settings["journey"]) {
    const journeys = await db
      .select()
      .from(marketCustomerJourneys)
      .where(
        and(
          eq(marketCustomerJourneys.marketId, market.id),
          eq(marketCustomerJourneys.aiVisible, true),
        ),
      );
    text += formatCustomerJourneys(journeys);
  }

  if (settings["pricing"]) {
    text += formatPricingRules(allPricingConfigs, market.id);
  }

  // Knowledge updates (approved, aiVisible)
  const knowledge = await db
    .select()
    .from(marketKnowledgeUpdates)
    .where(
      and(
        eq(marketKnowledgeUpdates.marketId, market.id),
        eq(marketKnowledgeUpdates.status, "approved"),
        eq(marketKnowledgeUpdates.aiVisible, true),
      ),
    );
  if (knowledge.length > 0) {
    text += "\n[KIẾN THỨC THỊ TRƯỜNG]\n";
    for (const k of knowledge) {
      text += `- ${k.aspect}: ${k.knowledge}\n`;
    }
  }

  // Experiences (aiVisible)
  const experiences = await db
    .select()
    .from(marketExperiences)
    .where(
      and(
        eq(marketExperiences.marketId, market.id),
        eq(marketExperiences.aiVisible, true),
      ),
    );
  if (experiences.length > 0) {
    text += "\n[TRẢI NGHIỆM]\n";
    for (const e of experiences) {
      text += `- ${e.activityName}`;
      if (e.cost) text += ` (${e.cost})`;
      if (e.description) text += `: ${e.description}`;
      text += "\n";
    }
  }

  return text;
}

export async function buildAiContext(): Promise<string> {
  if (cachedContext && Date.now() - cachedAt < CACHE_TTL) {
    return cachedContext;
  }

  const [settings, activeMarkets, allPricingConfigs, allPricingOptions] = await Promise.all([
    getAiSettings(),
    db
      .select()
      .from(markets)
      .where(and(eq(markets.status, "active"), eq(markets.aiVisible, true))),
    db
      .select()
      .from(pricingConfigs)
      .where(eq(pricingConfigs.aiVisible, true)),
    db
      .select()
      .from(pricingOptions)
      .where(and(eq(pricingOptions.isActive, true), eq(pricingOptions.aiVisible, true))),
  ]);

  // Load dynamic labels and configs for combo/day types so formatters use admin-configured values
  setPricingOptionLabels(allPricingOptions);
  setPricingOptionConfigs(allPricingOptions);

  const sections: string[] = [];

  for (const market of activeMarkets) {
    if (!settings["market"]) continue;
    const section = await buildMarketSection(
      market,
      settings,
      allPricingConfigs,
    );
    sections.push(section);
  }

  // Add pricing option definitions so AI understands combo/day type mappings
  const optionDefs = formatPricingOptionDefinitions();
  if (optionDefs) sections.unshift(optionDefs);

  const result =
    sections.length > 0
      ? sections.join("\n\n")
      : "(Chưa có dữ liệu thị trường trong hệ thống)";

  cachedContext = result;
  cachedAt = Date.now();
  return result;
}

/** Build a lightweight catalog of active markets (with property counts by type) and published KB articles.
 *  Designed to scale — shows counts instead of listing all names. */
export async function buildCatalog(): Promise<string> {
  if (cachedCatalog && Date.now() - catalogCachedAt < CACHE_TTL) {
    return cachedCatalog;
  }

  const [activeMarkets, allProperties, kbArticles] = await Promise.all([
    db
      .select({ id: markets.id, name: markets.name, slug: markets.slug, highlights: markets.highlights })
      .from(markets)
      .where(and(eq(markets.status, "active"), eq(markets.aiVisible, true))),
    db
      .select({ marketId: marketProperties.marketId, type: marketProperties.type })
      .from(marketProperties)
      .where(and(eq(marketProperties.status, "active"), eq(marketProperties.aiVisible, true))),
    db
      .select({ title: knowledgeBase.title, category: knowledgeBase.category })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.status, "published")),
  ]);

  // Group property counts by type per market
  const propCountsByMarket = new Map<string, Record<string, number>>();
  for (const p of allProperties) {
    const counts = propCountsByMarket.get(p.marketId) ?? {};
    counts[p.type] = (counts[p.type] ?? 0) + 1;
    propCountsByMarket.set(p.marketId, counts);
  }

  let text = "[THỊ TRƯỜNG]\n";
  for (const m of activeMarkets) {
    const summary = m.highlights ? ` — ${m.highlights.slice(0, 80)}` : "";
    text += `- ${m.slug}: ${m.name}${summary}\n`;
    const counts = propCountsByMarket.get(m.id);
    if (counts) {
      const total = Object.values(counts).reduce((s, n) => s + n, 0);
      const breakdown = Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(", ");
      text += `  Lưu trú: ${total} cơ sở (${breakdown})\n`;
    }
  }
  text += "\n→ Gọi getMarketOverview(slug) để xem danh sách cơ sở cụ thể.\n";

  if (kbArticles.length > 0) {
    text += "\n[KNOWLEDGE BASE]\n";
    for (const a of kbArticles) {
      text += `- [${a.category}] ${a.title}\n`;
    }
  }

  cachedCatalog = text;
  catalogCachedAt = Date.now();
  return text;
}
