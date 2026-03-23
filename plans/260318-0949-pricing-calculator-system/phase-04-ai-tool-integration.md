# Phase 4: Gemini AI Tool Integration

## Context Links
- Tool declarations: `apps/api/src/modules/chat/gemini-tool-definitions.ts`
- Tool handlers: `apps/api/src/modules/chat/gemini-tool-handlers.ts`
- AI data fetchers: `apps/api/src/modules/market-data/ai-data-fetchers.ts`
- AI market data fetchers: `apps/api/src/modules/market-data/ai-market-data-fetchers.ts`
- AI format helpers: `apps/api/src/modules/market-data/ai-context-format-helpers.ts`
- Pricing search skill: `apps/api/src/modules/chat/skills/pricing-search-skill.ts`
- Existing tool: `getPropertyPricing` already fetches room prices
- Existing tool: `getMarketBusinessData` already fetches pricing_configs rules

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Add 2 new Gemini function-calling tools: `getTransportPricing` and `calculateComboPrice`. Update existing `getPropertyPricing` to include new dual-price fields for admin context.

## Key Insights
- Current `getPropertyPricing` calls `fetchMarketPricing()` which formats room prices via `formatPriceRow()` - this needs to optionally include discount prices
- AI chatbot runs in a "system" context (no user role) - it should see LISTED prices by default, matching what staff would quote to customers
- The `getMarketAttractions` tool already fetches transport from `market_transportation` (descriptive). New tool `getTransportPricing` fetches STRUCTURED pricing from `transport_providers`/`transport_pricing`.
- Combo calculator tool lets AI build quotes: "5 people, 2N1D at Khach san May Mo Mang with cabin bus"

## Requirements

### New Tool 1: `getTransportPricing`
- Fetches structured transport/ferry pricing for a market
- Params: `slug` (market), `category` (optional: "bus"|"ferry"), `providerCode` (optional)
- Returns formatted text: provider name, route, vehicle classes, prices per seat type

### New Tool 2: `calculateComboPrice`
- Calls combo calculator service from Phase 3
- Params: `marketSlug`, `propertySlug`, `numAdults`, `numChildrenUnder10`, `numChildrenUnder5`, `numNights`, `dayType`, `transportClass`, `ferryClass`
- Returns formatted combo breakdown text

### Update: `getPropertyPricing` format
- Add new room pricing fields (under-standard, surcharges) to formatted output
- Keep showing LISTED prices (AI is staff-facing context)

## Related Code Files

### Files to CREATE:
1. `apps/api/src/modules/market-data/ai-transport-fetchers.ts` (~90 lines) - fetch + format transport/ferry pricing for AI
2. `apps/api/src/modules/chat/skills/transport-pricing-search-skill.ts` (~15 lines) - skill instruction for cheap model filtering

### Files to MODIFY:
1. `apps/api/src/modules/chat/gemini-tool-definitions.ts` - add 2 new tool declarations
2. `apps/api/src/modules/chat/gemini-tool-handlers.ts` - add 2 new handler mappings
3. `apps/api/src/modules/market-data/ai-context-format-helpers.ts` - update `formatPriceRow` to include new fields
4. `apps/api/src/modules/market-data/ai-data-fetchers.ts` - re-export new fetcher functions

## Implementation Steps

### Step 1: Create ai-transport-fetchers.ts

```ts
// Functions:
// - fetchTransportPricing(slug, filters?) -> formatted string
// - fetchFormattedCombo(input) -> formatted string

import { resolveMarket } from "./ai-data-fetchers.js";
// Query transport_providers + transport_pricing for market
// Format as structured text for AI consumption
```

**Format for transport pricing output:**
```
[GIÁ VẬN CHUYỂN — Tà Xùa]
Nhà xe Hải Giang (bus) — Hà Nội <-> Tà Xùa
  Điểm đón: 6h40 Điểm A, 7h Điểm B, 8h Điểm C
  Cabin đơn (1ng): 1 chiều 400k | KHỨ HỒI 800k
  Cabin đôi (2ng): 1 chiều 600k/2ng | KHỨ HỒI 1.2M/2ng
  Limousine ghế trước: 1 chiều 200k | KHỨ HỒI 400k
  ...
  Trẻ em: <5 tuổi miễn phí, 5-10 giảm 100k, >10 giá người lớn
  Phụ thu liên tỉnh: Quảng Ninh +200k/ng/chiều, Ninh Bình +300k/ng/chiều

[GIÁ TÀU — Cát Bà]
Nhà tàu Nguyên Việt (ferry) — Cảng Ao Tiên -> Đảo
  Tàu nhỏ ghế thường: 1 chiều 200k | KHỨ HỒI 400k
  Tàu cao tốc VIP: 1 chiều 200k | KHỨ HỒI 400k (nước + snack)
  ...
```

**Format for combo calculation output:**
```
[BÁO GIÁ COMBO — 5 người, 2N1Đ]
Thị trường: Tà Xùa | Cơ sở: Khách sạn Mây Mơ Màng

PHÒNG:
  1x Đơn MMM02 (2ng): 1,000,000₫
  1x Đôi MMM01 (4ng → 3ng under-standard): 1,000,000₫
  Tổng phòng: 2,000,000₫

VẬN CHUYỂN (Cabin khứ hồi):
  3 người lớn x 800k = 2,400,000₫
  1 trẻ 5-10 x 700k = 700,000₫
  1 trẻ <5 = miễn phí
  Tổng vận chuyển: 3,100,000₫

TỔNG TRƯỚC LỢI NHUẬN: 5,100,000₫
Lợi nhuận (15%): 765,000₫
TỔNG SAU LỢI NHUẬN: 5,865,000₫
GIÁ MỖI NGƯỜI: 1,173,000₫
```

### Step 2: Create transport-pricing-search-skill.ts

```ts
export const TRANSPORT_PRICING_SEARCH_SKILL = `Bạn là data processor. Nhiệm vụ: lọc và tóm tắt GIÁ VẬN CHUYỂN theo yêu cầu.

## QUY TẮC
1. Xác định loại phương tiện: bus, ferry, cabin, limousine, sleeper, speed_boat
2. Chỉ giữ lại dòng giá LIÊN QUAN đến yêu cầu
3. LUÔN giữ nguyên số liệu gốc
4. Nếu hỏi khứ hồi: ưu tiên hiển thị giá khứ hồi
5. Nếu hỏi 1 chiều: hiển thị giá 1 chiều

## OUTPUT
Trả về dữ liệu đã lọc. Bỏ dòng không liên quan.`;
```

### Step 3: Add tool declarations to gemini-tool-definitions.ts

```ts
const getTransportPricing: FunctionDeclaration = {
  name: "getTransportPricing",
  description:
    "Lấy bảng giá vận chuyển (xe khách, tàu/ferry) có cấu trúc: nhà xe, loại xe, hạng ghế, giá 1 chiều/khứ hồi, chính sách trẻ em, phụ thu liên tỉnh. Dùng khi khách hỏi giá xe, giá tàu, đặt vé.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      slug: { type: Type.STRING, description: "Slug thị trường" },
      category: {
        type: Type.STRING,
        description: "Lọc: 'bus' (xe khách) hoặc 'ferry' (tàu/phà). Bỏ trống = tất cả (optional)",
      },
    },
    required: ["slug"],
  },
};

const calculateComboPrice: FunctionDeclaration = {
  name: "calculateComboPrice",
  description:
    "Tính giá combo trọn gói: phòng + vận chuyển + tàu (nếu có) + dịch vụ thêm. Áp dụng biên lợi nhuận. Trả về báo giá chi tiết từng hạng mục và giá/người. Dùng khi sale cần báo giá combo, tính giá trọn gói.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      marketSlug: { type: Type.STRING, description: "Slug thị trường" },
      propertySlug: { type: Type.STRING, description: "Slug cơ sở lưu trú (optional, bỏ trống = tự chọn tối ưu)" },
      numAdults: { type: Type.NUMBER, description: "Số người lớn (>10 tuổi)" },
      numChildrenUnder10: { type: Type.NUMBER, description: "Số trẻ 5-10 tuổi (giảm giá vận chuyển)" },
      numChildrenUnder5: { type: Type.NUMBER, description: "Số trẻ <5 tuổi (miễn phí vận chuyển)" },
      numNights: { type: Type.NUMBER, description: "Số đêm: 1 (2N1Đ), 2 (3N2Đ)" },
      dayType: { type: Type.STRING, description: "Loại ngày: weekday, friday, saturday, holiday" },
      transportClass: { type: Type.STRING, description: "Hạng xe: cabin, limousine, sleeper (optional)" },
      ferryClass: { type: Type.STRING, description: "Hạng tàu: speed_boat, small_boat (optional, null = không cần tàu)" },
    },
    required: ["marketSlug", "numAdults", "numNights", "dayType"],
  },
};
```

Add both to `TOOL_DECLARATIONS` array.

### Step 4: Add handlers to gemini-tool-handlers.ts

```ts
import {
  fetchTransportPricing,
  fetchFormattedCombo,
} from "../market-data/ai-transport-fetchers.js";

// Add to handlers map:
getTransportPricing: (args) =>
  fetchTransportPricing(args.slug as string, {
    category: args.category as string | undefined,
  }),

calculateComboPrice: (args) =>
  fetchFormattedCombo({
    marketSlug: args.marketSlug as string,
    propertySlug: args.propertySlug as string | undefined,
    numAdults: (args.numAdults as number) ?? 2,
    numChildrenUnder10: (args.numChildrenUnder10 as number) ?? 0,
    numChildrenUnder5: (args.numChildrenUnder5 as number) ?? 0,
    numNights: (args.numNights as number) ?? 1,
    dayType: (args.dayType as string) ?? "weekday",
    transportClass: args.transportClass as string | undefined,
    ferryClass: args.ferryClass as string | undefined,
  }),
```

### Step 5: Update formatPriceRow in ai-context-format-helpers.ts

Extend to show new fields when present:
```ts
// After existing price line, add:
if (p.underStandardPrice) parts.push(`dưới TC: ${fmt(p.underStandardPrice)}₫`);
if (p.extraAdultSurcharge) parts.push(`phụ thu NL: +${fmt(p.extraAdultSurcharge)}₫`);
if (p.extraChildSurcharge) parts.push(`phụ thu TE: +${fmt(p.extraChildSurcharge)}₫`);
if (p.includedAmenities) parts.push(`kèm: ${p.includedAmenities}`);
```

### Step 6: Update ai-data-fetchers.ts re-exports

```ts
export {
  fetchTransportPricing,
  fetchFormattedCombo,
} from "./ai-transport-fetchers.js";
```

## Todo List
- [ ] Create ai-transport-fetchers.ts (fetch + format transport pricing, combo result)
- [ ] Create transport-pricing-search-skill.ts
- [ ] Add getTransportPricing declaration to gemini-tool-definitions.ts
- [ ] Add calculateComboPrice declaration to gemini-tool-definitions.ts
- [ ] Add both handlers to gemini-tool-handlers.ts
- [ ] Update formatPriceRow in ai-context-format-helpers.ts for new room fields
- [ ] Update ai-data-fetchers.ts with re-exports
- [ ] Run typecheck

## Success Criteria
- AI chatbot can call `getTransportPricing("ta-xua")` and get structured pricing
- AI chatbot can call `calculateComboPrice({marketSlug: "ta-xua", numAdults: 3, ...})` and get full quote
- Updated `getPropertyPricing` shows surcharge/amenity info for rooms
- No regression on existing tools

## Risk Assessment
- **Token usage:** Transport pricing + combo output can be large. Format is concise text, not JSON, to minimize tokens. The skill-based filtering (cheap model) helps reduce further.
- **Missing data:** If market has no transport providers, `getTransportPricing` returns helpful message, not error.
- **Combo calculator errors:** `fetchFormattedCombo` wraps in try/catch and returns error message string (matches existing tool pattern in `executeToolCall`).

## Security Considerations
- AI tools show LISTED prices only (staff-facing context)
- Discount prices are NOT included in AI tool output
- If future requirement needs AI to show discount prices, add an `includeDiscount` flag gated by admin session context
