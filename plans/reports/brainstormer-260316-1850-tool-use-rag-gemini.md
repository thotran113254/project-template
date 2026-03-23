# Tool-Use RAG Architecture for Gemini AI Agent

## Problem Statement

The current AI Travel Assistant dumps ALL market data + ALL KB articles into Gemini's context on every request. This is:

- **Expensive**: Every message sends full context (~all markets, all properties, all pricing, all KB articles)
- **Non-scalable**: Adding more markets/data linearly increases cost per query
- **Wasteful**: A query about "Sa Pa pricing" still loads Phu Quoc, Ha Long, etc.
- **Stale-resistant but costly**: 5-min in-memory cache + 10-min Gemini context cache help, but the fundamental problem remains

### Current Flow (Measured from Code)
```
User query → prepareStreamContext()
  → buildKbContext()
    → buildAiContext()          ← fetches ALL markets, ALL properties, ALL rooms, ALL pricing...
      → for each market:
        → fetchPropertiesWithRooms()   ← N+1 queries per market
        → fetch attractions, dining, transport, itineraries, competitors...
    → getKbArticles()           ← ALL published KB articles
  → concatenate into one massive string
  → send as systemInstruction or cached content to Gemini
```

**Key files affected:**
- `apps/api/src/modules/chat/gemini-service.ts` — Gemini client, caching, streaming
- `apps/api/src/modules/chat/chat-service.ts` — context assembly, KB fetch
- `apps/api/src/modules/market-data/ai-context-builder.ts` — market data assembly
- `apps/api/src/modules/market-data/ai-context-format-helpers.ts` — text formatters

---

## Evaluated Approaches

### Approach A: Tool-Use RAG (Recommended)

Give Gemini tool definitions (function declarations) so it can fetch specific data on demand.

**Pros:**
- Dramatic cost reduction (only fetch what's needed per query)
- Scales with data volume — more markets = same base cost
- Natural fit for Gemini's native function calling (`@google/genai` v1.45+ supports it)
- Admin updates reflected immediately (tools query DB live)
- Existing format helpers can be reused inside tool handlers
- Multi-turn tool chaining supported natively by Gemini

**Cons:**
- Adds latency per tool call round-trip (~200-500ms per tool invocation)
- Gemini may occasionally call wrong tool or miss a needed call
- Streaming UX needs adjustment (tool calls happen before text generation)
- More complex error handling (tool failures, timeouts)
- Cannot use Gemini context caching for tool results (they vary per query)

### Approach B: Smart Context Pruning (Pre-filter)

Keep current architecture but use a lightweight NLP step to identify relevant market(s) from the query, then only load those markets' data.

**Pros:**
- Minimal code changes
- Keeps current caching strategy
- No tool-call latency

**Cons:**
- Still sends potentially large context for multi-market queries
- Requires keyword/entity extraction logic (fragile for Vietnamese text)
- KB articles hard to pre-filter without understanding query intent
- Doesn't scale well as data grows within a single market

### Approach C: Hybrid (Catalog + Selective Tool-Use)

Send a lightweight catalog in system prompt, let Gemini decide if it needs tools or can answer from catalog alone.

**Pros:**
- Best of both worlds: simple queries answered from catalog, complex ones use tools
- Catalog is small/cacheable, tools fetch fresh data only when needed
- Graceful degradation if tools fail

**Cons:**
- Slightly more complex than pure tool-use
- Risk of Gemini answering from stale catalog when it should use tools

---

## Recommended Solution: Approach A (Tool-Use RAG) with Lightweight Catalog

### Architecture Overview

```
User: "Giá phòng Sa Pa cuối tuần cho 2 người"

→ System prompt: rules + date + data catalog (small, ~500 tokens)
→ Gemini sees: available markets list, data categories, tool definitions
→ Gemini calls: getMarketPricing({ market: "sa-pa", dayType: "saturday" })
→ Backend executes query, returns formatted pricing text
→ Gemini generates response with accurate data
```

### 1. Data Catalog Design

The catalog goes into the system prompt. It must be small but informative enough for Gemini to know what tools to call.

```typescript
// Catalog structure (~200-500 tokens depending on market count)
interface DataCatalog {
  markets: Array<{
    slug: string;       // "sa-pa"
    name: string;       // "Sa Pa"
    region: string;     // "Tây Bắc"
    propertyCount: number;
  }>;
  kbCategories: string[];    // ["policy", "promotion", "guide", ...]
  dataTypes: string[];       // ["pricing", "attractions", "dining", ...]
}
```

**Build catalog query** (fast, cacheable for 1-2 minutes):
```sql
SELECT slug, name, region,
  (SELECT count(*) FROM market_properties mp
   WHERE mp.market_id = m.id AND mp.ai_visible = true) as property_count
FROM markets m
WHERE m.status = 'active' AND m.ai_visible = true;

SELECT DISTINCT category FROM knowledge_base WHERE status = 'published';
```

**Catalog format in system prompt** (compact):
```
## DỮ LIỆU KHẢ DỤNG
Thị trường: Sa Pa (Tây Bắc, 5 cơ sở), Phú Quốc (Nam, 3 cơ sở), Hạ Long (Đông Bắc, 4 cơ sở)
Dữ liệu: pricing, attractions, dining, transportation, itineraries, competitors, target_customers, inventory_strategies, customer_journeys
KB: policy, promotion, guide, faq

Dùng tools bên dưới để tra cứu dữ liệu chi tiết. KHÔNG đoán giá hoặc thông tin — luôn gọi tool.
```

### 2. Tool Definitions

Design principle: **medium granularity**. Not one tool per table (too many), not one mega-tool (defeats purpose). Group by query intent.

#### Tool 1: `getMarketOverview`
**When**: User asks about a market generally, or system needs basic info.
```typescript
{
  name: "getMarketOverview",
  description: "Lấy thông tin tổng quan thị trường: mô tả, mùa du lịch, tips, danh sách cơ sở lưu trú (không có giá). Dùng khi cần biết thị trường có gì.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: {
        type: Type.STRING,
        description: "Slug thị trường (vd: sa-pa, phu-quoc, ha-long)"
      }
    },
    required: ["marketSlug"]
  }
}
```
**Returns**: Market header + property list (names, types, star ratings, room types — NO pricing).

#### Tool 2: `getMarketPricing`
**When**: User asks about pricing, quotes, costs.
```typescript
{
  name: "getMarketPricing",
  description: "Tra bảng giá phòng theo thị trường. Trả về giá theo combo type, day type, phụ thu. Dùng khi khách hỏi giá, báo giá, so sánh giá.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: {
        type: Type.STRING,
        description: "Slug thị trường"
      },
      propertyName: {
        type: Type.STRING,
        description: "Tên cơ sở lưu trú cụ thể (optional, nếu không truyền → trả tất cả)"
      },
      comboType: {
        type: Type.STRING,
        description: "Loại combo: 2n1d, 3n2d, per_night (optional)"
      },
      dayType: {
        type: Type.STRING,
        description: "Loại ngày: weekday, friday, saturday, sunday, holiday (optional)"
      }
    },
    required: ["marketSlug"]
  }
}
```
**Returns**: Pricing definitions + filtered pricing data + pricing rules for that market.

#### Tool 3: `getMarketAttractions`
**When**: User asks about things to do, sightseeing, dining, transport.
```typescript
{
  name: "getMarketAttractions",
  description: "Lấy thông tin điểm du lịch, ẩm thực, phương tiện di chuyển của thị trường. Dùng khi khách hỏi về tham quan, ăn uống, di chuyển.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: { type: Type.STRING, description: "Slug thị trường" },
      categories: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Loại dữ liệu cần: attractions, dining, transportation (mặc định: tất cả)"
      }
    },
    required: ["marketSlug"]
  }
}
```

#### Tool 4: `getItineraryTemplates`
**When**: User asks for itinerary suggestions, trip planning.
```typescript
{
  name: "getItineraryTemplates",
  description: "Lấy lịch trình mẫu của thị trường. Dùng khi khách cần gợi ý lịch trình, plan trip.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: { type: Type.STRING, description: "Slug thị trường" },
      durationDays: {
        type: Type.NUMBER,
        description: "Số ngày (optional, filter theo số ngày)"
      }
    },
    required: ["marketSlug"]
  }
}
```

#### Tool 5: `getMarketBusinessData`
**When**: User (sales staff) asks about competitors, target customers, strategies.
```typescript
{
  name: "getMarketBusinessData",
  description: "Dữ liệu kinh doanh: đối thủ, khách hàng mục tiêu, hành trình khách hàng, chiến lược ôm quỹ phòng. Dùng khi cần phân tích thị trường.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: { type: Type.STRING, description: "Slug thị trường" },
      categories: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Loại: competitors, target_customers, customer_journeys, inventory_strategies"
      }
    },
    required: ["marketSlug"]
  }
}
```

#### Tool 6: `searchKnowledgeBase`
**When**: User asks about policies, promotions, FAQs, or anything not in market data.
```typescript
{
  name: "searchKnowledgeBase",
  description: "Tìm bài viết trong Knowledge Base. Dùng khi cần tra chính sách, khuyến mãi, hướng dẫn, FAQ.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Từ khóa tìm kiếm (tiếng Việt)"
      },
      category: {
        type: Type.STRING,
        description: "Category filter (optional)"
      }
    },
    required: ["query"]
  }
}
```
**Implementation**: Use PostgreSQL `ILIKE` on title+content (already exists in kb-service), or `ts_vector` for better Vietnamese search later.

### 3. Tool Handler Implementation

Each tool handler reuses existing Drizzle queries and format helpers.

```typescript
// New file: apps/api/src/modules/chat/gemini-tool-handlers.ts

import { db } from "../../db/connection.js";
import { eq, and, ilike, or } from "drizzle-orm";
import { markets, knowledgeBase, /* ... */ } from "../../db/schema/index.js";
import { formatMarketHeader, formatProperties, /* ... */ } from "../market-data/ai-context-format-helpers.js";

// Resolve market slug to ID (with fuzzy matching for Vietnamese)
async function resolveMarket(slugOrName: string) {
  // Try exact slug match first
  let [market] = await db.select().from(markets)
    .where(and(eq(markets.slug, slugOrName), eq(markets.status, "active")))
    .limit(1);
  
  if (!market) {
    // Fuzzy: try ILIKE on name
    [market] = await db.select().from(markets)
      .where(and(ilike(markets.name, `%${slugOrName}%`), eq(markets.status, "active")))
      .limit(1);
  }
  return market ?? null;
}

// Tool dispatcher
export async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "getMarketOverview": return handleGetMarketOverview(args);
    case "getMarketPricing": return handleGetMarketPricing(args);
    case "getMarketAttractions": return handleGetMarketAttractions(args);
    case "getItineraryTemplates": return handleGetItineraryTemplates(args);
    case "getMarketBusinessData": return handleGetMarketBusinessData(args);
    case "searchKnowledgeBase": return handleSearchKnowledgeBase(args);
    default: return `Tool "${name}" không tồn tại.`;
  }
}

// Each handler reuses existing format helpers
async function handleGetMarketPricing(args: Record<string, unknown>): Promise<string> {
  const market = await resolveMarket(args.marketSlug as string);
  if (!market) return "Không tìm thấy thị trường.";
  
  // Reuse fetchPropertiesWithRooms from ai-context-builder
  // Filter by propertyName, comboType, dayType if provided
  // Return formatted text using existing formatProperties() + formatPricingRules()
}
```

### 4. Gemini Service Changes

The key change is in `gemini-service.ts`: add tool definitions and implement the tool-call loop.

```typescript
// Modified gemini-service.ts

import { Type } from "@google/genai";
import { executeToolCall } from "./gemini-tool-handlers.js";

const TOOL_DECLARATIONS = [
  { /* getMarketOverview */ },
  { /* getMarketPricing */ },
  { /* getMarketAttractions */ },
  { /* getItineraryTemplates */ },
  { /* getMarketBusinessData */ },
  { /* searchKnowledgeBase */ },
];

// System prompt becomes MUCH smaller (no KB data, just rules + catalog)
const SYSTEM_INSTRUCTIONS = `
Bạn là AI Travel Assistant...
[same rules as before, minus the "KNOWLEDGE BASE" section]
[add instruction: "Luôn dùng tools để tra dữ liệu. KHÔNG đoán."]
`;

async function* generateChatResponseStream(
  messages: ChatMessage[],
  catalogContext: string,  // <-- was kbContext, now just catalog
  onUsage?: (usage: TokenUsage) => void,
): AsyncGenerator<string> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt(catalogContext);
  
  // Build contents from history
  const contents = messages.map(m => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }));
  
  // Tool-call loop (max 5 rounds to prevent infinite loops)
  const MAX_TOOL_ROUNDS = 5;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    
    if (response.functionCalls?.length) {
      // Execute tools in parallel
      const toolResults = await Promise.all(
        response.functionCalls.map(async (fc) => ({
          name: fc.name,
          result: await executeToolCall(fc.name, fc.args as Record<string, unknown>),
        }))
      );
      
      // Add model's function call to contents
      contents.push({
        role: "model",
        parts: response.functionCalls.map(fc => ({ functionCall: fc })),
      });
      
      // Add function responses
      contents.push({
        role: "user",
        parts: toolResults.map(tr => ({
          functionResponse: { name: tr.name, response: { result: tr.result } },
        })),
      });
      
      // Emit tool-call info to stream (optional, for UX)
      yield `\n`; // or emit a special marker for frontend
      continue;
    }
    
    // No more tool calls — stream the final text response
    // Re-call with streaming for the final response
    const streamResponse = await client.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    
    let lastChunk: unknown = null;
    for await (const chunk of streamResponse) {
      lastChunk = chunk;
      if (chunk.text) yield chunk.text;
    }
    if (lastChunk && onUsage) {
      const usage = extractUsage(lastChunk);
      if (usage) onUsage(usage);
    }
    return;
  }
  
  yield "(Đã vượt quá số lần tra cứu dữ liệu cho phép.)";
}
```

**Important implementation note**: The streaming approach above is simplified. In practice, you may want to use `generateContent` (non-streaming) for tool-call rounds, then `generateContentStream` only for the final text response. This avoids the complexity of parsing streamed function calls.

### 5. Context Builder Changes

Replace the heavy `buildAiContext()` with a lightweight `buildCatalog()`.

```typescript
// Modified: apps/api/src/modules/market-data/ai-context-builder.ts

// Keep existing functions as they become tool handler internals
// Add new catalog builder:

export async function buildCatalog(): Promise<string> {
  const [activeMarkets, kbCategories, settings] = await Promise.all([
    db.select({
      slug: markets.slug,
      name: markets.name,
      region: markets.region,
    }).from(markets)
      .where(and(eq(markets.status, "active"), eq(markets.aiVisible, true))),
    db.selectDistinct({ category: knowledgeBase.category })
      .from(knowledgeBase)
      .where(eq(knowledgeBase.status, "published")),
    getAiSettings(),
  ]);
  
  const marketList = activeMarkets
    .map(m => `${m.name} (slug: ${m.slug}, ${m.region ?? "N/A"})`)
    .join(", ");
  
  const kbCats = kbCategories.map(r => r.category).join(", ");
  
  const enabledData = Object.entries(settings)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");
  
  return [
    "## DỮ LIỆU KHẢ DỤNG",
    `Thị trường: ${marketList}`,
    `Loại dữ liệu: ${enabledData}`,
    kbCats ? `KB categories: ${kbCats}` : "",
    "",
    "Dùng tools để tra cứu chi tiết. KHÔNG đoán thông tin.",
  ].filter(Boolean).join("\n");
}
```

### 6. Chat Service Changes

Minimal change in `chat-service.ts`:

```typescript
// Replace buildKbContext() with:
async function buildCatalogContext(): Promise<string> {
  return buildCatalog(); // from ai-context-builder.ts
}

// In prepareStreamContext, replace:
// const kbContext = await buildKbContext();
// with:
// const kbContext = await buildCatalogContext();
```

### 7. Multi-turn Tool Call Handling

Gemini natively supports sequential (compositional) tool calling. Example flow:

```
User: "So sánh giá Sa Pa và Phú Quốc cuối tuần"

Round 1: Gemini calls getMarketPricing({ marketSlug: "sa-pa", dayType: "saturday" })
                   AND getMarketPricing({ marketSlug: "phu-quoc", dayType: "saturday" })
         (parallel calls — Gemini can emit multiple function calls per turn)
→ Backend executes both, returns results
→ Gemini synthesizes comparison response
```

```
User: "Gợi ý lịch trình 3 ngày Sa Pa, có kèm giá phòng"

Round 1: Gemini calls getItineraryTemplates({ marketSlug: "sa-pa", durationDays: 3 })
→ Backend returns itinerary templates
Round 2: Gemini calls getMarketPricing({ marketSlug: "sa-pa" })
→ Backend returns pricing
→ Gemini generates combined itinerary + pricing response
```

### 8. Fallback Strategy

1. **Tool returns empty**: Include instruction in system prompt: "Nếu tool trả về không có dữ liệu, nói rõ 'chưa có thông tin trong hệ thống'."
2. **Tool execution error**: Return error message as tool result; Gemini will communicate it naturally.
3. **Gemini doesn't call tools**: System prompt explicitly instructs to always use tools for data. Add `toolConfig.functionCallingConfig.mode: "AUTO"`.
4. **Max rounds exceeded**: Yield a graceful message (already handled in loop).
5. **Market not found**: `resolveMarket()` tries slug then fuzzy name match; returns clear error if none found.

### 9. Caching Strategy

| Layer | What | TTL | Why |
|-------|------|-----|-----|
| Catalog | Market list, KB categories | 2 min (in-memory) | Changes rarely, very small |
| AI Data Settings | Enabled categories | 2 min (in-memory) | Admin toggles are infrequent |
| Tool results | Not cached | N/A | Fresh data every call; queries are fast with indexes |
| Gemini context cache | System prompt + catalog | Can still use, but much smaller | Optional; savings smaller since prompt is already small |

**No Redis needed** for this. The existing in-memory cache pattern is sufficient since:
- Catalog is tiny (~200-500 tokens)
- Tool queries hit indexed DB tables (fast)
- Admin data freshness is guaranteed by not caching tool results

### 10. SSE Streaming UX Changes

The frontend needs to handle a new event type for tool-call status:

```typescript
// New SSE event: "tool-call"
// Sent before each tool execution round
{
  event: "tool-call",
  data: { tools: ["getMarketPricing"], round: 1, maxRounds: 5 }
}
```

Frontend can show: "Đang tra cứu bảng giá..." while tools execute.

The existing `ai-chunk` and `ai-complete` events remain unchanged.

---

## Cost Analysis

### Current Architecture (Full Context Dump)

Assumptions: 5 markets, ~30 properties, ~100 room pricing entries, ~20 KB articles

| Component | Est. Tokens |
|-----------|------------|
| System instructions | ~500 |
| Market data (all markets) | ~8,000-15,000 |
| KB articles (all published) | ~3,000-10,000 |
| **Total input per request** | **~12,000-25,000** |

With caching (50% discount on cached tokens):
- First request: ~$0.006-0.013 (input only)
- Cached requests: ~$0.003-0.006

### Tool-Use Architecture

| Component | Est. Tokens |
|-----------|------------|
| System instructions + catalog | ~800-1,200 |
| Tool call(s) result | ~500-3,000 per tool |
| Typical query (1-2 tools) | ~1,800-4,400 |
| **Total input per request** | **~1,800-4,400** |

Cost per request: ~$0.001-0.002 (input only)

### Savings

| Metric | Current | Tool-Use | Savings |
|--------|---------|----------|---------|
| Input tokens/request | 12-25K | 1.8-4.4K | **70-85%** |
| Cost/request (input) | $0.003-0.013 | $0.001-0.002 | **~75%** |
| Scales with data | Linearly worse | Constant base | Key advantage |

**Additional API calls**: Tool-use may require 2-3 `generateContent` calls per user message (tool rounds), but input tokens per call are dramatically lower. Net savings remain significant.

---

## Implementation Considerations & Risks

### Risks

1. **Latency increase**: Each tool round adds ~200-500ms. Mitigate: parallel tool execution, keep tool queries fast (indexed DB).
2. **Gemini hallucinating without calling tools**: Mitigate: strong system prompt instruction + testing; consider `mode: "ANY"` for first response to force tool use.
3. **Vietnamese text matching**: Market names like "Phú Quốc" vs "phu quoc" vs "Phu Quoc". Mitigate: slug-based matching + ILIKE fallback.
4. **Streaming complexity**: Tool-call loop must complete before text streaming starts. Frontend must handle "thinking/fetching" state.
5. **Gemini context cache becomes less useful**: System prompt is smaller, but also cheaper to send uncached. Net positive.

### Migration Strategy

1. **Phase 1**: Build tool handlers using existing format helpers (no DB changes needed)
2. **Phase 2**: Add catalog builder, tool definitions to gemini-service
3. **Phase 3**: Update SSE streaming to handle tool-call events
4. **Phase 4**: Update frontend to show tool-call status
5. **Phase 5**: Remove old `buildAiContext()` full-dump code

Can be done incrementally with a feature flag:
```typescript
const USE_TOOL_RAG = env.AI_USE_TOOL_RAG === "true";

// In prepareStreamContext:
const kbContext = USE_TOOL_RAG
  ? await buildCatalog()
  : await buildKbContext();
```

---

## Success Metrics

1. **Token usage**: Input tokens per request drops >60%
2. **Cost**: Per-request cost drops >50%
3. **Response quality**: Pricing accuracy maintained or improved (less noise in context)
4. **Latency**: Total response time within 1.5x of current (tool rounds add some latency)
5. **Admin freshness**: Data changes reflected immediately in tool responses
6. **Scalability**: Adding a new market adds ~20 tokens to catalog (vs ~2000+ tokens to full dump)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/chat/gemini-tool-definitions.ts` | **Create** | Tool declarations array |
| `apps/api/src/modules/chat/gemini-tool-handlers.ts` | **Create** | Tool execution logic |
| `apps/api/src/modules/chat/gemini-service.ts` | **Modify** | Add tool-call loop, use catalog |
| `apps/api/src/modules/chat/chat-service.ts` | **Modify** | Replace buildKbContext → buildCatalog |
| `apps/api/src/modules/market-data/ai-context-builder.ts` | **Modify** | Add buildCatalog(), keep existing functions for tool use |
| `apps/api/src/modules/chat/chat-routes.ts` | **Modify** | Add tool-call SSE event |
| `apps/web/src/hooks/use-chat-stream.ts` | **Modify** | Handle tool-call event |
| `apps/web/src/components/chat/` | **Modify** | Show tool-call status indicator |

---

## Unresolved Questions

1. **Tool granularity tradeoff**: Should `getMarketPricing` also include pricing rules/definitions, or separate tool? Leaning toward including them (fewer tool rounds).
2. **KB search quality**: Current `ILIKE` is basic. Is PostgreSQL `tsvector` needed for Vietnamese full-text search, or is ILIKE sufficient for the expected query patterns?
3. **Gemini context caching**: Worth keeping for system prompt + catalog (small), or just drop caching entirely since the prompt is now cheap?
4. **Chat history context**: Should conversation history be trimmed for long sessions, or is Gemini 3 Flash's context window large enough? (Currently sends all history.)
5. **Streaming tool calls**: Should we stream tool-call status events to frontend in real-time, or just show a generic "fetching data" indicator?
6. **AI Data Settings**: Should tool handlers respect `aiDataSettings` toggles per category? (Current code does this — tools should too.)
