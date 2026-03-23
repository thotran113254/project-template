# AI Chatbot System Architecture - Exploration Report

## Executive Summary

The project has a **full-featured AI chatbot system** (Gemini-powered) with **extensive pricing integration**. The chatbot is designed for **sales staff** (not customers) to quickly query market data, properties, and generate detailed pricing quotes. It includes sophisticated tool calling, skill-based processing, and streaming responses.

---

## 1. Backend Architecture

### Core Components

**A. Gemini Service** (`gemini-service.ts`)
- Uses Google Gemini API (native integration via `@google/genai` SDK)
- Supports model configuration from DB (admin-configurable)
- Two models used:
  - **Main**: `gemini-3-flash-preview` (powerful, expensive) for orchestration
  - **Cheap**: `gemini-2.5-flash-lite` (fast, cheap) for skill-based data processing
- **Token tracking**: Measures prompt, response, thinking, and cached tokens
- **Streaming**: Full SSE support for real-time token streaming to frontend

**B. Tool System** (`gemini-tool-definitions.ts` + `gemini-tool-handlers.ts`)
- **11 Tools** available for Gemini function calling:
  1. `getMarketOverview` - Market summary + property list
  2. `getPropertyDetails` - Detailed property info (no pricing)
  3. `getPropertyPricing` - Room pricing tables (with filters)
  4. `getMarketAttractions` - Attractions, dining, transport
  5. `getItineraryTemplates` - Pre-built trip plans
  6. `getMarketBusinessData` - Competitive data, policies, strategies
  7. `compareProperties` - Side-by-side property comparison
  8. `searchProperties` - Cross-market property search
  9. `searchKnowledgeBase` - FAQ/policy search
  10. `getTransportPricing` - Bus/ferry pricing tables
  11. **`calculateComboPrice`** - Full pricing quote calculation ⭐

**C. Tool Call Orchestration** (`gemini-service.ts:resolveToolCalls`)
- Executes tool calls in parallel
- Routes large data results through cheap model for **skill-based processing**
- Handles **multi-round tool calling**: model can call multiple tools, refine, call again
- Tracks tool call events sent to frontend (for transparency)

**D. Skills System** (`.../chat/skills/`)
- Lightweight prompt-based processors for tool results
- **Pricing Skill** (`pricing-search-skill.ts`):
  ```
  "Filter and summarize pricing tables by user request"
  - Identify requirements (room type, day type, combo type)
  - Keep only relevant rows, drop others
  - Top-3 sorting if asking for cheapest/most expensive
  - Preserves exact prices (no rounding)
  ```
- Other skills: KB search, business data, comparison formatting, overview, attractions, itinerary

---

## 2. Pricing Integration - EXTENSIVE

### A. calculateComboPrice Tool (Core Pricing Engine)

**Location**: `gemini-tool-definitions.ts:202-256`

**Parameters**:
- `marketSlug`, `propertySlug` (optional)
- `numAdults`, `numChildrenUnder10`, `numChildrenUnder5`
- `numNights` (1=2N1D, 2=3N2D)
- `dayTypes[]` (weekday, friday, saturday, sunday, holiday) - supports mixed days
- `transportClass` (cabin, limousine, sleeper)
- `ferryClass` (speed_boat, small_boat)
- `tripType` (roundtrip/oneway)
- `departureProvince` (for cross-province surcharges)

**Capabilities**:
- ✅ Multi-day with mixed day types (e.g., T5+T6+T7)
- ✅ Room allocation by capacity
- ✅ Child pricing logic (free <5yo, discount, adult price)
- ✅ Transport roundtrip/oneway detection
- ✅ Cross-province surcharges
- ✅ Profit margin application (admin-configurable per market)
- ✅ Admin sees cost-based pricing, users see listed prices

**Output Format** (from `ai-transport-fetchers.ts:fetchFormattedCombo`):
```
[BÁO GIÁ COMBO — 4 người, 2N1Đ]
Thị trường: da-nang | Cơ sở: resort-x | Loại ngày: weekend

PHÒNG:
  Deluxe (2ng): 1.500.000₫/phòng
  Standard (2ng): 1.000.000₫/phòng × 2 = 2.000.000₫
  Tổng phòng: 3.500.000₫

VẬN CHUYỂN:
  Xe khách (2 chiều, cabin): 500.000₫/ng
  Tàu/Ferry (speed boat): 300.000₫/ng
  Tổng vận chuyển: 1.600.000₫

CHI TIẾT GIÁ:
  Subtotal: 5.100.000₫
  Markup (20%): 1.020.000₫
  Giá bán: 6.120.000₫
  Giá/người: 1.530.000₫
```

### B. Backend Pricing Services

**Room Pricing** (`room-pricing-schema.ts`, `ai-data-fetchers.ts`)
- Stores pricing per room type, combo type (2N1D/3N2D/per_night), day type
- Admin-visible discount prices
- User-visible listed prices
- Queryable by market, property, combo type, day type

**Transport Pricing** (`transport-pricing-schema.ts`, `ai-transport-fetchers.ts`)
- Vehicle class (cabin, limousine, sleeper)
- Seat type
- One-way + roundtrip pricing
- Child policies (free under X, discount Y-Z, adult >Z)
- Cross-province surcharges

**Combo Calculator** (`combo-calculator-service.ts`)
- Smart room allocation by capacity
- Multi-day support with mixed day types
- Transport resolver (one-way vs roundtrip detection)
- Profit margin from `pricingConfigs` table
- Child policy application

**Pricing Configs** (`pricing-configs-schema.ts`)
- Profit margin (default % per market or global)
- Child pricing rules (free under X, discount Y-Z)
- Other rules configurable by admin

### C. How Chatbot Generates Quotes

**Flow**:
1. **User asks**: "Give me a quote for 4 adults, 2 kids, 2 nights at Da Nang, Friday+Saturday"
2. **Gemini analyzes** request → calls `calculateComboPrice` with:
   - marketSlug: "da-nang"
   - numAdults: 4, numChildrenUnder10: 2
   - numNights: 2 (for 3N2D)
   - dayTypes: ["friday", "saturday"]
3. **Tool handler** calls `fetchFormattedCombo()` → `calculateCombo()` service
4. **Service**:
   - Resolves market
   - Allocates rooms by capacity
   - Fetches transport pricing
   - Applies profit margin
   - Returns structured calculation
5. **AI formats** human-readable quote in Vietnamese
6. **Frontend** displays with token usage

---

## 3. Frontend Implementation

### Chat Page (`chat-page.tsx`)

**Features**:
- Session management (create, delete, list)
- Message history persistence
- SSE streaming with buffered rendering (50ms flush interval for smooth UI)
- Tool call visualization (shows which tools fired, their arguments)
- Token usage display (main model + cheap model costs)

**Hooks**:
- `useChatStream`: SSE streaming, tool call tracking, token usage calculation
- `useQuery`/`useMutation`: TanStack Query for sessions/messages
- `useAuth`: Permission checks

**Chat Components**:
- `ChatInput`: Text input with Enter-to-send
- `ChatMessageBubble`: Displays messages + streaming text
- `ChatSuggestionChips`: Quick-action prompts
- `ChatSessionSidebar`: Session list + delete
- `ChatTokenUsage`: Cost breakdown (input, output, cached, thinking, total USD)

### AI Settings Page (`ai-settings-page.tsx`)

**Admin Controls** (4 tabs):
1. **Data Settings**: Toggle which data categories visible to AI (market, competitor, pricing, etc.)
2. **Model Config**: Temperature, thinking level, max tool rounds, model selection
3. **System Prompts**: Edit system instructions, anti-hallucination rules, pricing guides
4. **Agent Skills**: Edit per-tool skill instructions (e.g., pricing filter rules)

---

## 4. System Prompts & Intelligence

### Main System Instructions (`gemini-utils.ts`)

Key directive:
```
"Bạn là AI trợ lý nội bộ cho nhân viên sale du lịch"
(You are an AI internal assistant for travel sales staff)

RULES:
1. ALWAYS call tool to fetch data BEFORE answering (no hallucination)
2. When quoting: format as table/list for easy copy-paste to customer
3. Suggest sample responses staff can send to customers
```

### Configurable Prompt Sections (DB)

- `prompt_role`: Staff assistant role definition
- `prompt_lookup_rules`: Tool call strategy
- `prompt_anti_hallucination`: Data validation rules
- `prompt_progressive_strategy`: Multi-tool orchestration
- `prompt_questioning`: Follow-up question patterns
- `prompt_price_guide`: Pricing format + markup rules
- `prompt_response_format`: Output structure

### Creativity Settings per Data Category

Admin can configure per-category:
- `strict`: Data only, no suggestions
- `enhanced`: DB + helpful tips
- `creative`: Full reasoning mode

---

## 5. Data Flow Diagram

```
User Question (Frontend)
    ↓
Chat Input → SSE POST /chat/sessions/{id}/stream
    ↓
Server: prepareStreamContext()
    ↓
generateChatResponseStream() [Gemini Main Model]
    ├─ Read system prompt from DB
    ├─ Include catalog (market data, pricing configs)
    └─ Multi-round tool calling loop:
        ├─ Round 1: Model analyzes, calls tools (e.g., calculateComboPrice)
        ├─ Tool Handler executes tool
        ├─ If result large → route through Cheap Model (skill processing)
        ├─ Add tool result to conversation
        ├─ Round 2+: Model refines if needed
        └─ No more tool calls → Stream final response
    ↓
SSE Stream (text chunks + tool calls + token usage)
    ↓
Frontend buffers + flushes at 50ms intervals
    ↓
UI renders streaming text + tool indicators + cost breakdown
```

---

## 6. Key Files Summary

### Backend Pricing
- `/apps/api/src/modules/pricing/combo-calculator-service.ts` - Core calculation
- `/apps/api/src/modules/pricing/combo-room-allocator.ts` - Room allocation
- `/apps/api/src/modules/pricing/combo-transport-resolver.ts` - Transport selection
- `/apps/api/src/modules/market-data/ai-transport-fetchers.ts` - Format combo quotes
- `/apps/api/src/db/schema/room-pricing-schema.ts` - Room pricing table
- `/apps/api/src/db/schema/transport-pricing-schema.ts` - Transport pricing table
- `/apps/api/src/db/schema/pricing-configs-schema.ts` - Profit margins, rules

### Backend Chat/AI
- `/apps/api/src/modules/chat/gemini-service.ts` - Main orchestration
- `/apps/api/src/modules/chat/gemini-tool-definitions.ts` - Tool declarations
- `/apps/api/src/modules/chat/gemini-tool-handlers.ts` - Tool execution
- `/apps/api/src/modules/chat/gemini-utils.ts` - System prompts, token usage
- `/apps/api/src/modules/chat/chat-service.ts` - Session/message persistence

### Frontend Chat
- `/apps/web/src/pages/chat-page.tsx` - Main chat UI
- `/apps/web/src/pages/ai-settings-page.tsx` - Admin settings
- `/apps/web/src/hooks/use-chat-stream.ts` - SSE streaming hook
- `/apps/web/src/components/chat/*` - Chat components

---

## 7. Pricing Capabilities Summary

✅ **Has pricing integration**: YES (comprehensive)
✅ **Tool for quotes**: `calculateComboPrice` (11th tool)
✅ **System prompts**: Yes, DB-configurable
✅ **Function definitions**: Yes, 11 tools with detailed parameters
✅ **Multi-day mixed pricing**: Yes (dayTypes array support)
✅ **Child pricing**: Yes (free, discount, adult tiers)
✅ **Cross-province surcharges**: Yes (transportProvince support)
✅ **Profit margin application**: Yes (per-market configurable)
✅ **Transport integration**: Yes (bus + ferry, one-way/roundtrip)
✅ **Admin vs user pricing**: Yes (discount cost for admin, listed for users)
✅ **Skill-based filtering**: Yes (pricing-search-skill for large result sets)

---

## Unresolved Questions

1. Are there any scheduled/batch pricing refresh mechanisms, or is all pricing real-time from DB?
2. Does the chatbot support seasonal pricing overrides beyond day-type classification?
3. Are there analytics/logging of which pricing quotes are requested most frequently?
4. Is there a cost cap or rate limiting for tool calls to avoid expensive Gemini calls?
5. How is pricing data synchronized with external booking systems or inventory?

