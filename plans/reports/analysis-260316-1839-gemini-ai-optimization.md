# Gemini AI Agent - System Optimization Analysis

## Current Architecture Summary

```
User → SSE Stream → chat-routes.ts
  → prepareStreamContext() → save user msg + fetch ALL history + buildKbContext()
    → buildAiContext() → 20+ sequential DB queries → format ALL market data as text
    → getKbArticles() → fetch ALL published KB articles
  → generateChatResponseStream()
    → getOrCreateCache() → Gemini explicit cache (10min TTL, in-memory tracking)
    → stream response token-by-token
  → saveAssistantMessage() with metadata
```

**Model:** gemini-3-flash-preview | **Cache TTL:** 10min | **Thinking:** LOW

---

## Critical Issues When Data Grows

### Issue 1: FULL CONTEXT DUMP (Critical)

**Current:** `buildAiContext()` + `getKbArticles()` loads ALL data into a single text string sent to Gemini.

- Every market, property, room, pricing row, attraction, dining, transport, itinerary, competitor, strategy, journey + ALL published KB articles
- All concatenated into one massive context string
- No filtering based on user query relevance

**Impact at scale:**
| Scale | Est. Tokens | Est. Cost/Request | Gemini Limit |
|-------|-------------|-------------------|--------------|
| Current (~50 records) | ~5K-10K | $0.002 | OK |
| 500 records | ~50K-100K | $0.025 | OK |
| 5,000 records | ~500K-1M | $0.25 | Near limit |
| 50,000+ records | >1M | >$0.50 | **EXCEEDS context window** |

Gemini 3 Flash context: 1M tokens. System prompt + KB + history must all fit.

### Issue 2: N+1 QUERY PROBLEM (High)

**Current:** `fetchPropertiesWithRooms()` does:
1. Query properties per market (1 query)
2. Per property → query rooms (N queries)
3. Per room → query pricing (N×M queries)

`buildMarketSection()` also runs sequential queries per data type per market.

**Impact:** With 10 markets × 20 properties × 5 rooms = 1 + 10×20 + 10×20×5 = **1,201 queries per context build**

Currently cached for 5min in memory, but first request after invalidation is very slow.

### Issue 3: UNBOUNDED CONVERSATION HISTORY (High)

**Current:** `prepareStreamContext()` loads ALL messages from session — no limit.

```typescript
const historyRows = await db.select().from(chatMessages)
  .where(eq(chatMessages.sessionId, sessionId))
  .orderBy(asc(chatMessages.createdAt));  // ALL messages
```

**Impact:** Long conversations = huge token count. 50 exchanges ≈ 50K+ tokens in history alone, competing with KB context for the 1M window.

### Issue 4: SINGLE-PROCESS CACHE (Medium)

**Current:** Both `cachedContext` (ai-context-builder) and `activeCacheName` (gemini-service) are in-memory variables.

**Impact:**
- Multiple API instances → each has own cache → cache miss on every instance
- Process restart → cache lost → expensive rebuild
- No cache sharing between workers

### Issue 5: NO RELEVANCE FILTERING (Medium)

**Current:** AI gets ALL data regardless of what user asks.

If user asks "giá phòng Sa Pa cuối tuần" (Sa Pa weekend pricing), AI receives data for ALL markets, ALL competitors, ALL customer journeys, etc.

**Impact:** Wasted tokens, slower responses, potential confusion in answers.

### Issue 6: NO COST/USAGE CONTROLS (Low-Medium)

- No per-user token budget or daily limits
- No rate limiting specific to AI endpoints
- No alerts on abnormal spending
- Cost tracked per-message in metadata but not enforced

---

## Optimization Strategies

### Strategy 1: RAG (Retrieval Augmented Generation) — RECOMMENDED

Replace full context dump with query-relevant retrieval.

**Approach A: Keyword/Category-based RAG (Simple)**
- Parse user query → extract market names, categories, intent
- Only fetch relevant market data and KB articles
- Example: "giá phòng Sa Pa" → only fetch Sa Pa market + pricing data

**Implementation:**
```typescript
// New: query-aware context builder
async function buildRelevantContext(userQuery: string, settings: Record<string, boolean>) {
  // 1. Detect markets mentioned
  const mentionedMarkets = await detectMarkets(userQuery);
  // 2. Detect intent (pricing, itinerary, comparison, attraction)
  const intent = detectIntent(userQuery);
  // 3. Fetch only relevant data
  return buildContextForMarkets(mentionedMarkets, intent, settings);
}
```

**Approach B: Vector/Embedding RAG (Advanced)**
- Add pgvector extension to PostgreSQL
- Generate embeddings for KB articles, property descriptions, pricing summaries
- On each query → embed query → cosine similarity search → return top-K relevant chunks
- Integrates with Gemini Embedding API or use local embeddings

**Token savings: 70-90%** depending on data selectivity.

### Strategy 2: Fix N+1 Queries with JOINs

Replace sequential queries with joined queries:

```typescript
// Current: N+1
for (const prop of props) {
  const rooms = await db.select().from(propertyRooms).where(eq(propertyRooms.propertyId, prop.id));
  for (const room of rooms) {
    const prices = await db.select().from(roomPricing).where(eq(roomPricing.roomId, room.id));
  }
}

// Optimized: 1 query with JOINs
const result = await db
  .select()
  .from(marketProperties)
  .leftJoin(propertyRooms, eq(propertyRooms.propertyId, marketProperties.id))
  .leftJoin(roomPricing, eq(roomPricing.roomId, propertyRooms.id))
  .where(and(
    eq(marketProperties.marketId, marketId),
    eq(marketProperties.aiVisible, true),
  ));
```

**Query reduction: 1,201 → ~5-10 queries total**

### Strategy 3: Conversation History Management

**A. Sliding window** — keep last N message pairs:
```typescript
const MAX_HISTORY = 20; // last 10 exchanges
const history = historyRows.slice(-MAX_HISTORY);
```

**B. Summarization** — summarize older messages:
```typescript
if (history.length > MAX_HISTORY) {
  const oldMessages = history.slice(0, -MAX_HISTORY);
  const summary = await summarizeConversation(oldMessages);
  history = [{ role: 'user', content: `[Previous conversation summary]: ${summary}` }, ...history.slice(-MAX_HISTORY)];
}
```

**Token savings: 50-80%** on long conversations.

### Strategy 4: Redis-based Caching

Replace in-memory cache with Redis (already in stack):

```typescript
// AI context cache in Redis
const CACHE_KEY = 'ai:context:' + hash;
const cached = await redis.get(CACHE_KEY);
if (cached) return cached;

const context = await buildAiContext();
await redis.set(CACHE_KEY, context, 'EX', 300); // 5min TTL
return context;
```

**Benefits:**
- Shared across all API instances
- Survives process restarts
- Can store Gemini cache name too

### Strategy 5: Chunked/Tiered Context

Split context into tiers:

1. **Always include:** System instructions, pricing definitions, date context (~500 tokens)
2. **Include if relevant:** Market data for mentioned markets (~2K-10K tokens)
3. **Include on demand:** KB articles matching query (~1K-5K tokens)
4. **Exclude by default:** Competitors, customer journeys, inventory strategies

```typescript
const CONTEXT_TIERS = {
  always: ['pricing_definitions', 'system_instructions'],
  ifMentioned: ['property', 'pricing', 'attraction', 'dining'],
  onDemand: ['kb_articles'],
  excludeDefault: ['competitor', 'inventory_strategy', 'journey'],
};
```

### Strategy 6: Cost Controls

```typescript
// Per-user daily token budget
const DAILY_TOKEN_LIMIT = 500_000;
const DAILY_COST_LIMIT = 1.00; // USD

async function checkUserBudget(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const usage = await db.query(/* sum tokens from chat_messages where userId and date */);
  return usage.totalTokens < DAILY_TOKEN_LIMIT;
}
```

---

## Implementation Priority

| Priority | Strategy | Effort | Impact | When |
|----------|----------|--------|--------|------|
| **P0** | Fix N+1 queries (JOINs) | Low | High | Now |
| **P0** | Conversation history limit (sliding window) | Low | High | Now |
| **P1** | Keyword-based RAG (market detection + intent) | Medium | Very High | Next sprint |
| **P1** | Redis caching | Low | Medium | Next sprint |
| **P2** | Tiered context (always/relevant/on-demand) | Medium | High | After RAG |
| **P2** | Cost controls (daily budget) | Low | Medium | After RAG |
| **P3** | Vector RAG (pgvector + embeddings) | High | Very High | When >1000 KB articles |
| **P3** | Conversation summarization | Medium | Medium | When users report long chats |

---

## Quick Wins (Can Do Now)

### 1. Add history limit in `chat-service.ts`
```typescript
const MAX_HISTORY_MESSAGES = 30; // ~15 exchanges
const historyRows = await db.select().from(chatMessages)
  .where(eq(chatMessages.sessionId, sessionId))
  .orderBy(asc(chatMessages.createdAt));
const trimmedHistory = historyRows.slice(-MAX_HISTORY_MESSAGES);
```

### 2. Replace N+1 with JOINs in `ai-context-builder.ts`
Single query for properties+rooms+pricing per market instead of nested loops.

### 3. Add market detection for context filtering
Simple keyword matching: user says "Sa Pa" → only include Sa Pa market data.

### 4. Move context cache to Redis
Already have Redis in docker-compose — use it.

---

## Gemini Model Configuration Notes

**Current:** `gemini-3-flash-preview` with `ThinkingLevel.LOW`

**Recommendations:**
- `ThinkingLevel.LOW` is good for cost — keep it
- Consider `gemini-3-flash` (non-preview) when stable for production
- Cache TTL of 10min is reasonable; increase to 30min if data changes rarely
- Monitor `cachedContentTokenCount` ratio — aim for >80% cache hit rate

**Context Window Budget (1M tokens):**
```
System Instructions:   ~500 tokens (fixed)
Market Data Context:   ~5K-50K tokens (grows with data)
KB Articles:           ~2K-20K tokens (grows with data)
Conversation History:  ~1K-100K tokens (grows with conversation)
Reserved for Response:  ~8K tokens
═══════════════════════════════════════
Available:             ~820K-990K tokens
```

Keep total under 500K for optimal response quality (less noise).

---

## Unresolved Questions

1. What is current actual KB content size and market data size in production?
2. How frequently does market data change? (affects cache TTL optimization)
3. How many concurrent users expected? (affects Redis vs in-memory decision)
4. Is pgvector extension available in current PostgreSQL setup?
5. What's the acceptable response latency target? (affects RAG complexity)
