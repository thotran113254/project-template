# Phase 5: Chat Service + Routes Update

## Context Links
- Current: `apps/api/src/modules/chat/chat-service.ts` (215 lines)
- Current: `apps/api/src/modules/chat/chat-routes.ts` (163 lines)
- Phase 1: `buildCatalog()` in `ai-context-builder.ts`
- Phase 4: new `generateChatResponseStream` signature + `ToolCallEvent`

## Overview
- Priority: P1
- Status: pending
- Depends on: Phase 4
- Update chat-service to use catalog instead of full KB, add 30-message history limit, update SSE route for tool-call events

## Changes Summary

### `chat-service.ts`
1. Replace `buildKbContext()` → `buildCatalog()` from Phase 1
2. Remove `getKbArticles()` — no longer needed (KB fetched via tool)
3. Add 30-message history limit to `prepareStreamContext()`
4. Update return type: `kbContext` → `catalog`

### `chat-routes.ts`
1. Update `generateChatResponseStream` call with new signature
2. Add `tool-call` SSE event for frontend processing indicator
3. Update pricing constants (cheap model pricing)
4. Pass `onToolCall` callback to emit SSE events

## Related Code Files

### Modify
- `apps/api/src/modules/chat/chat-service.ts`
- `apps/api/src/modules/chat/chat-routes.ts`

### Import from
- `apps/api/src/modules/market-data/ai-context-builder.ts` — `buildCatalog()`
- `apps/api/src/modules/chat/gemini-service.ts` — updated `generateChatResponseStream`

## Implementation Steps

### 1. Update `chat-service.ts`

**Remove** `getKbArticles()` function (lines 90-101) and `buildKbContext()` function (lines 104-112).

**Replace import**:
```typescript
// Before
import { buildAiContext } from "../market-data/ai-context-builder.js";

// After
import { buildCatalog } from "../market-data/ai-context-builder.js";
```

**Add history limit constant**:
```typescript
const MAX_HISTORY_MESSAGES = 30;
```

**Update `prepareStreamContext()`**:
```typescript
export async function prepareStreamContext(
  sessionId: string,
  userId: string,
  content: string,
): Promise<{
  userMsg: ChatMessage;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  catalog: string;  // was: kbContext
}> {
  // ... session validation (unchanged) ...

  // Store user message (unchanged)
  const [userMsg] = await db
    .insert(chatMessages)
    .values({ sessionId, role: "user", content, metadata: {} })
    .returning();

  // Fetch conversation history — LIMIT to last 30 messages
  const historyRows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  const allHistory = historyRows.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Trim to last MAX_HISTORY_MESSAGES (keep most recent context)
  const history = allHistory.length > MAX_HISTORY_MESSAGES
    ? allHistory.slice(-MAX_HISTORY_MESSAGES)
    : allHistory;

  // Build lightweight catalog instead of full KB dump
  const catalog = await buildCatalog();

  return { userMsg: toMessage(userMsg!), history, catalog };
}
```

**Update `sendMessage()` (non-streaming)**:
Same pattern — use `buildCatalog()` instead of `buildKbContext()`, trim history.

### 2. Update `chat-routes.ts`

**Update import**:
```typescript
// Before
import { generateChatResponseStream, type TokenUsage } from "./gemini-service.js";

// After
import { generateChatResponseStream, type TokenUsage, type ToolCallEvent } from "./gemini-service.js";
```

**Add cheap model pricing**:
```typescript
const PRICING = {
  // Main model (gemini-3-flash-preview)
  inputPerMillion: 0.50,
  outputPerMillion: 3.00,
  cachedInputPerMillion: 0.25,
  thinkingPerMillion: 3.00,
  // Note: cheap model cost is negligible ($0.10/1M) — not tracked per-request
} as const;
```

**Update SSE streaming handler**:
```typescript
chatRoutes.post("/sessions/:id/messages/stream", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = sendMessageSchema.parse(body);

  // Note: catalog instead of kbContext
  const { userMsg, history, catalog } = await chatService.prepareStreamContext(
    c.req.param("id"),
    user.sub,
    dto.content,
  );

  return streamSSE(c, async (stream) => {
    let chunkId = 0;

    // Send user message confirmation
    await stream.writeSSE({
      data: JSON.stringify(userMsg),
      event: "user-message",
      id: String(chunkId++),
    });

    let fullContent = "";
    let tokenUsage: TokenUsage | null = null;
    const startTime = Date.now();
    const turnNumber = Math.ceil(history.length / 2);

    try {
      // Tool call callback — emit SSE event for each tool invocation
      const onToolCall = async (event: ToolCallEvent) => {
        await stream.writeSSE({
          data: JSON.stringify({
            toolName: event.toolName,
            args: event.args,
            usedSkill: event.usedSkill,
          }),
          event: "tool-call",
          id: String(chunkId++),
        });
      };

      const gen = generateChatResponseStream(
        history,
        catalog,
        onToolCall,
        (u) => { tokenUsage = u; },
      );

      for await (const text of gen) {
        fullContent += text;
        await stream.writeSSE({
          data: JSON.stringify({ text }),
          event: "ai-chunk",
          id: String(chunkId++),
        });
      }

      const durationMs = Date.now() - startTime;

      // Build metadata (same pattern, updated field names)
      const usageMeta: Record<string, unknown> = {
        model: "gemini-3-flash-preview",
        turn: turnNumber,
        durationMs,
        historyMessages: history.length,
        hasThinking: tokenUsage?.thinkingTokens ? true : false,
      };
      if (tokenUsage) {
        usageMeta.tokenUsage = tokenUsage;
        usageMeta.estimatedCost = estimateCost(tokenUsage);
      }

      // Save to DB
      const assistantMsg = await chatService.saveAssistantMessage(
        c.req.param("id"),
        fullContent,
        usageMeta,
      );

      // Send completion event
      await stream.writeSSE({
        data: JSON.stringify({
          ...assistantMsg,
          tokenUsage,
          estimatedCost: tokenUsage ? estimateCost(tokenUsage) : null,
          turn: turnNumber,
          durationMs,
          hasThinking: !!tokenUsage?.thinkingTokens,
        }),
        event: "ai-complete",
        id: String(chunkId++),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI generation failed";
      await stream.writeSSE({
        data: JSON.stringify({ error: message }),
        event: "error",
        id: String(chunkId++),
      });
    }
  });
});
```

### 3. Key SSE event changes
| Event | Before | After |
|-------|--------|-------|
| `user-message` | same | same |
| `tool-call` | N/A | **NEW** — `{ toolName, args, usedSkill }` |
| `ai-chunk` | same | same |
| `ai-complete` | had `hasCachedContext` | removed `hasCachedContext` (no more caching) |
| `error` | same | same |

## Todo
- [ ] Update `chat-service.ts`: replace `buildKbContext` → `buildCatalog`, add 30-msg limit
- [ ] Remove `getKbArticles()` and `buildKbContext()` from chat-service
- [ ] Update `chat-routes.ts`: new `generateChatResponseStream` signature, add `tool-call` SSE
- [ ] Remove `hasCachedContext` from ai-complete event
- [ ] Run `pnpm typecheck`

## Success Criteria
- History trimmed to 30 messages max
- `tool-call` SSE events emitted during data retrieval
- `ai-chunk` and `ai-complete` events work as before
- No more full KB dump in request pipeline
- `pnpm typecheck` passes

## Risk Assessment
- **History trimming**: Slicing oldest messages may lose context. 30 messages = ~15 turns is generous for most conversations. If user references very old context, model may not recall — acceptable tradeoff.
- **SSE event ordering**: `tool-call` events fire BEFORE `ai-chunk` events. Frontend must handle both states. Phase 6 covers this.
