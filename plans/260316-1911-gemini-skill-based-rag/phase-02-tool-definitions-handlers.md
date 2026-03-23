# Phase 2: Tool Definitions + Handlers

## Context Links
- Phase 1 output: `apps/api/src/modules/market-data/ai-data-fetchers.ts` (data functions)
- SDK docs: `@google/genai` uses `Type` enum for parameter schemas
- Format helpers: `apps/api/src/modules/market-data/ai-context-format-helpers.ts`

## Overview
- Priority: P1 (blocking Phase 4)
- Status: pending
- Depends on: Phase 1
- Define 6 Gemini function-calling tools and their execution handlers

## Key Insight
Tools are declared as `FunctionDeclaration[]` for the SDK. Handlers map tool name → Phase 1 fetcher function. All descriptions in Vietnamese to match system prompt language.

## Requirements

### Tool Declarations
Each tool needs: `name`, `description` (Vietnamese), `parameters` (JSON Schema via `Type` enum).

| Tool | Parameters | Description |
|------|-----------|-------------|
| `getMarketOverview` | `slug: string` (required) | Lấy thông tin tổng quan thị trường + danh sách cơ sở lưu trú (không có giá) |
| `getMarketPricing` | `slug: string` (req), `propertySlug?: string`, `comboType?: string`, `dayType?: string` | Lấy bảng giá phòng, có thể lọc theo property/combo/ngày |
| `getMarketAttractions` | `slug: string` (req) | Lấy điểm du lịch, ẩm thực, phương tiện di chuyển |
| `getItineraryTemplates` | `slug: string` (req), `durationDays?: number`, `customerType?: string` | Lấy lịch trình mẫu, lọc theo số ngày/loại khách |
| `getMarketBusinessData` | `slug: string` (req) | Lấy đối thủ, khách hàng mục tiêu, chiến lược kinh doanh |
| `searchKnowledgeBase` | `query: string` (req) | Tìm kiếm bài viết trong knowledge base |

### Handler
Single dispatch function: `executeToolCall(name, args) → Promise<string>`

## Architecture

```
gemini-tool-definitions.ts (NEW ~100 lines)
  + TOOL_DECLARATIONS: FunctionDeclaration[]
  + TOOLS config object for SDK

gemini-tool-handlers.ts (NEW ~80 lines)
  + executeToolCall(name: string, args: Record<string, unknown>): Promise<string>
```

## Related Code Files

### Create
- `apps/api/src/modules/chat/gemini-tool-definitions.ts`
- `apps/api/src/modules/chat/gemini-tool-handlers.ts`

### Depend On (Phase 1)
- `apps/api/src/modules/market-data/ai-data-fetchers.ts`

## Implementation Steps

### 1. Create `gemini-tool-definitions.ts`

```typescript
import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";

const getMarketOverview: FunctionDeclaration = {
  name: "getMarketOverview",
  description: "Lấy thông tin tổng quan thị trường và danh sách cơ sở lưu trú (không có giá). Dùng khi cần biết thị trường có gì, có resort/khách sạn nào.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      slug: { type: Type.STRING, description: "Slug thị trường (vd: da-nang, phu-quoc)" },
    },
    required: ["slug"],
  },
};

const getMarketPricing: FunctionDeclaration = {
  name: "getMarketPricing",
  description: "Lấy bảng giá phòng. Dùng khi khách hỏi giá, so sánh giá, tính chi phí. Có thể lọc theo property, combo type, day type.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      slug: { type: Type.STRING, description: "Slug thị trường" },
      propertySlug: { type: Type.STRING, description: "Lọc theo slug property cụ thể (optional)" },
      comboType: { type: Type.STRING, description: "Lọc theo loại combo: 2n1d, 3n2d, per_night (optional)" },
      dayType: { type: Type.STRING, description: "Lọc theo loại ngày: weekday, friday, saturday, sunday, holiday (optional)" },
    },
    required: ["slug"],
  },
};

// ... similar for other 4 tools

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  getMarketOverview,
  getMarketPricing,
  getMarketAttractions,
  getItineraryTemplates,
  getMarketBusinessData,
  searchKnowledgeBase,
];

/** Tools config object for Gemini SDK */
export const GEMINI_TOOLS = [{ functionDeclarations: TOOL_DECLARATIONS }];
```

### 2. Create `gemini-tool-handlers.ts`

```typescript
import {
  fetchMarketOverview,
  fetchMarketPricing,
  fetchMarketAttractions,
  fetchItineraryTemplates,
  fetchMarketBusinessData,
  fetchKnowledgeBaseArticles,
} from "../market-data/ai-data-fetchers.js";

type ToolArgs = Record<string, unknown>;

const handlers: Record<string, (args: ToolArgs) => Promise<string>> = {
  getMarketOverview: (args) =>
    fetchMarketOverview(args.slug as string),

  getMarketPricing: (args) =>
    fetchMarketPricing(args.slug as string, {
      propertySlug: args.propertySlug as string | undefined,
      comboType: args.comboType as string | undefined,
      dayType: args.dayType as string | undefined,
    }),

  getMarketAttractions: (args) =>
    fetchMarketAttractions(args.slug as string),

  getItineraryTemplates: (args) =>
    fetchItineraryTemplates(args.slug as string, {
      durationDays: args.durationDays as number | undefined,
      customerType: args.customerType as string | undefined,
    }),

  getMarketBusinessData: (args) =>
    fetchMarketBusinessData(args.slug as string),

  searchKnowledgeBase: (args) =>
    fetchKnowledgeBaseArticles(args.query as string),
};

/** Execute a tool call by name. Returns formatted data string or error message. */
export async function executeToolCall(
  name: string,
  args: ToolArgs,
): Promise<string> {
  const handler = handlers[name];
  if (!handler) return `Unknown tool: ${name}`;
  try {
    return await handler(args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tool execution failed";
    return `Error: ${msg}`;
  }
}
```

### 3. Error handling pattern
- Tool handlers catch all errors and return error strings (NOT throw)
- This lets the main model see the error and either retry with different params or inform user
- Example: "Error: Market not found: invalid-slug"

## Todo
- [ ] Create `gemini-tool-definitions.ts` with 6 tool declarations
- [ ] Create `gemini-tool-handlers.ts` with dispatch function
- [ ] Ensure all 6 handler functions match Phase 1 fetcher signatures
- [ ] Run `pnpm typecheck`

## Success Criteria
- All 6 tools declared with correct parameter schemas
- `executeToolCall("getMarketPricing", { slug: "da-nang", comboType: "2n1d" })` returns formatted pricing
- Errors return string messages, never throw

## Risk Assessment
- **Type enum import**: Ensure `Type` is exported from `@google/genai` v1.45+. Already used in SDK examples.
- **Arg type safety**: Handler args are `unknown` — cast with fallback. No runtime crash on missing optional args.
