# Gemini AI Agent Integration - Comprehensive Exploration Report

## Executive Summary

This codebase implements a full-stack Gemini AI integration for an AI Travel Assistant focused on Vietnamese hotels and tours. The system uses explicit context caching for KB data to reduce token costs by ~50%, SSE streaming for real-time responses, and comprehensive token usage tracking with cost estimation.

---

## 1. Gemini AI Configuration

### 1.1 API Configuration

**Package & Version:**
- `@google/genai@^1.45.0` (Google Generative AI SDK)
- Location: `/home/automation/project-template/apps/api/package.json`

**Environment Variables:**
- `GEMINI_API_KEY` (required) - API key for Gemini API authentication
- Configured in: `apps/api/src/env.ts`
- Optional env var with fallback to empty string

**API Key Loading:**
```typescript
// apps/api/src/env.ts (lines 44-45)
GEMINI_API_KEY: optionalEnv("GEMINI_API_KEY", ""),
```

### 1.2 Model & Parameters

**Active Model:** `gemini-3-flash-preview` (line 54 in gemini-service.ts)

**Client Initialization:**
```typescript
function getClient(): GoogleGenAI {
  if (!genai) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genai;
}
```

**Model Configuration Parameters:**
- Explicit context caching enabled with TTL: `600s` (10 minutes)
- Thinking mode: `ThinkingLevel.LOW`
- Uses chat-based API with streaming support
- Supports role-based message history ("user" / "model")

**Pricing (as of March 2026):**
- Input tokens: $0.50 per 1M tokens
- Output tokens: $3.00 per 1M tokens  
- Cached input tokens: $0.25 per 1M (50% discount)
- Thinking tokens: $3.00 per 1M tokens
- Defined in: `apps/api/src/modules/chat/chat-routes.ts` (lines 14-19)

---

## 2. Knowledge Base (KB) Data Structure

### 2.1 Database Schema

**Table: `knowledge_base`** (Primary KB table)
- Location: `apps/api/src/db/schema/knowledge-base-schema.ts`

**Columns:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, auto-generated |
| `title` | VARCHAR(500) | Article title |
| `content` | TEXT | Full article content |
| `category` | VARCHAR(100) | Category for organization |
| `tags` | JSONB | Array of tags for classification |
| `status` | VARCHAR(20) | "draft" or "published" (default: "draft") |
| `sourceUrl` | VARCHAR(1000) | Reference URL |
| `sourceType` | VARCHAR(50) | Source type (e.g., "google_sheets") |
| `createdBy` | UUID (FK) | References `users.id` |
| `createdAt` | TIMESTAMP | Creation timestamp |
| `updatedAt` | TIMESTAMP | Update timestamp |

**Indexes:**
- `knowledge_base_category_idx` on category
- `knowledge_base_status_idx` on status
- `knowledge_base_created_by_idx` on createdBy

### 2.2 KB Data Retrieval

**Published Articles Query:**
```typescript
// apps/api/src/modules/chat/chat-service.ts (lines 90-101)
async function getKbArticles(): Promise<string> {
  const articles = await db
    .select({ title: knowledgeBase.title, content: knowledgeBase.content, category: knowledgeBase.category })
    .from(knowledgeBase)
    .where(eq(knowledgeBase.status, "published"));

  if (articles.length === 0) return "";

  return articles
    .map((a) => `### [${a.category.toUpperCase()}] ${a.title}\n${a.content}`)
    .join("\n\n---\n\n");
}
```

**Format:** Markdown-style with category headers and title/content pairs

### 2.3 Market Data Integration

KB is combined with dynamic market data from multiple tables:
- **Market properties** (hotels/homestays with rooms)
- **Room pricing** (by combo type, day type, room type)
- **Target customers** (customer segments)
- **Attractions, dining, transportation**
- **Itinerary templates** with items
- **Competitor data** and inventory strategies

**Full Context Builder:** `apps/api/src/modules/market-data/ai-context-builder.ts`

---

## 3. Explicit Context Caching

### 3.1 Caching Architecture

**Purpose:** Reduce input token costs (~50% savings on cached tokens) by caching system instructions + KB context

**Cache TTL:** 10 minutes (600 seconds)
- Minimum token requirement: 1024 tokens (Gemini 3 Flash requirement)
- Cache automatically invalidated if KB content changes (hash-based)

**In-Memory Tracking:**
```typescript
let activeCacheName: string | null = null;        // Current cache ID
let activeCacheKbHash: string | null = null;      // KB content hash
let activeCacheExpiresAt = 0;                      // Expiration timestamp
```

### 3.2 Cache Creation & Reuse

**Hash Function:** Simple JavaScript hash for content change detection
```typescript
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}
```

**Cache Workflow:**
1. Check if existing cache is valid (same KB hash, not expired)
2. If valid, reuse it
3. If invalid, create new cache with Gemini API
4. Cache contains: system instructions + KB context as initial content

**Cache Creation Parameters:**
```typescript
const cache = await client.caches.create({
  model: MODEL,
  config: {
    contents: [{ role: "user", parts: [{ text: kbContext }] }],
    systemInstruction: systemPrompt,
    ttl: CACHE_TTL,
  },
});
```

### 3.3 Cache Invalidation

**Automatic Triggers:**
- KB data changes (detected via ai-context-builder)
- Time-based expiration (10 minutes)
- Manual invalidation function available

**Invalidation Function:**
```typescript
export function invalidateGeminiCache(): void {
  activeCacheName = null;
  activeCacheKbHash = null;
  activeCacheExpiresAt = 0;
}
```

---

## 4. Chat/Conversation Flow

### 4.1 Backend Routes

**Chat Routes Mounting:** `apps/api/src/modules/chat/chat-routes.ts`

| Route | Method | Description |
|-------|--------|-------------|
| `/chat/sessions` | GET | List all sessions for authenticated user |
| `/chat/sessions` | POST | Create new chat session |
| `/chat/sessions/:id` | DELETE | Delete a session |
| `/chat/sessions/:id/messages` | GET | Get all messages in session |
| `/chat/sessions/:id/messages` | POST | Send message (non-streaming fallback) |
| `/chat/sessions/:id/messages/stream` | POST | Send message with SSE streaming (preferred) |

**Authentication:** All routes require `authMiddleware` with JWT token

### 4.2 Session Management

**Database Tables:**

**`chat_sessions` table:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID (FK) | References `users.id` |
| `title` | VARCHAR(255) | Session title (default: "New Chat") |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Index:** `chat_sessions_user_id_idx` on userId

**`chat_messages` table:**
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `sessionId` | UUID (FK) | References `chat_sessions.id` |
| `role` | VARCHAR(20) | "user" or "assistant" |
| `content` | TEXT | Message text |
| `metadata` | JSONB | Metadata (token usage, turn info, costs) |
| `createdAt` | TIMESTAMP | Timestamp |

**Index:** `chat_messages_session_id_idx` on sessionId

### 4.3 Message Flow (Streaming)

**Step 1: Prepare Context**
```typescript
// Save user message + fetch history + build KB context
const { userMsg, history, kbContext } = await chatService.prepareStreamContext(
  sessionId, userId, content
);
```

**Step 2: Stream Response via SSE**
- Response sends 3 event types:
  1. `user-message` - User message confirmation
  2. `ai-chunk` - Text chunks as they arrive
  3. `ai-complete` - Final response with token usage & metadata

**Step 3: Save to Database**
- Assistant message saved with metadata after streaming completes
- Metadata includes: token usage, turn number, duration, caching info

**SSE Events Structure:**
```javascript
// User message
{ event: "user-message", data: { ChatMessage } }

// Text chunk
{ event: "ai-chunk", data: { text: "..." } }

// Complete response
{
  event: "ai-complete",
  data: {
    ...assistantMsg,
    tokenUsage: { promptTokens, responseTokens, thinkingTokens, cachedTokens, totalTokens },
    estimatedCost: { inputCost, cachedCost, outputCost, thinkingCost, totalCost },
    turn: number,
    durationMs: number,
    hasThinking: boolean,
    hasCachedContext: boolean
  }
}
```

### 4.4 Gemini Service Functions

**Non-Streaming (Fallback):**
```typescript
export async function generateChatResponse(
  messages: ChatMessage[],
  kbContext: string,
): Promise<string>
```

**Streaming (Preferred):**
```typescript
export async function* generateChatResponseStream(
  messages: ChatMessage[],
  kbContext: string,
  onUsage?: (usage: TokenUsage) => void,
): AsyncGenerator<string>
```

---

## 5. Token Usage Tracking

### 5.1 Token Metrics

**Interface: `TokenUsage`**
```typescript
interface TokenUsage {
  promptTokens: number;          // Input tokens (non-cached)
  responseTokens: number;        // Output tokens from AI
  thinkingTokens: number;        // Tokens used in thinking mode
  cachedTokens: number;          // Cached input tokens (from context cache)
  totalTokens: number;           // Sum of all tokens
}
```

### 5.2 Extraction from Gemini Response

Tokens extracted from final chunk's `usageMetadata`:
```typescript
function extractUsage(chunk: unknown): TokenUsage | null {
  const meta = (chunk as Record<string, unknown>)?.usageMetadata as GeminiUsageMeta | undefined;
  if (!meta) return null;
  return {
    promptTokens: meta.promptTokenCount ?? 0,
    responseTokens: meta.candidatesTokenCount ?? 0,
    thinkingTokens: meta.thoughtsTokenCount ?? 0,
    cachedTokens: meta.cachedContentTokenCount ?? 0,
    totalTokens: meta.totalTokenCount ?? 0,
  };
}
```

### 5.3 Cost Estimation

**Formula (from chat-routes.ts):**
```typescript
function estimateCost(usage: TokenUsage) {
  const regularInput = Math.max(0, usage.promptTokens - usage.cachedTokens);
  const inputCost = (regularInput / 1_000_000) * PRICING.inputPerMillion;
  const cachedCost = (usage.cachedTokens / 1_000_000) * PRICING.cachedInputPerMillion;
  const outputCost = (usage.responseTokens / 1_000_000) * PRICING.outputPerMillion;
  const thinkingCost = (usage.thinkingTokens / 1_000_000) * PRICING.thinkingPerMillion;
  const totalCost = inputCost + cachedCost + outputCost + thinkingCost;
  return { inputCost, cachedCost, outputCost, thinkingCost, totalCost };
}
```

**Pricing Constants:**
- Input: $0.50/1M
- Cached Input: $0.25/1M
- Output: $3.00/1M
- Thinking: $3.00/1M

### 5.4 Metadata Saved to Database

Per-message metadata in `chat_messages.metadata` (JSONB):
```typescript
{
  model: "gemini-3-flash-preview",
  turn: number,           // Conversation turn (1-based)
  durationMs: number,     // Processing time
  historyMessages: number, // Total messages in history
  hasThinking: boolean,   // Thinking mode used
  hasCachedContext: boolean, // Context cache used
  tokenUsage: TokenUsage, // Full breakdown
  estimatedCost: {        // Cost breakdown
    inputCost,
    cachedCost,
    outputCost,
    thinkingCost,
    totalCost
  }
}
```

---

## 6. Database Schema for AI-Related Tables

### 6.1 Core AI Tables

**1. `chat_sessions`**
- User's conversation sessions
- Links to users via userId FK
- Index on userId for fast lookup

**2. `chat_messages`**
- Messages within sessions (user + assistant)
- JSONB metadata for extensibility
- Index on sessionId for session message retrieval

**3. `knowledge_base`**
- KB articles (title, content, category, tags)
- Status: published/draft
- Indexed by category and status for quick filtering

**4. `ai_data_settings`**
- Global toggles for KB data categories visible to AI
- One row per data category (market, property, pricing, etc.)
- Updated via admin interface

### 6.2 Market Data Tables (AI Context)

Multiple tables feed into AI context builder:
- `markets` (active markets)
- `market_properties` (hotels/homestays with aiVisible flag)
- `property_rooms` (room types)
- `room_pricing` (pricing by combo/day type)
- `market_attractions`, `market_dining_spots`, `market_transportation`
- `itinerary_templates`, `itinerary_template_items`
- `market_competitors`, `market_inventory_strategies`
- `market_target_customers`, `market_customer_journeys`
- `pricing_configs`, `pricing_options` (combo & day type definitions)

**Key Pattern:** All market data tables have `aiVisible` boolean flag to control what's exposed to AI

---

## 7. Frontend Components for AI Chat

### 7.1 Main Chat Page

**File:** `apps/web/src/pages/chat-page.tsx`

**Features:**
- Session management (create, delete, select)
- Message list with auto-scroll (smart: only when user is near bottom)
- SSE streaming with real-time token usage display
- Pending user message shown immediately (optimistic UI)
- Suggestion chips for new sessions
- Sidebar toggle
- Loading indicator during streaming

**State Management:**
- React Query for sessions & messages
- useQueryClient for cache invalidation
- Custom useChatStream hook for streaming logic

### 7.2 Chat Stream Hook

**File:** `apps/web/src/hooks/use-chat-stream.ts`

**Key Features:**
- SSE stream parsing and handling
- Buffered flushing strategy (~20fps refresh rate)
- Captures token usage & cost from final SSE event
- Optimistic UI: shows user message immediately
- Handles stream cancellation via AbortController

**Interface:**
```typescript
interface TokenUsageInfo {
  tokenUsage: { promptTokens, responseTokens, thinkingTokens, cachedTokens, totalTokens };
  estimatedCost: { inputCost, cachedCost, outputCost, thinkingCost, totalCost };
  turn?: number;
  durationMs?: number;
  hasThinking?: boolean;
  hasCachedContext?: boolean;
}
```

### 7.3 Message Components

**ChatMessageBubble:**
- Renders user/assistant messages with avatars
- Markdown support for assistant messages (via MarkdownRenderer component)
- Time formatting in Vietnamese locale
- Different styling for user (gray) vs assistant (teal)

**ChatTokenUsage:**
- Displays processing metrics: turn, duration, thinking, caching
- Token breakdown: input (with cached count), output, thinking, total
- Cost in USD with color coding
- Icons for visual indication

**ChatInput:**
- Single-line text input with Send button
- Enter-to-send, Shift+Enter for new line (inherited from textarea)
- Auto-focus when enabled
- Disabled during streaming

**ChatSuggestionChips:**
- Quick-start suggestions for new sessions
- Suggested questions about hotels, tours, pricing

**ChatSessionSidebar:**
- Lists all user sessions
- New session button
- Delete session (with confirmation likely)
- Active session highlight

---

## 8. Configuration Files & Environment Variables

### 8.1 Environment Variables

**In `.env` (or .env.example):**

**Required:**
```
GEMINI_API_KEY=<your-api-key>
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

**Optional (with defaults):**
```
API_PORT=3001
API_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
NODE_ENV=development
```

### 8.2 API Client Configuration

**Frontend Base URL:**
- Configured via `VITE_API_URL` environment variable
- Defaults to `/api/v1` if not set
- Token stored in localStorage as `access_token`

### 8.3 Gemini Model Configuration

**Model:** `gemini-3-flash-preview`
- Located in `apps/api/src/modules/chat/gemini-service.ts` line 54
- Can be updated to use different Gemini models

**Cache TTL:** `600s` (10 minutes)
- Located in same file, line 55

---

## 9. System Instructions & Prompting

### 9.1 System Instructions

**Language:** Vietnamese (for travel assistant domain)
**Domain:** Travel advisory for Vietnam (hotels, tours, pricing)
**Role:** "AI Travel Assistant for Vietnamese sales staff"

**Key Rules in System Prompt:**
1. Base answers on real data from KB
2. Use pricing tables and apply rules (child discounts, surcharges)
3. Use itinerary templates, customize per customer
4. If data missing, clearly state it
5. Answer in Vietnamese, professional & friendly
6. Always specify combo type, day type, standard occupancy when quoting

**Dynamic Components:**
- Current date/time in Vietnam timezone (UTC+7)
- Market data (properties, pricing, attractions, etc.)
- KB articles categorized by topic
- Pricing configuration & rules

### 9.2 System Prompt Building

**Date Context Injection:**
```typescript
function buildDateContext(): string {
  // Returns: "Hôm nay: [date time] (day-abbrev)\nTimezone: Asia/Ho_Chi_Minh (UTC+7)"
  // Vietnamese day abbreviations: T2, T3, T4, T5, T6, T7, CN
}
```

**Final Prompt Structure:**
```
## NGÀY HIỆN TẠI
[Date/time in Vietnam timezone]

[SYSTEM_INSTRUCTIONS - 40+ lines of rules & guidelines]

## KNOWLEDGE BASE (Dữ liệu thực tế từ hệ thống)
[Market data + KB articles as formatted text]
```

---

## 10. Test & Integration

### 10.1 Test Script

**File:** `scripts/test-ai-chat.ts`

**Test Scenarios:**
1. Compare homestays (criteria evaluation)
2. Find specific room features (Sa Pa bathtubs)
3. Build custom itineraries (honeymoon Phu Quoc)
4. Suggest attractions & photo spots
5. Calculate pricing with variations (adults, children, dates, day types)
6. Surcharge queries (Halong -> Sa Pa)
7. Filter by budget
8. Multi-property combo pricing

**Usage:**
```bash
API_URL=http://localhost:3001/api/v1 pnpm exec tsx scripts/test-ai-chat.ts
```

**Flow:**
1. Admin login & sync KB from Google Sheets
2. User login
3. Create chat session
4. Run 8 test queries
5. Report pass/fail

---

## 11. Key Files Reference

### Backend (TypeScript/Hono)
- `/apps/api/src/modules/chat/gemini-service.ts` - Gemini API wrapper, caching logic
- `/apps/api/src/modules/chat/chat-service.ts` - Session/message management, context building
- `/apps/api/src/modules/chat/chat-routes.ts` - HTTP routes, SSE streaming, pricing
- `/apps/api/src/modules/market-data/ai-context-builder.ts` - Dynamic context from DB
- `/apps/api/src/db/schema/chat-*.ts` - DB schemas
- `/apps/api/src/db/schema/knowledge-base-schema.ts` - KB table

### Frontend (React 19)
- `/apps/web/src/pages/chat-page.tsx` - Main page
- `/apps/web/src/hooks/use-chat-stream.ts` - SSE streaming logic
- `/apps/web/src/components/chat/*.tsx` - UI components

### Configuration
- `/apps/api/src/env.ts` - Environment variables
- `/apps/api/package.json` - Dependencies (`@google/genai`)

---

## 12. Integration Points & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React 19)                                             │
├─────────────────────────────────────────────────────────────────┤
│ ChatPage → useChatStream → SSE fetch                            │
│   ↓ (listens to stream events)                                  │
│ ChatMessageBubble + ChatTokenUsage                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /chat/sessions/:id/messages/stream
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Backend (Hono + Node.js)                                        │
├─────────────────────────────────────────────────────────────────┤
│ chat-routes.ts (SSE handler)                                    │
│   ↓                                                             │
│ prepareStreamContext()                                          │
│   ├→ Save user message to DB                                   │
│   ├→ Fetch conversation history                                │
│   └→ buildKbContext() → ai-context-builder.ts                  │
│       ├→ Fetch market data (properties, pricing, etc)           │
│       └→ Fetch published KB articles                            │
│   ↓                                                             │
│ generateChatResponseStream()                                    │
│   ├→ getOrCreateCache() [context caching]                      │
│   ├→ createGeminiChat() [use cached or direct prompt]          │
│   └→ stream.sendMessageStream() [token-by-token]               │
│   ↓                                                             │
│ Send SSE events (user-message, ai-chunk, ai-complete)          │
│   ↓                                                             │
│ saveAssistantMessage() [save full response + metadata]          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Gemini AI API                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Model: gemini-3-flash-preview                                   │
│ Config: thinkingLevel=LOW, explicit context caching (600s TTL)  │
│ Returns: text chunks + final usageMetadata                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PostgreSQL Database                                             │
├─────────────────────────────────────────────────────────────────┤
│ Tables: chat_sessions, chat_messages, knowledge_base,           │
│         markets, market_properties, room_pricing, etc.          │
│         ai_data_settings (toggles for KB visibility)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Performance Optimizations

1. **Explicit Context Caching** - 50% savings on cached input tokens
2. **Buffered SSE Streaming** - 50ms flush interval (~20fps) for smooth UI
3. **Optimistic UI** - User message shown immediately before server confirmation
4. **Smart Auto-Scroll** - Only scrolls if user is near bottom (respects manual scrolling)
5. **In-Memory KB Context Cache** - 5-minute TTL reduces DB queries
6. **Selective KB Visibility** - Only published articles exposed to AI
7. **AI Visibility Flags** - Market data tables have `aiVisible` bool to reduce context size
8. **Hash-Based Cache Invalidation** - Detects KB changes without extra DB queries

---

## 14. Unresolved Questions

1. **KB Sync Source**: How is KB synced from Google Sheets? (endpoint: `/knowledge-base/sync` exists but implementation not shown)
2. **Markdown Rendering**: What markdown features are supported in MarkdownRenderer component?
3. **Pricing Algorithm**: Complete pricing calculation rules (combos, day types, surcharges) defined where?
4. **Error Recovery**: How are failed streaming requests handled on frontend?
5. **Rate Limiting**: Is rate limiting applied to AI endpoints specifically?
6. **Cache Performance**: What's actual token savings % in production (estimated 50%)?

