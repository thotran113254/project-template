# AI Chat Streaming Implementation Exploration

## Overview
Comprehensive analysis of the AI travel assistant chat system with server-sent event (SSE) streaming, token tracking, and Gemini function calling integration.

---

## 1. Frontend: Message Flow & Streaming Display

### Core Hook: `useChatStream`
**File:** `/home/automation/project-template/apps/web/src/hooks/use-chat-stream.ts`

Entry point for all streaming logic. Uses buffered flush strategy at 50ms intervals (20fps) to balance smooth rendering with reduced re-renders.

**Key Features:**
- **Buffered accumulation**: Text tokens collected in `accumulatedRef`, flushed to React state at fixed intervals
- **SSE parsing**: Manually parses SSE format (`event:` and `data:` lines)
- **Tool call tracking**: Emits tool calls during execution via `tool-call` events
- **Optimistic UI**: Shows pending user message immediately before AI response arrives
- **Abort handling**: Supports cancellation via `AbortController`

**Event Types Handled:**
1. `user-message` - User's message saved to DB
2. `ai-chunk` - Individual streaming text tokens (accumulated in buffer)
3. `tool-call` - Triggered when Gemini calls a function (includes `toolName`, `args`, `usedSkill`)
4. `ai-complete` - Final message with cost breakdown and usage metadata
5. `error` - Error during generation

**Token Usage Extraction:**
- Receives `costBreakdown` object with:
  - `main`: gemini-3-flash-preview token counts + cost
  - `cheap`: gemini-2.5-flash-lite token counts + cost  
  - `toolRounds`: number of function call iterations
  - `totalCost`: USD cost for entire turn

### Chat Page Component
**File:** `/home/automation/project-template/apps/web/src/pages/chat-page.tsx`

**Data Flow:**
1. Fetch sessions: `GET /chat/sessions` → TanStack Query
2. Auto-select first session if none active
3. Fetch messages: `GET /chat/sessions/{sessionId}/messages` → history load
4. On user send:
   - Show optimistic pending message immediately
   - Call `send(sessionId, content)` from hook
   - SSE stream arrives token-by-token
   - Buffered tokens render smoothly at 20fps
   - On completion: `onStreamComplete` callback updates query cache with both user + assistant messages

**Auto-scroll Behavior:**
- Tracks if user is "near bottom" (within 100px)
- Auto-scrolls on:
  - New streaming tokens (only if near bottom)
  - Pending user message appearance
  - Session change
  - Server messages load
- User can scroll up to pause auto-scroll

### Message Rendering Components

**ChatMessageBubble** (`/apps/web/src/components/chat/chat-message-bubble.tsx`)
- Avatar + timestamp + content bubble (role-specific styling)
- Assistant messages use MarkdownRenderer for formatting
- User messages shown as plain text
- Teal color for assistant, gray for user

**MarkdownRenderer** (`/apps/web/src/components/chat/markdown-renderer.tsx`)
- React Markdown with GitHub-flavored markdown (GFM)
- Custom styling for:
  - Tables (proper borders)
  - Code blocks (dark background)
  - Headings & lists
  - Links (open in new tab)
  - Blockquotes

**ChatTokenUsage** (`/apps/web/src/components/chat/chat-token-usage.tsx`)
- Displays:
  - Turn number
  - Processing duration
  - Thinking mode indicator (if used)
  - Tool round count
  - Per-model token breakdown (input, output, cached, thinking)
  - Total USD cost
- Compact 11px display below message

### Supporting Components

**ChatInput** (`/apps/web/src/components/chat/chat-input.tsx`)
- Text input with Enter-to-send + Shift+Enter for newline (future)
- Teal send button
- Auto-focus when streaming completes
- Disabled during streaming

**ChatSessionSidebar** (`/apps/web/src/components/chat/chat-session-sidebar.tsx`)
- List of chat sessions (sorted by newest first)
- Create new session button
- Delete session (hover action)
- Relative date formatting (today shows time, older shows days/date)
- Active session highlighted in teal

**ChatSuggestionChips** (`/apps/web/src/components/chat/chat-suggestion-chips.tsx`)
- 3 grouped suggestion categories:
  1. Quick pricing quotes
  2. Comparisons & recommendations
  3. Supplemental info (attractions, transport, policies)
- Randomly picks one from each group per session start
- Teal hover effect

### HTTP Client & Auth
**File:** `/apps/web/src/lib/api-client.ts`

- Axios instance with JWT bearer token from localStorage
- Automatic token refresh on 401 (with request queueing during refresh)
- Does NOT refresh for credential endpoints (/auth/login, /auth/register, etc.)
- Timeout: 30 seconds

---

## 2. Backend: Streaming Endpoint & Gemini Integration

### Streaming Route
**File:** `/home/automation/project-template/apps/api/src/modules/chat/chat-routes.ts`

**Endpoint:** `POST /sessions/{id}/messages/stream`

**Flow:**
1. Parse message + validate with Zod schema
2. Prepare context: save user message, fetch conversation history (max 30 messages), build catalog
3. Stream response via Hono `streamSSE()`:
   - Send `user-message` event with saved DB record
   - Stream AI response chunks via `generateChatResponseStream`
   - Send `tool-call` events during function execution
   - Send `ai-complete` with full message + metadata on success
   - Send `error` event on failure

**Model Pricing Configuration:**
```
gemini-3-flash-preview: $0.50/1M in, $3.00/1M out, $0.25/1M cached, $3.00/1M thinking
gemini-2.5-flash-lite:  $0.025/1M in, $0.15/1M out, $0.0125/1M cached
```

Cost breakdown computed per-model and aggregated for total.

### Chat Service
**File:** `/home/automation/project-template/apps/api/src/modules/chat/chat-service.ts`

**Key Functions:**
- `listSessions(userId)` - Fetch all sessions for user
- `createSession(userId, title)` - Create new chat session
- `deleteSession(id, userId)` - Delete with ownership check
- `getMessages(sessionId, userId)` - Fetch message history with access control
- `prepareStreamContext(sessionId, userId, content)` - Atomic: save user msg + load context for streaming
- `saveAssistantMessage(sessionId, fullContent, metadata)` - Save complete response with token usage

**Database Schema:**
- `chat_sessions`: id, userId (FK), title, createdAt
- `chat_messages`: id, sessionId (FK), role, content, metadata (JSONB), createdAt

### Gemini Service - Streaming Generation
**File:** `/home/automation/project-template/apps/api/src/modules/chat/gemini-service.ts`

**Generator Function:** `generateChatResponseStream(messages, catalog, userRole, onToolCall?, onUsage?)`

**Algorithm:**
1. Initialize `GoogleGenAI` client with API key from env
2. Load admin-configurable model settings (temperature, thinking level, max tool rounds)
3. Build system prompt from database or hardcoded fallback
4. Convert chat history to Gemini format (user ↔ model roles)

**Tool Loop (up to maxToolRounds iterations):**
1. Call `generateContent()` (non-streaming) with tools
2. If function calls detected:
   - Preserve original model content (includes thinking tokens)
   - Execute functions via `resolveToolCalls()`
   - Route large data through cheap model for summarization
   - Add tool results back to history
   - Continue loop
3. If no tool calls, stream final text response via `generateContentStream()`

**Usage Tracking:**
- Main model usage accumulated across all tool rounds
- Cheap model usage from skill processing
- Aggregated and sent in `ai-complete` event

**Fallback:**
- If max tool rounds exceeded: return error message in Vietnamese

### Tool Execution
**File:** `/home/automation/project-template/apps/api/src/modules/chat/gemini-tool-handlers.ts`

11 tools available, all wrapped by `executeToolCall()`:
- `getMarketOverview` - Market + property list
- `getPropertyDetails` - Full property details (no pricing)
- `getPropertyPricing` - Room pricing with filters
- `getPropertyPricing` - Room pricing with filters
- `compareProperties` - Side-by-side comparison
- `searchProperties` - Cross-market search
- `getMarketAttractions` - Tourism info
- `getItineraryTemplates` - Pre-built trip plans
- `getMarketBusinessData` - Market analysis + policies
- `searchKnowledgeBase` - Internal KB search
- `getTransportPricing` - Bus/ferry rates
- `calculateComboPrice` - Full package pricing (role-aware)

**Error Handling:** All tools catch exceptions and return error message string (never throws).

### Cheap Model Processing
**File:** `/home/automation/project-template/apps/api/src/modules/chat/gemini-cheap-model.ts`

**Strategy:**
- Checks if raw data > 2000 characters
- If yes: routes to `gemini-2.5-flash-lite` with skill-specific instructions
- Extracts usage from cheap model response
- Falls back to raw data on error

**Skill Config Support:**
- Per-skill model override (modelName, temperature)
- Lazily loaded from database

### System Prompt & Configuration
**File:** `/home/automation/project-template/apps/api/src/modules/chat/gemini-utils.ts`

**Hardcoded System Instructions:**
- Role: AI assistant for INTERNAL sales staff, not customers
- Rules: ALWAYS call tools before answering, never hallucinate prices
- Lookup strategies: Progressive refinement (overview → details → pricing)
- Anti-hallucination: Only mention properties in tool results
- Pricing guide: Weekday vs weekend, combo types (2n1d/3n2d), child policies
- Response format: Vietnamese, markdown tables for pricing

**DB-Driven Customization:**
- Admin can configure prompt sections per-category in `ai_chat_configs` table:
  - `prompt_role`
  - `prompt_lookup_rules`
  - `prompt_anti_hallucination`
  - `prompt_progressive_strategy`
  - `prompt_questioning`
  - `prompt_price_guide`
  - `prompt_response_format`
- Creativity rules built from per-category data settings
- Falls back to hardcoded if no custom prompts

**Date Context:** Auto-generated with Vietnam timezone (UTC+7), day abbreviations (T2-T7, CN).

---

## 3. Message Persistence

### Database Layer

**Schema: chat_sessions**
```sql
id uuid PRIMARY KEY
user_id uuid FK → users.id (CASCADE delete)
title varchar(255) DEFAULT 'New Chat'
created_at timestamp (UTC+0)
INDEX: chat_sessions_user_id_idx
```

**Schema: chat_messages**
```sql
id uuid PRIMARY KEY
session_id uuid FK → chat_sessions.id (CASCADE delete)
role varchar(20) - "user" | "assistant" | "system"
content text
metadata jsonb DEFAULT {}
created_at timestamp (UTC+0)
INDEX: chat_messages_session_id_idx
```

**Metadata JSONB Structure** (for assistant messages):
```json
{
  "costBreakdown": {
    "main": { "model": "...", "tokens": {...}, "cost": {...} },
    "cheap": { "model": "...", "tokens": {...}, "cost": {...} },
    "toolRounds": 2,
    "totalCost": 0.0234
  },
  "turn": 1,
  "durationMs": 1234,
  "historyMessages": 4,
  "hasThinking": true
}
```

### State Management

**Frontend State (React):**
- Sessions list: TanStack Query with `queryKey: ["chat-sessions"]`
- Messages: TanStack Query with `queryKey: ["chat-messages", sessionId]`
- Streaming state: Inside `useChatStream` hook
  - `streamingText` - Current buffered response
  - `isStreaming` - Active stream flag
  - `lastUsage` - Token usage from completed message
  - `pendingUserMessage` - Optimistic user message
  - `toolCalls` - Current function call events

**Cache Invalidation:**
- On new session created: invalidate `["chat-sessions"]`
- On session deleted: invalidate `["chat-sessions"]` + clear active session
- On stream complete: `setQueryData` to append user + assistant messages to cache

### API Endpoints

**Non-Streaming Fallback:**
- `POST /sessions/{id}/messages` - Old non-SSE endpoint (kept for compatibility)
- Collects entire stream into single string before responding
- Same response format, just not streamed

---

## 4. Key Design Patterns

### Buffered Streaming
- Text tokens accumulated in ref (uncontrolled)
- Flushed to React state at fixed 50ms interval (20fps)
- Balances smooth UX with minimal re-renders
- Ref prevents unnecessary closures in useCallback

### Progressive Tool Resolution
1. Call main model with tools (may trigger functions)
2. If tool calls: execute + route large results through cheap model
3. Add results to history, re-run main model
4. Repeat until no more tool calls or max rounds reached
5. Stream final text response

### Role-Based Access Control
- All endpoints check `user.sub` (JWT subject) against `userId` in DB
- HTTPException 403 on ownership mismatch
- `calculateComboPrice` tool shows admin vs user pricing based on role

### Error Recovery
- SSE parsing ignores malformed JSON lines (continues)
- Abortable requests cancel on component unmount
- Tool execution never throws (returns error string)
- Cheap model processing degrades gracefully (returns raw data)

### Cost Attribution
- Main model: all AI generation
- Cheap model: data summarization from large tool results
- Tracked separately, reported separately
- Per-turn granularity in metadata

---

## 5. File Paths Summary

### Frontend Chat Components
- `/apps/web/src/pages/chat-page.tsx` - Main page layout + session management
- `/apps/web/src/hooks/use-chat-stream.ts` - SSE streaming + token handling
- `/apps/web/src/components/chat/chat-message-bubble.tsx` - Message display
- `/apps/web/src/components/chat/chat-input.tsx` - Input bar
- `/apps/web/src/components/chat/chat-session-sidebar.tsx` - Session list
- `/apps/web/src/components/chat/chat-token-usage.tsx` - Cost breakdown display
- `/apps/web/src/components/chat/chat-suggestion-chips.tsx` - Quick-reply chips
- `/apps/web/src/components/chat/markdown-renderer.tsx` - Markdown → React
- `/apps/web/src/lib/api-client.ts` - HTTP client + auth

### Backend Chat API
- `/apps/api/src/modules/chat/chat-routes.ts` - SSE endpoint + CRUD operations
- `/apps/api/src/modules/chat/chat-service.ts` - Business logic + DB queries
- `/apps/api/src/modules/chat/gemini-service.ts` - Streaming AI generation
- `/apps/api/src/modules/chat/gemini-tool-handlers.ts` - Tool execution dispatch
- `/apps/api/src/modules/chat/gemini-utils.ts` - Prompt building + token extraction
- `/apps/api/src/modules/chat/gemini-tool-definitions.ts` - Tool declarations
- `/apps/api/src/modules/chat/gemini-cheap-model.ts` - Data summarization

### Database Schemas
- `/apps/api/src/db/schema/chat-sessions-schema.ts`
- `/apps/api/src/db/schema/chat-messages-schema.ts`

### Shared Types
- `/packages/shared/src/types/chat-types.ts` - ChatSession, ChatMessage types
- `/packages/shared/src/schemas/chat-schemas.ts` - Zod validation schemas

---

## 6. Message Flow Diagram

```
FRONTEND                          BACKEND                         GEMINI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User types + presses Send
    ↓
[Show optimistic message]
    ↓
fetch('POST /messages/stream')
    ↓────────────────────────────────────→ Validate + save user message
                                             Load history + catalog
                                             ↓
                                        [SSE stream starts]
                                             ↓
                                        generateChatResponseStream()
                                             ↓
                                        Call generateContent(tools)
                                             ├─→ Tools triggered?
                                             │   YES: Execute + cheap model
                                             │   ↓
                                             │   Add results to history
                                             │   Loop again
                                             │
                                             └─→ No tools: generateContentStream()
                                                 ↓
                                                 [Chunk by chunk...]
                                                 ↓
    ←────────────────── event: user-message, data: {id, content, ...}
    ←────────────────── event: ai-chunk, data: {text: "Dạ..."}
    ←────────────────── event: ai-chunk, data: {text: " tôi có"}
    ←────────────────── event: tool-call, data: {toolName, args}
    ←────────────────── event: ai-chunk, data: {text: " thông tin..."}
    ←────────────────── event: ai-complete, data: {id, content, costBreakdown, ...}
    
[Buffer tokens at 50ms intervals, re-render ~20fps]
[Display streaming message in real-time]
[Show token usage breakdown]
[Call onComplete → add to query cache]
```

---

## Summary Table

| Layer | Component | Purpose |
|-------|-----------|---------|
| **UI** | ChatPage | Session + message layout |
| **Hook** | useChatStream | SSE parsing + buffered rendering |
| **Components** | Bubble, Input, Sidebar | Message display, input, session mgmt |
| **HTTP** | apiClient | Auth + request queueing |
| **API Route** | POST /messages/stream | SSE endpoint |
| **Service** | chatService | DB + context prep |
| **AI** | geminiService | Tool orchestration + streaming |
| **Tools** | toolHandlers | Function execution |
| **Models** | gemini-3-flash + flash-lite | Main AI + data processing |
| **DB** | chat_sessions/messages | Persistent storage |

