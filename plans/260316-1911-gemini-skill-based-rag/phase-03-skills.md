# Phase 3: Skills (Cheap Model Instruction Sets)

## Context Links
- Cheap model: `gemini-2.5-flash-lite` ($0.10/1M input)
- DATA_THRESHOLD: 2000 chars — if raw data exceeds this, route through cheap model
- Format helpers: `apps/api/src/modules/market-data/ai-context-format-helpers.ts` (output format reference)

## Overview
- Priority: P1 (blocking Phase 4)
- Status: pending
- Independent of Phases 1-2 (can parallelize)
- Skills are instruction strings that teach the cheap model how to filter/compress raw data

## Key Insight
Skills are NOT code — they are prompt instruction templates. Each skill tells the cheap model:
1. What kind of data it's looking at
2. What the user is asking
3. How to filter/summarize
4. Output format rules

The cheap model receives: `skill instruction + user question + raw data → filtered data`

## Architecture

```
apps/api/src/modules/chat/
├── skills/
│   ├── index.ts                        (~40 lines) — registry + getSkill()
│   ├── pricing-search-skill.ts         (~30 lines) — instruction string
│   ├── overview-search-skill.ts        (~25 lines)
│   ├── attractions-search-skill.ts     (~25 lines)
│   ├── itinerary-search-skill.ts       (~25 lines)
│   ├── business-data-search-skill.ts   (~25 lines)
│   └── kb-search-skill.ts             (~25 lines)
├── gemini-cheap-model.ts              (~60 lines) — cheap model caller
```

## Skill-to-Tool Mapping

| Tool Name | Skill Name | When Used |
|-----------|-----------|-----------|
| `getMarketOverview` | `overview-search` | rawData > 2000 chars |
| `getMarketPricing` | `pricing-search` | rawData > 2000 chars |
| `getMarketAttractions` | `attractions-search` | rawData > 2000 chars |
| `getItineraryTemplates` | `itinerary-search` | rawData > 2000 chars |
| `getMarketBusinessData` | `business-data-search` | rawData > 2000 chars |
| `searchKnowledgeBase` | `kb-search` | rawData > 2000 chars |

## Related Code Files

### Create
- `apps/api/src/modules/chat/skills/index.ts`
- `apps/api/src/modules/chat/skills/pricing-search-skill.ts`
- `apps/api/src/modules/chat/skills/overview-search-skill.ts`
- `apps/api/src/modules/chat/skills/attractions-search-skill.ts`
- `apps/api/src/modules/chat/skills/itinerary-search-skill.ts`
- `apps/api/src/modules/chat/skills/business-data-search-skill.ts`
- `apps/api/src/modules/chat/skills/kb-search-skill.ts`
- `apps/api/src/modules/chat/gemini-cheap-model.ts`

## Implementation Steps

### 1. Create skill files (each exports a single string constant)

**`pricing-search-skill.ts`** — most complex skill:
```typescript
export const PRICING_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: lọc và tóm tắt BẢNG GIÁ phòng.

## INPUT
- Câu hỏi người dùng
- Dữ liệu giá thô từ hệ thống

## QUY TẮC XỬ LÝ
1. Xác định yêu cầu từ câu hỏi: loại phòng, combo type, day type, số người, property cụ thể
2. Chỉ giữ lại các dòng giá LIÊN QUAN đến yêu cầu
3. Nếu hỏi "rẻ nhất" / "đắt nhất": sắp xếp và chỉ trả top 3
4. Nếu hỏi so sánh: giữ tất cả options để so sánh
5. LUÔN giữ nguyên số liệu gốc, KHÔNG làm tròn hoặc thay đổi giá

## OUTPUT FORMAT
Trả về dữ liệu đã lọc, giữ nguyên format gốc. Bỏ các dòng không liên quan.
Nếu không tìm thấy dữ liệu phù hợp, trả: "(Không có giá phù hợp với yêu cầu)"
`;
```

**`overview-search-skill.ts`**:
```typescript
export const OVERVIEW_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: tóm tắt thông tin tổng quan thị trường.

## QUY TẮC
1. Giữ tên + loại + số sao của tất cả property
2. Tóm tắt mô tả thị trường thành 2-3 câu
3. Giữ nguyên highlights và season info
4. Bỏ chi tiết phòng nếu không được hỏi cụ thể

## OUTPUT
Trả về bản tóm tắt ngắn gọn, đủ thông tin để trả lời câu hỏi.
`;
```

**`attractions-search-skill.ts`**:
```typescript
export const ATTRACTIONS_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: lọc điểm du lịch, ẩm thực, phương tiện.

## QUY TẮC
1. Nếu hỏi loại cụ thể (biển, núi, chùa...): chỉ giữ điểm phù hợp
2. Nếu hỏi chung: giữ top 5 theo popularity
3. Giữ nguyên thông tin chi phí và thời điểm lý tưởng
4. Gộp ẩm thực + transport nếu câu hỏi liên quan

## OUTPUT
Danh sách đã lọc, giữ format gốc.
`;
```

**`itinerary-search-skill.ts`**:
```typescript
export const ITINERARY_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: lọc lịch trình mẫu.

## QUY TẮC
1. Nếu chỉ định số ngày: chỉ giữ lịch trình matching
2. Nếu chỉ định loại khách (gia đình, cặp đôi...): lọc theo target
3. Giữ nguyên chi tiết từng ngày trong lịch trình
4. Nếu nhiều lịch trình phù hợp: giữ tối đa 3

## OUTPUT
Lịch trình đã lọc, giữ format gốc với đầy đủ hoạt động.
`;
```

**`business-data-search-skill.ts`**:
```typescript
export const BUSINESS_DATA_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: tóm tắt dữ liệu kinh doanh.

## QUY TẮC
1. Tóm tắt đối thủ: tên + kênh chính + hiệu quả
2. Tóm tắt khách hàng mục tiêu: phân khúc + motivation
3. Giữ nguyên chiến lược phòng và customer journey
4. Bỏ chi tiết không liên quan đến câu hỏi

## OUTPUT
Bản tóm tắt kinh doanh ngắn gọn.
`;
```

**`kb-search-skill.ts`**:
```typescript
export const KB_SEARCH_SKILL = `
Bạn là data processor. Nhiệm vụ: tìm phần relevant trong KB articles.

## QUY TẮC
1. Đọc tất cả articles được cung cấp
2. Chỉ giữ paragraphs/sections liên quan đến câu hỏi
3. Giữ nguyên nội dung gốc, KHÔNG diễn giải
4. Nếu không có nội dung liên quan: trả "(Không tìm thấy thông tin liên quan)"

## OUTPUT
Các đoạn trích relevant từ KB, kèm tên bài viết gốc.
`;
```

### 2. Create `skills/index.ts` — registry

```typescript
import { PRICING_SEARCH_SKILL } from "./pricing-search-skill.js";
import { OVERVIEW_SEARCH_SKILL } from "./overview-search-skill.js";
import { ATTRACTIONS_SEARCH_SKILL } from "./attractions-search-skill.js";
import { ITINERARY_SEARCH_SKILL } from "./itinerary-search-skill.js";
import { BUSINESS_DATA_SEARCH_SKILL } from "./business-data-search-skill.js";
import { KB_SEARCH_SKILL } from "./kb-search-skill.js";

/** Map tool name → skill instruction for cheap model */
const SKILL_MAP: Record<string, string> = {
  getMarketOverview: OVERVIEW_SEARCH_SKILL,
  getMarketPricing: PRICING_SEARCH_SKILL,
  getMarketAttractions: ATTRACTIONS_SEARCH_SKILL,
  getItineraryTemplates: ITINERARY_SEARCH_SKILL,
  getMarketBusinessData: BUSINESS_DATA_SEARCH_SKILL,
  searchKnowledgeBase: KB_SEARCH_SKILL,
};

export function getSkillForTool(toolName: string): string | null {
  return SKILL_MAP[toolName] ?? null;
}
```

### 3. Create `gemini-cheap-model.ts` — cheap model caller

```typescript
import { GoogleGenAI } from "@google/genai";
import { env } from "../../env.js";

const CHEAP_MODEL = "gemini-2.5-flash-lite";
const DATA_THRESHOLD = 2000;

let cheapClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!cheapClient) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
    cheapClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return cheapClient;
}

/** Check if raw data should be processed by cheap model */
export function needsProcessing(rawData: string): boolean {
  return rawData.length > DATA_THRESHOLD;
}

/**
 * Process raw data through cheap model with skill instructions.
 * Returns filtered/summarized data string.
 */
export async function processWithSkill(
  skillInstruction: string,
  userQuestion: string,
  rawData: string,
): Promise<string> {
  const client = getClient();
  const prompt = `## CÂU HỎI NGƯỜI DÙNG\n${userQuestion}\n\n## DỮ LIỆU\n${rawData}`;

  const response = await client.models.generateContent({
    model: CHEAP_MODEL,
    contents: prompt,
    config: { systemInstruction: skillInstruction },
  });

  return response.text ?? rawData; // fallback to raw if generation fails
}
```

### 4. Integration pattern (used in Phase 4)
```typescript
// In gemini-service.ts tool-call loop:
const rawData = await executeToolCall(toolName, toolArgs);
let processedData = rawData;

if (needsProcessing(rawData)) {
  const skill = getSkillForTool(toolName);
  if (skill) {
    processedData = await processWithSkill(skill, userQuestion, rawData);
  }
}
// Send processedData as function response to main model
```

## Todo
- [ ] Create 6 skill instruction files
- [ ] Create `skills/index.ts` with registry
- [ ] Create `gemini-cheap-model.ts` with `needsProcessing()` + `processWithSkill()`
- [ ] Run `pnpm typecheck`

## Success Criteria
- All 6 skills export instruction strings
- `getSkillForTool("getMarketPricing")` returns pricing skill
- `needsProcessing("short text")` returns false
- `needsProcessing("x".repeat(2001))` returns true
- `processWithSkill()` calls cheap model and returns result

## Risk Assessment
- **Cheap model quality**: `gemini-2.5-flash-lite` may over-filter. Mitigation: skill instructions say "giữ nguyên số liệu gốc" (keep original numbers). Also, if cheap model fails, fall back to raw data.
- **Latency**: Extra model call adds ~200-500ms. Acceptable tradeoff for token savings on main model.
- **Cost**: At $0.10/1M input, processing 5K chars costs ~$0.0001 — negligible.
