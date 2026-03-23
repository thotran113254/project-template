# Phase 1: Catalog Builder + Data Layer Functions

## Context Links
- Current: `apps/api/src/modules/market-data/ai-context-builder.ts` (306 lines — to add `buildCatalog()`)
- Format helpers: `apps/api/src/modules/market-data/ai-context-format-helpers.ts` (REUSE as-is)
- Markets schema: `apps/api/src/db/schema/markets-schema.ts` (has `slug` with unique index)
- KB schema: `apps/api/src/db/schema/knowledge-base-schema.ts`

## Overview
- Priority: P1 (blocking Phase 2 + 4)
- Status: pending
- Build a lightweight catalog (~500 tokens) for system prompt + individual data-fetch functions for tool handlers

## Key Insight
The catalog replaces the full context dump. It gives the main model just enough to decide WHICH tools to call:
- Market names + slugs + highlight summary
- KB article titles + categories
- No pricing, no rooms, no full descriptions

## Requirements

### `buildCatalog()` — new function in `ai-context-builder.ts`
Returns ~500 token string with:
```
[THỊ TRƯỜNG]
- da-nang: Đà Nẵng — Resort biển, Bà Nà Hills, ẩm thực miền Trung
- phu-quoc: Phú Quốc — Đảo ngọc, resort cao cấp, hải sản

[KNOWLEDGE BASE]
- [quy-trinh] Quy trình đặt phòng
- [chinh-sach] Chính sách hủy phòng
```

Query: single query per table (markets, knowledgeBase). Cache 5 min (reuse existing cache pattern).

### Data-fetch functions — new file `ai-data-fetchers.ts`
Six functions that return raw data strings. These are called by tool handlers in Phase 2.

| Function | DB Tables | Returns |
|----------|-----------|---------|
| `fetchMarketOverview(slug)` | markets, marketProperties, propertyRooms | Market info + property list (NO pricing) |
| `fetchMarketPricing(slug, filters?)` | markets, marketProperties, propertyRooms, roomPricing, pricingConfigs, pricingOptions | Room pricing, filtered by combo/day/property |
| `fetchMarketAttractions(slug)` | markets, marketAttractions, marketDiningSpots, marketTransportation | Attractions, dining, transport |
| `fetchItineraryTemplates(slug, filters?)` | markets, itineraryTemplates, itineraryTemplateItems | Itineraries, filtered by duration/customer type |
| `fetchMarketBusinessData(slug)` | markets, marketCompetitors, marketCustomerJourneys, marketTargetCustomers, marketInventoryStrategies | Competitors, customers, strategies |
| `fetchKnowledgeBaseArticles(query?)` | knowledgeBase | KB articles matching query (title/category ILIKE) |

### Filter types
```typescript
interface PricingFilters {
  propertySlug?: string;  // filter to specific property
  comboType?: string;     // "2n1d" | "3n2d" | "per_night"
  dayType?: string;       // "weekday" | "friday" | "saturday" | "sunday" | "holiday"
}

interface ItineraryFilters {
  durationDays?: number;
  customerType?: string;  // match against targetCustomer field
}
```

## Architecture

```
ai-context-builder.ts (MODIFY)
  + buildCatalog(): Promise<string>  — lightweight index
  (keep existing buildAiContext() for backward compat during transition, remove later)

ai-data-fetchers.ts (NEW ~180 lines)
  + fetchMarketOverview(slug): Promise<string>
  + fetchMarketPricing(slug, filters?): Promise<string>
  + fetchMarketAttractions(slug): Promise<string>
  + fetchItineraryTemplates(slug, filters?): Promise<string>
  + fetchMarketBusinessData(slug): Promise<string>
  + fetchKnowledgeBaseArticles(query?): Promise<string>
```

## Related Code Files

### Modify
- `apps/api/src/modules/market-data/ai-context-builder.ts` — add `buildCatalog()`

### Create
- `apps/api/src/modules/market-data/ai-data-fetchers.ts` — six data-fetch functions

### Reuse (DO NOT modify)
- `apps/api/src/modules/market-data/ai-context-format-helpers.ts` — all format* functions

## Implementation Steps

### 1. Add `buildCatalog()` to `ai-context-builder.ts`
```typescript
// At bottom of existing file
let cachedCatalog: string | null = null;
let catalogCachedAt = 0;

export async function buildCatalog(): Promise<string> {
  if (cachedCatalog && Date.now() - catalogCachedAt < CACHE_TTL) {
    return cachedCatalog;
  }

  const [activeMarkets, kbArticles] = await Promise.all([
    db.select({ name: markets.name, slug: markets.slug, highlights: markets.highlights })
      .from(markets)
      .where(and(eq(markets.status, "active"), eq(markets.aiVisible, true))),
    db.select({ title: knowledgeBase.title, category: knowledgeBase.category })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.status, "published")),
  ]);

  let text = "[THỊ TRƯỜNG]\n";
  for (const m of activeMarkets) {
    const summary = m.highlights ? ` — ${m.highlights.slice(0, 80)}` : "";
    text += `- ${m.slug}: ${m.name}${summary}\n`;
  }

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
```
Also update `invalidateAiContextCache()` to clear catalog cache.

### 2. Create `ai-data-fetchers.ts`
- Import DB tables + format helpers from existing files
- Each function: resolve market by slug → query specific tables → format with existing helpers → return string
- `fetchMarketPricing`: load pricingOptions first (call `setPricingOptionLabels`/`setPricingOptionConfigs`), then filter by combo/day/property
- `fetchKnowledgeBaseArticles`: ILIKE search on title + category + content, return top 5 matches
- Helper: `resolveMarketId(slug)` — shared lookup, throws if not found

### 3. Pattern for each fetcher
```typescript
async function resolveMarket(slug: string) {
  const [market] = await db.select().from(markets)
    .where(and(eq(markets.slug, slug), eq(markets.status, "active")))
    .limit(1);
  if (!market) throw new Error(`Market not found: ${slug}`);
  return market;
}

export async function fetchMarketOverview(slug: string): Promise<string> {
  const market = await resolveMarket(slug);
  let text = formatMarketHeader(market);
  // fetch properties WITHOUT pricing
  const propsWithRooms = await fetchPropertiesWithRooms(market.id, false);
  text += formatProperties(propsWithRooms, false);
  return text;
}
```

### 4. Reuse `fetchPropertiesWithRooms` and `fetchItinerariesWithItems`
These existing private functions in `ai-context-builder.ts` need to be exported or duplicated.
**Recommendation**: Extract them to `ai-data-fetchers.ts` and import back into `ai-context-builder.ts`. This avoids circular deps and keeps `ai-context-builder.ts` slimmer.

## Todo
- [ ] Add `buildCatalog()` to `ai-context-builder.ts`
- [ ] Update `invalidateAiContextCache()` to also clear catalog cache
- [ ] Create `ai-data-fetchers.ts` with 6 fetch functions
- [ ] Extract `fetchPropertiesWithRooms` + `fetchItinerariesWithItems` to `ai-data-fetchers.ts`
- [ ] Ensure `ai-context-builder.ts` imports from `ai-data-fetchers.ts` (no circular dep)
- [ ] Run `pnpm typecheck` to verify compilation

## Success Criteria
- `buildCatalog()` returns <600 tokens (~2KB text) for typical dataset
- Each fetcher returns formatted data for a single market/query
- `pnpm typecheck` passes
- Existing `buildAiContext()` still works (backward compat)

## Risk Assessment
- **Circular dependency**: If `ai-data-fetchers.ts` imports from `ai-context-builder.ts` and vice versa. Mitigation: move shared DB queries to `ai-data-fetchers.ts`, have `ai-context-builder.ts` import from it.
- **Slug not found**: Fetchers must throw clear error so tool handler can return "market not found" to model.

## Security
- All queries filter by `aiVisible = true` and `status = "active"/"published"` (existing pattern)
- KB search uses parameterized ILIKE, no SQL injection risk
