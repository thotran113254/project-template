# Phase 4: AI Chatbot Enhancement - Structured Context

## Priority: HIGH | Status: ✅ COMPLETE

## Overview
Nâng cấp Gemini AI chat từ flat KB articles sang structured market data context. AI có thể so sánh, tính giá, gợi ý lịch trình chính xác.

---

## Current vs New Architecture

### Current (Flat KB)
```
KB articles (markdown text) → concatenate all → inject into system prompt → Gemini
```
**Limitations**: AI đọc text, không tính giá được, không so sánh structured, không filter

### New (Structured Context)
```
Structured DB data → ai_context_builder (filter by ai_visible + ai_settings)
→ formatted structured text → inject into system prompt → Gemini
```

---

## System Prompt Enhancement

### Current system prompt (Vietnamese, hardcoded rules)
Hardcoded: child pricing, destinations list, basic rules

### New system prompt structure:
```
[ROLE & INSTRUCTIONS]
Bạn là trợ lý AI du lịch cho nhân viên sale. Trả lời dựa trên DỮ LIỆU THỰC TẾ bên dưới.
Khi tính giá: dùng bảng giá chính xác, áp dụng quy tắc giá (trẻ em, phụ thu).
Khi so sánh: dùng bảng đánh giá tiêu chí.
Khi gợi ý lịch trình: dùng lịch trình mẫu, tùy chỉnh theo yêu cầu KH.
Nếu không có dữ liệu: nói rõ "chưa có thông tin trong hệ thống".

[DỮ LIỆU THỊ TRƯỜNG]
{output from ai_context_builder}
```

---

## AI Context Builder Logic

```typescript
// ai-context-builder.ts
export async function buildAiContext(): Promise<string> {
  const settings = await getAiDataSettings(); // global toggles
  const sections: string[] = [];

  // 1. Markets overview
  if (settings.market) {
    const markets = await getMarkets({ aiVisible: true });
    for (const market of markets) {
      sections.push(formatMarketSection(market));
    }
  }

  return sections.join('\n\n');
}

function formatMarketSection(market): string {
  let text = `=== THỊ TRƯỜNG: ${market.name} ===\n`;

  // Properties + rooms + pricing
  if (settings.property) {
    text += formatProperties(market.properties);
  }

  // Itineraries
  if (settings.itinerary) {
    text += formatItineraries(market.itineraries);
  }

  // Competitors
  if (settings.competitor) {
    text += formatCompetitors(market.competitors);
  }

  // Customer journey
  if (settings.journey) {
    text += formatCustomerJourney(market.journeyStages);
  }

  // Pricing configs (rules)
  if (settings.pricing) {
    text += formatPricingConfigs(market.pricingConfigs);
  }

  return text;
}
```

---

## Context Size Management

**Problem**: Nhiều thị trường + properties = context quá dài cho Gemini

**Solutions**:
1. **Priority**: Chỉ include markets có status='active' và ai_visible=true
2. **Truncation**: Limit context to ~30k chars (Gemini flash supports 1M but shorter = better quality)
3. **Lazy loading**: Nếu user hỏi về market cụ thể, inject deep data cho market đó
4. **Cache**: Cache built context, invalidate khi data thay đổi (simple TTL 5 phút)

---

## Enhanced Chat Flow

```
User message → Chat service
  → Build/get cached AI context
  → Append conversation history
  → Send to Gemini with structured system prompt
  → Store response
  → Return to user
```

---

## Implementation Steps
- [x] Create ai-context-builder.ts in market-data module
- [x] Format functions for each data type (properties, itineraries, pricing, etc.)
- [x] Update gemini-service.ts to use new context builder
- [x] Add context caching (in-memory, 5min TTL)
- [x] Update system prompt with new instructions
- [x] Keep backward compatibility with existing KB articles (merge both contexts)
- [x] Test all 8 use cases from client document

## Success Criteria
- [x] AI correctly answers all 8 use cases from client document
- [x] AI uses real pricing data for calculations
- [x] AI compares properties using evaluation criteria
- [x] AI suggests itineraries based on templates
- [x] Admin toggle ai_visible → immediately affects AI responses
- [x] Response quality ≥ current flat KB approach
