# AI Chat Backend Exploration Report

## Overview
The AI chat backend uses Google Gemini 3.0 Flash Preview with a sophisticated context-building system that compiles market data, pricing information, and knowledge base articles into a comprehensive prompt.

---

## 1. System Architecture

### Main Components
1. **Chat Routes** (`chat-routes.ts`) - HTTP endpoints for chat sessions and messages
2. **Chat Service** (`chat-service.ts`) - Business logic orchestration
3. **Gemini Service** (`gemini-service.ts`) - Direct Gemini API integration
4. **AI Context Builder** (`ai-context-builder.ts`) - Market data compilation
5. **Format Helpers** (`ai-context-format-helpers.ts`) - Context formatting utilities

### Flow Diagram
```
User sends message
    ↓
Chat Route Handler
    ↓
Chat Service (sendMessage)
    ↓
Build KB Context:
  - buildAiContext() → Market data
  - getKbArticles() → Knowledge base
    ↓
Gemini Service (generateChatResponse)
    ↓
Gemini 3.0 Flash Preview API
    ↓
Response stored in DB & returned
```

---

## 2. How AI Context is Built

### Context Builder (`ai-context-builder.ts`)

**Function**: `buildAiContext()` (lines 253-301)
- Implements 5-minute in-memory caching
- Fetches AI settings to determine what data to include
- Builds market sections with conditional data inclusion

**Key Data Sources**:
1. **AI Settings** - Boolean toggles for each data category
2. **Active Markets** - Only markets with status="active" and aiVisible=true
3. **Pricing Configs** - All pricing rules with aiVisible=true
4. **Pricing Options** - Combo types and day types with isActive=true and aiVisible=true

**Data Categories Included** (if enabled in settings):
- `market` - Market headers, descriptions, highlights, season info, travel tips
- `property` - Properties (names, types, star ratings, addresses, locations)
- `target_customer` - Customer segments, age ranges, motivations, pain points
- `attraction` - Tourist attractions with popularity and experience value
- `dining` - Dining options with price ranges and features
- `transportation` - Transport routes, types, costs, durations
- `itinerary` - Template itineraries with daily breakdowns
- `competitor` - Competing businesses and their strategies
- `inventory_strategy` - Room holding strategies by season
- `journey` - Customer journey stages and pain points
- `pricing` - Pricing rules and configurations

### Property & Room Data (`ai-context-builder.ts`, lines 54-104)

**Function**: `fetchPropertiesWithRooms()`
- Fetches properties with aiVisible=true
- For each property, fetches rooms with aiVisible=true
- Conditionally includes pricing data based on settings

**Room Pricing Structure**:
```
Room Pricing includes:
- comboType (e.g., "combo_1day", "combo_2days")
- dayType (e.g., "weekday", "weekend", "holiday")
- seasonName (e.g., "peak", "low", "default")
- seasonStart/seasonEnd dates
- standardGuests (base occupancy)
- price (base price)
- pricePlus1 (extra person charge)
- priceMinus1 (reduced occupancy discount)
- extraNight (additional night rate)
```

### Pricing Option Definitions (`ai-context-format-helpers.ts`, lines 32-73)

**Function**: `formatPricingOptionDefinitions()`
- Loaded from `pricing_options` table with category='combo_type' or 'day_type'
- Creates mapping between option keys and human-readable labels
- Includes descriptions for each combo/day type
- Prepended to AI context so Gemini understands the pricing taxonomy

**Example Format in Context**:
```
[ĐỊNH NGHĨA GIÁ]
Loại combo:
  - combo_1day (1 Day Tour): 1-day tour package
  - combo_3days (3 Days & 2 Nights): Multi-day package
Loại ngày:
  - weekday (Weekday): Monday-Friday
  - weekend (Weekend): Saturday-Sunday
```

---

## 3. Current Date Handling

### Finding: NO Current Date Passed to AI
- Searched all chat module files for Date, date, getCurrentDate, today patterns
- Result: **ZERO explicit date passing**
- The system does NOT include the current date in the system prompt or context

### Date Usage in System:
- **Database timestamps** - Created/updated timestamps (not included in context)
- **Room Pricing Seasons** - Has seasonStart/seasonEnd fields but NOT passed as current date to AI
- **Pricing Rules** - Can have seasonStart/seasonEnd for seasonal multipliers (used in pricing service, not chat)
- **Booking Service** - Uses dates for calculation (check-in/check-out), not chat context

### Implication
The AI model must infer current date from conversation context. This could be problematic for:
- Seasonal pricing recommendations
- Time-sensitive suggestions (e.g., "book soon for peak season")
- Date-relative itinerary planning

---

## 4. How Pricing Data is Included in AI Context

### Source: Three Database Tables

#### A. Room Pricing (`room_pricing`)
- **Included if**: settings["pricing"] = true AND property aiVisible AND room aiVisible
- **Format** (`formatPriceRow()`, `formatRoom()`, `formatProperty()`):
```
Property Name (type, rating)
  Address: ...
  Location: ...
  - Room Type (capacity, booking code)
    Combo Type Label:
      Day Type Label: price₫ (standard_guests) | +1ng: price₫ | -1ng: price₫ | extra_night: price₫
      ...
```

#### B. Pricing Configs (`pricing_configs`)
- **Included if**: settings["pricing"] = true
- **Format** (`formatPricingRules()`, lines 253-267):
```
[QUY TẮC GIÁ]
- Rule Name (rule_type)
  Rule Description
```
- Filters to market-specific OR global rules (no marketId)

#### C. Pricing Options (`pricing_options`)
- **Prepended to context** before all market sections
- Contains combo_type and day_type definitions with labels and descriptions
- Allows AI to understand price quote format variations

### Complete Pricing Context Example
```
[ĐỊNH NGHĨA GIÁ]
Loại combo:
  - combo_1day (1 Day): Single-day tour
Loại ngày:
  - weekday (Weekday): Mon-Fri
  - weekend (Weekend): Sat-Sun

=== THỊ TRƯỜNG: Hạ Long ===
...
[CƠ SỞ LƯU TRÚ]
Hotel Name (5★ Hotel)
  Address: ...
  - Deluxe Room (2 người, Mã: DELX-01)
    1 Day:
      Weekday: 2,500,000₫ (2 người) | +1ng: 500,000₫ | -1ng: 300,000₫
      Weekend: 3,000,000₫ (2 người) | +1ng: 600,000₫

[QUY TẮC GIÁ]
- High Season Multiplier (multiplier): 1.2x for June-August
```

---

## 5. How AI Understands Customer Intent for Pricing

### Current Mechanism: Implicit (Conversational)

The system DOES NOT explicitly parse customer intent. Instead:

1. **Context-Only Approach**:
   - All room prices, combos, seasons are provided in system prompt
   - Gemini extracts pricing details from conversation text
   - Example: User says "2 người, 3 ngày, cuối tuần" → Gemini reads pricing table and calculates

2. **System Instructions** (lines 4-16 in gemini-service.ts):
```
Khi tính giá: dùng BẢNG GIÁ CHÍNH XÁC trong dữ liệu, áp dụng quy tắc giá
When quoting price: LUÔN ghi rõ loại combo, loại ngày, số người tiêu chuẩn
```

3. **Knowledge Base Context**:
   - Articles from `knowledge_base` table with status="published"
   - Appended after market data
   - Could contain pricing guidelines, FAQ, booking terms

### What's NOT Happening:
- No structured intent classification (intent_type field)
- No metadata extraction before sending to Gemini
- No separate price calculation endpoint integration (pricing service exists but not called from chat)
- No customer segment/travel motivation matching

### Pricing Calculation Service (Separate from Chat):
- `pricing-service.ts` - `calculatePrice()` function computes price based on:
  - Room base price
  - Check-in/check-out dates
  - Applicable seasonal multiplier rules
  - Number of guests
- NOT integrated with chat module

---

## 6. Chat Module Route Handler

### Endpoint: `POST /chat/sessions/:id/messages`
**File**: `chat-routes.ts`, lines 36-46

```typescript
chatRoutes.post("/sessions/:id/messages", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = sendMessageSchema.parse(body);
  const messages = await chatService.sendMessage(
    c.req.param("id"),
    user.sub,
    dto.content,
  );
  return c.json({ success: true, data: messages }, 201);
});
```

### Service Handler: `sendMessage()` 
**File**: `chat-service.ts`, lines 114-157

**Steps**:
1. Validates session exists and user has access
2. Stores user message in database
3. Fetches all previous messages in session (ordered by createdAt asc)
4. Builds full KB context:
   - Calls `buildAiContext()` → market data (with 5-min cache)
   - Calls `getKbArticles()` → published KB articles
   - Concatenates: `marketContext + KB articles`
5. Calls `generateChatResponse()`:
   - Constructs system prompt: `SYSTEM_INSTRUCTIONS + kbContext`
   - Builds message history (all but last message)
   - Sends last message + history to Gemini
   - Returns AI response text
6. Stores assistant response in database
7. Returns both messages (user + assistant) as API response

### Data Schema:
- **chat_sessions**: id, userId, title, createdAt
- **chat_messages**: id, sessionId, role ("user"|"assistant"), content, metadata (JSONB), createdAt

---

## 7. Gemini Model Integration

### Service: `gemini-service.ts`

**Model Used**: `gemini-3-flash-preview` (line 65)

**System Instructions** (lines 4-16):
```
Bạn là AI Travel Assistant chuyên về du lịch Việt Nam cho nhân viên sale.
Trả lời dựa trên DỮ LIỆU THỰC TẾ bên dưới.

## QUY TẮC
1. Khi tính giá: dùng BẢNG GIÁ CHÍNH XÁC trong dữ liệu
2. Khi so sánh: dùng bảng đánh giá tiêu chí
3. Khi gợi ý lịch trình: dùng LỊCH TRÌNH MẪU
4. Nếu không có dữ liệu: nói rõ "chưa có thông tin"
5. Trả lời bằng tiếng Việt, chuyên nghiệp, thân thiện
6. Khi quote giá: LUÔN ghi rõ loại combo, loại ngày, số người tiêu chuẩn
```

**API Communication**:
```
GoogleGenAI client
  ↓
Chat session creation with:
  - model: "gemini-3-flash-preview"
  - systemInstruction: SYSTEM_INSTRUCTIONS + kbContext
  - history: previous messages
  ↓
sendMessage(lastUserMessage)
  ↓
response.text
```

**Key Behavior**:
- Stateless API calls (no session persistence on Gemini side)
- Session history managed by application DB
- Full context rebuilt for every message (includes all previous context)

---

## 8. Knowledge Base Integration

### Source: `knowledge_base` table

**Retrieved in**: `chat-service.ts`, `getKbArticles()` (lines 90-101)

**Filtering**:
- Only records with status="published"
- All fields: title, content, category

**Format in Context**:
```
--- KẾT THÚC DỮ LIỆU THỊ TRƯỜNG ---

### [CATEGORY] Title
Content...

### [CATEGORY] Another Title
Content...
```

**Appended After**: Market data section (line 111)

---

## 9. Caching Strategy

### Market Data Context Cache
**File**: `ai-context-builder.ts`, lines 40-47

```typescript
let cachedContext: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateAiContextCache(): void {
  cachedContext = null;
}
```

**Cache Check** (line 254):
```typescript
if (cachedContext && Date.now() - cachedAt < CACHE_TTL) {
  return cachedContext;
}
```

**Usage**: Reused across multiple chat messages within 5-minute window

**Invalidation Point**: When admin toggles AI data settings or modifies market data, should call `invalidateAiContextCache()`

---

## 10. Critical Findings & Gaps

### What Works Well:
✓ Comprehensive market data context (all relevant tourism info)
✓ Flexible data inclusion via admin-controlled settings
✓ Pricing data properly formatted with combo/day type labels
✓ 5-minute context caching for performance
✓ Proper access control (user can only see their own sessions)
✓ Full conversation history included (no context loss)

### Gaps & Limitations:

1. **No Current Date in Context** ⚠️
   - AI cannot make date-relative recommendations
   - Seasonal pricing requires user to mention dates
   - Itinerary planning lacks temporal context

2. **No Explicit Customer Intent Parsing** ⚠️
   - All pricing extraction is conversational
   - No structured metadata about customer needs
   - Could be slow for complex multi-step bookings

3. **Pricing Service Not Integrated** ⚠️
   - Separate `calculatePrice()` function exists but never called from chat
   - Gemini approximates prices from tables instead
   - May lead to calculation errors with complex rules

4. **Limited Metadata in Messages** ⚠️
   - Message metadata field exists but empty ({})
   - No extraction of: customer intent, parsed parameters, prices calculated
   - Could improve future chat analysis

5. **No Context Size Management** ⚠️
   - Context grows as market data expands
   - No summarization or chunking
   - Large datasets could hit token limits

6. **KB Articles Not Categorized by Market** ⚠️
   - All published articles included in every chat
   - No market-specific KB filtering
   - Potentially irrelevant context for user

---

## File Paths Summary

Core Chat Files:
- `/home/automation/project-template/apps/api/src/modules/chat/chat-routes.ts`
- `/home/automation/project-template/apps/api/src/modules/chat/chat-service.ts`
- `/home/automation/project-template/apps/api/src/modules/chat/gemini-service.ts`

Context Building:
- `/home/automation/project-template/apps/api/src/modules/market-data/ai-context-builder.ts`
- `/home/automation/project-template/apps/api/src/modules/market-data/ai-context-format-helpers.ts`

Pricing Services (not integrated with chat):
- `/home/automation/project-template/apps/api/src/modules/pricing/pricing-service.ts`
- `/home/automation/project-template/apps/api/src/modules/market-data/property-rooms-service.ts`

Database Schemas:
- `/home/automation/project-template/apps/api/src/db/schema/room-pricing-schema.ts`
- `/home/automation/project-template/apps/api/src/db/schema/pricing-options-schema.ts`
- `/home/automation/project-template/apps/api/src/db/schema/pricing-configs-schema.ts`
- `/home/automation/project-template/apps/api/src/db/schema/chat-sessions-schema.ts`
- `/home/automation/project-template/apps/api/src/db/schema/chat-messages-schema.ts`
- `/home/automation/project-template/apps/api/src/db/schema/knowledge-base-schema.ts`

