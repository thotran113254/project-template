# Phase 6: Frontend Tool-Call Events

## Context Links
- Current hook: `apps/web/src/hooks/use-chat-stream.ts` (215 lines)
- Current page: `apps/web/src/pages/chat-page.tsx` (273 lines)
- Phase 5: new `tool-call` SSE event shape `{ toolName, args, usedSkill }`

## Overview
- Priority: P2
- Status: pending
- Depends on: Phase 5
- Handle new `tool-call` SSE event, show "Đang tra cứu..." indicator with tool name

## Changes Summary

### `use-chat-stream.ts`
1. Add `toolCalls` state to track active tool calls
2. Parse `tool-call` SSE event
3. Expose `toolCalls` array in return value
4. Remove `hasCachedContext` from `TokenUsageInfo` (no more caching)

### `chat-page.tsx`
1. Show tool-call indicator between user message and AI response
2. Display "Đang tra cứu [tool label]..." during tool execution
3. Map tool names to Vietnamese labels

## Related Code Files

### Modify
- `apps/web/src/hooks/use-chat-stream.ts`
- `apps/web/src/pages/chat-page.tsx`

## Implementation Steps

### 1. Update `use-chat-stream.ts`

**Add tool call type**:
```typescript
export interface ToolCallInfo {
  toolName: string;
  args: Record<string, unknown>;
  usedSkill: boolean;
}
```

**Add state**:
```typescript
const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([]);
```

**Reset in `send()`**:
```typescript
setToolCalls([]);
```

**Parse new SSE event** (add case in the event switch):
```typescript
} else if (currentEvent === "tool-call") {
  setToolCalls((prev) => [...prev, data as ToolCallInfo]);
}
```

**Clear tool calls on completion** (inside `ai-complete` handler):
```typescript
setToolCalls([]);
```

**Update return**:
```typescript
return { send, streamingText, isStreaming, error, lastUsage, pendingUserMessage, toolCalls };
```

**Update `TokenUsageInfo`** — remove `hasCachedContext`:
```typescript
export interface TokenUsageInfo {
  tokenUsage: {
    promptTokens: number;
    responseTokens: number;
    thinkingTokens: number;
    cachedTokens: number;  // keep field, will be 0
    totalTokens: number;
  };
  estimatedCost: {
    inputCost: number;
    cachedCost: number;  // keep field, will be 0
    outputCost: number;
    thinkingCost: number;
    totalCost: number;
  };
  turn?: number;
  durationMs?: number;
  hasThinking?: boolean;
  // REMOVED: hasCachedContext
}
```

### 2. Update `chat-page.tsx`

**Get toolCalls from hook**:
```typescript
const { send, streamingText, isStreaming, error, lastUsage, pendingUserMessage, toolCalls } = useChatStream({
  onComplete: onStreamComplete,
});
```

**Add tool name label map** (top of file or inline):
```typescript
const TOOL_LABELS: Record<string, string> = {
  getMarketOverview: "thông tin thị trường",
  getMarketPricing: "bảng giá",
  getMarketAttractions: "điểm du lịch",
  getItineraryTemplates: "lịch trình mẫu",
  getMarketBusinessData: "dữ liệu kinh doanh",
  searchKnowledgeBase: "knowledge base",
};
```

**Replace the existing "AI đang trả lời..." indicator** with a smarter one that distinguishes between tool-calling and text-generating states:

```tsx
{/* Tool call indicator — shows during data retrieval phase */}
{isStreaming && !streamingText && toolCalls.length > 0 && (
  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
    <div className="flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]" />
    </div>
    Đang tra cứu {TOOL_LABELS[toolCalls[toolCalls.length - 1]!.toolName] ?? "dữ liệu"}...
  </div>
)}

{/* Default thinking indicator — before any tool calls or after tools complete */}
{isStreaming && !streamingText && toolCalls.length === 0 && (
  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
    <div className="flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:300ms]" />
    </div>
    AI đang xử lý...
  </div>
)}
```

**Visual distinction**: amber dots for tool calls, teal dots for thinking/generating. Shows the latest tool being called.

### 3. Remove `hasCachedContext` references in `chat-page.tsx`

In the `serverMessages.map()` block, remove `hasCachedContext` from the saved usage extraction:
```typescript
// Before
const savedUsage = meta?.tokenUsage && meta?.estimatedCost
  ? { tokenUsage: meta.tokenUsage, estimatedCost: meta.estimatedCost,
      turn: ..., durationMs: ..., hasThinking: ..., hasCachedContext: ... }
  : null;

// After — remove hasCachedContext line
const savedUsage = meta?.tokenUsage && meta?.estimatedCost
  ? { tokenUsage: meta.tokenUsage, estimatedCost: meta.estimatedCost,
      turn: meta.turn as number | undefined,
      durationMs: meta.durationMs as number | undefined,
      hasThinking: meta.hasThinking as boolean | undefined }
  : null;
```

### 4. Check ChatTokenUsage component for `hasCachedContext` usage

```
apps/web/src/components/chat/chat-token-usage.tsx
```
If it references `hasCachedContext`, remove that display. The cached tokens field in usage will naturally be 0.

## Todo
- [ ] Add `ToolCallInfo` type and `toolCalls` state to `use-chat-stream.ts`
- [ ] Parse `tool-call` SSE event in the hook
- [ ] Expose `toolCalls` in hook return
- [ ] Update `chat-page.tsx` to show tool-call indicator with Vietnamese labels
- [ ] Replace single "AI đang trả lời..." with two-state indicator (tool-call vs thinking)
- [ ] Remove `hasCachedContext` from `TokenUsageInfo` and all consuming components
- [ ] Check `chat-token-usage.tsx` for `hasCachedContext` references
- [ ] Run `pnpm typecheck`

## Success Criteria
- "Đang tra cứu bảng giá..." shows when `getMarketPricing` tool is called
- "AI đang xử lý..." shows during initial processing and final generation
- Amber dots for tool calls, teal dots for thinking — clear visual distinction
- Streaming text appears normally after tools resolve
- No TypeScript errors from removed `hasCachedContext`

## Risk Assessment
- **Rapid tool calls**: If model calls 3 tools in quick succession, indicator flickers between labels. Acceptable — shows latest tool name. Could debounce but YAGNI.
- **Tool call after text start**: Very unlikely — model calls all tools first, then generates text. If it happens, `toolCalls` state resets on `ai-complete` anyway.
