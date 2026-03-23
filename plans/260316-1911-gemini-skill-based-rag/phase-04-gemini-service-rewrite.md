# Phase 4: Gemini Service Rewrite (Tool-Call Loop)

## Context Links
- Current: `apps/api/src/modules/chat/gemini-service.ts` (248 lines — full rewrite)
- Phase 1: `ai-data-fetchers.ts` (data layer)
- Phase 2: `gemini-tool-definitions.ts` + `gemini-tool-handlers.ts`
- Phase 3: `skills/index.ts` + `gemini-cheap-model.ts`
- SDK pattern: `@google/genai` — `client.models.generateContent()` loop with functionCall/functionResponse

## Overview
- Priority: P1 (core of the refactor)
- Status: pending
- Depends on: Phases 1, 2, 3
- Replace full-context-dump + caching with tool-call orchestration loop

## Key Insight
The main model no longer receives raw data in system prompt. Instead:
1. System prompt = rules + catalog (~500 tokens)
2. Model decides which tools to call based on user question
3. Tool results come back as function responses
4. Model generates final answer from tool results

Streaming happens ONLY on the final generation pass (after all tools resolved).

## What Gets Deleted
- `getOrCreateCache()` — no more explicit caching
- `activeCacheName/Hash/ExpiresAt` — cache state vars
- `simpleHash()` — hash for cache invalidation
- `invalidateGeminiCache()` — export (update callers)
- `createGeminiChat()` — replaced by tool-call loop
- `generateChatResponse()` — non-streaming fallback (keep thin wrapper if needed)
- `buildSystemPrompt()` that takes kbContext param

## Architecture

```
gemini-service.ts (REWRITE ~180 lines)
  - buildSystemPrompt(catalog): string          — rules + catalog (no KB data)
  - buildDateContext(): string                   — KEEP as-is
  - toGeminiContents(messages): Content[]        — convert chat history
  - resolveToolCalls(response, userQ): Content[] — execute tools + skills
  - generateChatResponseStream(messages, catalog, onToolCall?, onUsage?)
      → AsyncGenerator<string>                   — main entry point
```

### Tool-Call Loop Flow
```
1. Build contents = history + user message
2. Call generateContent({ model, contents, tools, systemInstruction })
3. Check response:
   a. Has functionCalls? → execute each tool → cheap model if needed → build functionResponse parts
      → append model response + function responses to contents → goto 2
   b. Has text? → yield text chunks → done
4. Max 5 iterations to prevent infinite loops
```

## Related Code Files

### Rewrite
- `apps/api/src/modules/chat/gemini-service.ts`

### Update callers
- `apps/api/src/modules/market-data/ai-context-builder.ts` — remove `invalidateGeminiCache()` import

### Import from
- `apps/api/src/modules/chat/gemini-tool-definitions.ts` (Phase 2)
- `apps/api/src/modules/chat/gemini-tool-handlers.ts` (Phase 2)
- `apps/api/src/modules/chat/skills/index.ts` (Phase 3)
- `apps/api/src/modules/chat/gemini-cheap-model.ts` (Phase 3)

## Implementation Steps

### 1. Rewrite `gemini-service.ts`

```typescript
import { GoogleGenAI, Type } from "@google/genai";
import type { Content, Part } from "@google/genai";
import { env } from "../../env.js";
import { GEMINI_TOOLS } from "./gemini-tool-definitions.js";
import { executeToolCall } from "./gemini-tool-handlers.js";
import { getSkillForTool } from "./skills/index.js";
import { needsProcessing, processWithSkill } from "./gemini-cheap-model.js";

const MODEL = "gemini-3-flash-preview";
const MAX_TOOL_ROUNDS = 5;

type MessageRole = "user" | "assistant";
interface ChatMessage {
  role: MessageRole;
  content: string;
}

// ─── Token Usage (KEEP existing interface) ────────────────────────────
export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
  totalTokens: number;
}

// ─── Client singleton ────────────────────────────────────────────────
let genai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!genai) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genai;
}

// ─── Date context (KEEP as-is) ──────────────────────────────────────
function buildDateContext(): string { /* ... existing code ... */ }

// ─── System prompt (NEW — small, no data) ───────────────────────────
function buildSystemPrompt(catalog: string): string {
  const dateContext = buildDateContext();
  return `## NGÀY HIỆN TẠI
${dateContext}

Bạn là AI Travel Assistant chuyên về du lịch Việt Nam cho nhân viên sale.

## QUY TẮC
1. Dùng tools để tra cứu dữ liệu TRƯỚC KHI trả lời
2. Khi tính giá: LUÔN gọi getMarketPricing, dùng số liệu chính xác
3. Khi so sánh: gọi tool cho từng thị trường cần so sánh
4. Nếu tool trả "không tìm thấy": nói rõ "chưa có thông tin trong hệ thống"
5. Trả lời bằng tiếng Việt, chuyên nghiệp, thân thiện
6. Khi quote giá: LUÔN ghi rõ loại combo, loại ngày, số người tiêu chuẩn
7. LUÔN hỏi lại nếu thiếu thông tin: số người, ngày đi, loại phòng

## HƯỚNG DẪN TÍNH GIÁ
- Xác định NGÀY CHECK-IN → map sang LOẠI NGÀY: T2-T5=weekday, T6=friday, T7=saturday, CN=sunday
- Xác định LOẠI COMBO từ số đêm: 1 đêm→2n1d, 2 đêm→3n2d
- Gọi getMarketPricing với đúng filters
- Nếu khách nói "cuối tuần" → check-in T6 hoặc T7

## DỮ LIỆU CÓ SẴN
${catalog}`;
}

// ─── Convert history ────────────────────────────────────────────────
function toContents(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ─── Tool call resolution ───────────────────────────────────────────
/** Info about a tool call execution — sent to frontend via SSE */
export interface ToolCallEvent {
  toolName: string;
  args: Record<string, unknown>;
  usedSkill: boolean;
}

async function resolveToolCalls(
  functionCalls: Array<{ name: string; args: Record<string, unknown> }>,
  userQuestion: string,
): Promise<{ parts: Part[]; events: ToolCallEvent[] }> {
  const parts: Part[] = [];
  const events: ToolCallEvent[] = [];

  for (const fc of functionCalls) {
    let result = await executeToolCall(fc.name, fc.args);
    let usedSkill = false;

    // Route through cheap model if data is large
    if (needsProcessing(result)) {
      const skill = getSkillForTool(fc.name);
      if (skill) {
        result = await processWithSkill(skill, userQuestion, result);
        usedSkill = true;
      }
    }

    parts.push({
      functionResponse: { name: fc.name, response: { result } },
    });
    events.push({ toolName: fc.name, args: fc.args, usedSkill });
  }

  return { parts, events };
}

// ─── Extract usage (KEEP) ───────────────────────────────────────────
function extractUsage(response: unknown): TokenUsage | null { /* ... existing ... */ }

// ─── Main streaming entry point ─────────────────────────────────────
export async function* generateChatResponseStream(
  messages: ChatMessage[],
  catalog: string,
  onToolCall?: (event: ToolCallEvent) => void,
  onUsage?: (usage: TokenUsage) => void,
): AsyncGenerator<string> {
  const client = getClient();
  const systemInstruction = buildSystemPrompt(catalog);
  const contents = toContents(messages);
  const config = {
    tools: GEMINI_TOOLS,
    systemInstruction,
    thinkingConfig: { thinkingLevel: "LOW" as const },
  };

  const userQuestion = messages[messages.length - 1]?.content ?? "";
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config,
    });

    // Check for function calls
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      // Append model's function call to contents
      contents.push({
        role: "model",
        parts: functionCalls.map((fc) => ({ functionCall: fc })),
      });

      // Execute tools + skills
      const { parts, events } = await resolveToolCalls(
        functionCalls.map((fc) => ({ name: fc.name, args: (fc.args ?? {}) as Record<string, unknown> })),
        userQuestion,
      );
      for (const evt of events) onToolCall?.(evt);

      // Append function responses
      contents.push({ role: "user", parts });

      continue; // Loop again — model may call more tools or generate text
    }

    // No more tool calls — stream the final response
    // Re-call with streaming for the final pass
    const stream = await client.models.generateContentStream({
      model: MODEL,
      contents,
      config,
    });

    let lastChunk: unknown = null;
    for await (const chunk of stream) {
      lastChunk = chunk;
      const text = chunk.text;
      if (text) yield text;
    }

    if (lastChunk && onUsage) {
      const usage = extractUsage(lastChunk);
      if (usage) onUsage(usage);
    }

    return; // Done
  }

  // Safety: max rounds exceeded
  yield "Xin lỗi, hệ thống gặp sự cố khi tra cứu dữ liệu. Vui lòng thử lại.";
}
```

### 2. Handle the streaming optimization
The pattern above does a non-streaming `generateContent` during tool-call rounds (we don't need to stream tool call responses to user), then a final `generateContentStream` for the text response. This is optimal because:
- Tool rounds: fast, no user-visible output needed
- Final response: needs streaming for UX

**Alternative (simpler but wasteful)**: Always stream, detect functionCalls in stream chunks. But `generateContentStream` doesn't cleanly expose functionCalls in all SDK versions. The non-stream → stream approach is safer.

### 3. Remove cache invalidation export
In `ai-context-builder.ts`, remove the dynamic `import("../chat/gemini-service.js").then(m => m.invalidateGeminiCache())` call from `invalidateAiContextCache()`. Just clear the local caches.

### 4. Keep `generateChatResponse` as thin wrapper (backward compat)
```typescript
export async function generateChatResponse(
  messages: ChatMessage[],
  catalog: string,
): Promise<string> {
  let result = "";
  for await (const text of generateChatResponseStream(messages, catalog)) {
    result += text;
  }
  return result;
}
```

## Todo
- [ ] Rewrite `gemini-service.ts` — delete cache logic, add tool-call loop
- [ ] Keep `buildDateContext()`, `TokenUsage`, `extractUsage()`, `getClient()`
- [ ] Add `ToolCallEvent` interface export
- [ ] Update `generateChatResponseStream` signature: `kbContext` → `catalog`, add `onToolCall?`
- [ ] Remove `invalidateGeminiCache` export and callers
- [ ] Update `ai-context-builder.ts` to remove Gemini cache invalidation
- [ ] Run `pnpm typecheck`

## Success Criteria
- Tool-call loop executes max 5 rounds
- Function calls are detected, executed, results sent back
- Final text response is streamed
- `ToolCallEvent` emitted for each tool call (consumed by Phase 5)
- No more full context in system prompt — only catalog
- `pnpm typecheck` passes

## Risk Assessment
- **Infinite loop**: MAX_TOOL_ROUNDS = 5 prevents runaway. Model rarely calls >2 rounds.
- **Non-streaming tool rounds**: If tool resolution takes >5s, user sees no output. Mitigation: Phase 5 sends `tool-call` SSE event so frontend shows "Đang tra cứu..."
- **generateContentStream after non-streaming**: The final streaming call resends full contents including tool responses. This is a trade-off — one extra API call but clean streaming. Token cost is minimal since tool response data is already small (post-skill processing).
- **SDK compatibility**: `response.functionCalls` is the documented API for `@google/genai` v1.45+. Verify during implementation.

## Security
- No user input flows into system prompt unsanitized — catalog is server-generated
- Tool args come from model (not user directly), but still validated in handlers
