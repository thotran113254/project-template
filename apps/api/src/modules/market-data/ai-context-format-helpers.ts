import type { MarketRecord } from "../../db/schema/markets-schema.js";
import type { MarketPropertyRecord } from "../../db/schema/market-properties-schema.js";
import type { PropertyRoomRecord } from "../../db/schema/property-rooms-schema.js";
import type { RoomPricingRecord } from "../../db/schema/room-pricing-schema.js";
import type { MarketTargetCustomerRecord } from "../../db/schema/market-target-customers-schema.js";
import type { MarketAttractionRecord } from "../../db/schema/market-attractions-schema.js";
import type { MarketDiningSpotRecord } from "../../db/schema/market-dining-spots-schema.js";
import type { MarketTransportationRecord } from "../../db/schema/market-transportation-schema.js";
import type { ItineraryTemplateRecord } from "../../db/schema/itinerary-templates-schema.js";
import type { ItineraryTemplateItemRecord } from "../../db/schema/itinerary-template-items-schema.js";
import type { MarketCompetitorRecord } from "../../db/schema/market-competitors-schema.js";
import type { MarketInventoryStrategyRecord } from "../../db/schema/market-inventory-strategies-schema.js";
import type { MarketCustomerJourneyRecord } from "../../db/schema/market-customer-journeys-schema.js";
import type { PricingConfigRecord } from "../../db/schema/pricing-configs-schema.js";

export function formatMarketHeader(market: MarketRecord): string {
  let text = `=== THỊ TRƯỜNG: ${market.name} ===\n`;
  if (market.description) text += `${market.description}\n`;
  if (market.highlights) text += `Điểm nổi bật: ${market.highlights}\n`;
  if (market.seasonInfo) text += `Mùa du lịch: ${market.seasonInfo}\n`;
  if (market.travelTips) text += `Tips: ${market.travelTips}\n`;
  return text;
}

export function formatPriceRow(prices: RoomPricingRecord[]): string {
  const byCombo: Record<string, RoomPricingRecord[]> = {};
  for (const p of prices) {
    (byCombo[p.comboType] ??= []).push(p);
  }

  let text = "";
  for (const [combo, dayPrices] of Object.entries(byCombo)) {
    const label =
      combo === "3n2d" ? "3N2Đ" : combo === "2n1d" ? "2N1Đ" : "Giá/đêm";
    const priceStrs = dayPrices
      .map((p) => `${p.dayType}: ${p.price.toLocaleString("vi-VN")}₫`)
      .join(", ");
    text += `    ${label}: ${priceStrs}\n`;
  }
  return text;
}

export function formatRoom(
  room: PropertyRoomRecord,
  prices: RoomPricingRecord[],
  includePricing: boolean,
): string {
  let text = `  - ${room.roomType} (${room.capacity} người${room.bookingCode ? `, Mã: ${room.bookingCode}` : ""})\n`;
  if (includePricing && prices.length > 0) {
    text += formatPriceRow(prices);
  }
  return text;
}

export function formatProperty(
  prop: MarketPropertyRecord,
  rooms: Array<{ room: PropertyRoomRecord; prices: RoomPricingRecord[] }>,
  includePricing: boolean,
): string {
  let text = `${prop.name} (${prop.type}${prop.starRating ? `, ${prop.starRating}★` : ""})\n`;
  if (prop.address) text += `  Địa chỉ: ${prop.address}\n`;
  if (prop.locationDetail) text += `  Vị trí: ${prop.locationDetail}\n`;
  for (const { room, prices } of rooms) {
    text += formatRoom(room, prices, includePricing);
  }
  return text;
}

export function formatProperties(
  props: Array<{
    prop: MarketPropertyRecord;
    rooms: Array<{ room: PropertyRoomRecord; prices: RoomPricingRecord[] }>;
  }>,
  includePricing: boolean,
): string {
  if (props.length === 0) return "";
  let text = "\n[CƠ SỞ LƯU TRÚ]\n";
  for (const { prop, rooms } of props) {
    text += formatProperty(prop, rooms, includePricing);
  }
  return text;
}

export function formatTargetCustomers(
  targets: MarketTargetCustomerRecord[],
): string {
  if (targets.length === 0) return "";
  let text = "\n[KHÁCH HÀNG MỤC TIÊU]\n";
  for (const t of targets) {
    text += `- ${t.segmentName}${t.ageRange ? ` (${t.ageRange})` : ""}\n`;
    if (t.travelMotivation) text += `  Động lực: ${t.travelMotivation}\n`;
    if (t.bookingHabits) text += `  Thói quen: ${t.bookingHabits}\n`;
    if (t.painPoints) text += `  Pain points: ${t.painPoints}\n`;
  }
  return text;
}

export function formatAttractions(
  attrs: MarketAttractionRecord[],
): string {
  if (attrs.length === 0) return "";
  let text = "\n[ĐIỂM DU LỊCH]\n";
  for (const a of attrs) {
    text += `- ${a.name}${a.type ? ` (${a.type})` : ""}${a.popularity ? ` — Mức độ phổ biến: ${a.popularity}` : ""}\n`;
    if (a.experienceValue) text += `  Giá trị: ${a.experienceValue}\n`;
    if (a.bestTime) text += `  Thời điểm lý tưởng: ${a.bestTime}\n`;
    if (a.costInfo) text += `  Chi phí: ${a.costInfo}\n`;
  }
  return text;
}

export function formatDining(dining: MarketDiningSpotRecord[]): string {
  if (dining.length === 0) return "";
  let text = "\n[ẨM THỰC]\n";
  for (const d of dining) {
    text += `- ${d.name} (${d.category})${d.priceRange ? ` — ${d.priceRange}` : ""}\n`;
    if (d.notableFeatures) text += `  Đặc trưng: ${d.notableFeatures}\n`;
  }
  return text;
}

export function formatTransportation(
  transport: MarketTransportationRecord[],
): string {
  if (transport.length === 0) return "";
  let text = "\n[PHƯƠNG TIỆN DI CHUYỂN]\n";
  for (const t of transport) {
    text += `- ${t.routeSegment} (${t.transportType})${t.duration ? ` — ${t.duration}` : ""}\n`;
    if (t.costInfo) text += `  Chi phí: ${t.costInfo}\n`;
  }
  return text;
}

export function formatItineraries(
  templates: ItineraryTemplateRecord[],
  itemsByTemplate: Map<string, ItineraryTemplateItemRecord[]>,
): string {
  if (templates.length === 0) return "";
  let text = "\n[LỊCH TRÌNH MẪU]\n";
  for (const tpl of templates) {
    text += `${tpl.title} (${tpl.durationDays} ngày ${tpl.durationNights} đêm)\n`;
    const items = (itemsByTemplate.get(tpl.id) ?? []).slice().sort(
      (a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder,
    );
    let lastDay = 0;
    for (const item of items) {
      if (item.dayNumber !== lastDay) {
        text += `  Ngày ${item.dayNumber}:\n`;
        lastDay = item.dayNumber;
      }
      const timeStr = item.timeStart
        ? `${item.timeStart}${item.timeEnd ? `-${item.timeEnd}` : ""}`
        : item.timeOfDay;
      text += `    ${timeStr}: ${item.activity}${item.location ? ` (${item.location})` : ""}\n`;
    }
  }
  return text;
}

export function formatCompetitors(
  comps: MarketCompetitorRecord[],
): string {
  if (comps.length === 0) return "";
  let text = "\n[ĐỐI THỦ CẠNH TRANH]\n";
  for (const c of comps) {
    text += `- ${c.groupName}${c.examples ? `: ${c.examples}` : ""}`;
    text += `${c.effectiveness ? ` — Hiệu quả: ${c.effectiveness}` : ""}\n`;
    if (c.mainChannels) text += `  Kênh: ${c.mainChannels}\n`;
  }
  return text;
}

export function formatInventoryStrategies(
  strategies: MarketInventoryStrategyRecord[],
): string {
  if (strategies.length === 0) return "";
  let text = "\n[CHIẾN LƯỢC ÔM QUỸ PHÒNG]\n";
  for (const s of strategies) {
    text += `- ${s.monthRange}${s.seasonName ? ` (${s.seasonName})` : ""}: ${s.demandLevel ?? "N/A"}\n`;
    if (s.holdingType) text += `  Loại ôm: ${s.holdingType}\n`;
    if (s.targetSegment) text += `  Phân khúc: ${s.targetSegment}\n`;
  }
  return text;
}

export function formatCustomerJourneys(
  journeys: MarketCustomerJourneyRecord[],
): string {
  if (journeys.length === 0) return "";
  const sorted = [...journeys].sort((a, b) => a.stageOrder - b.stageOrder);
  let text = "\n[HÀNH TRÌNH KHÁCH HÀNG]\n";
  for (const j of sorted) {
    text += `${j.stageOrder}. ${j.stageName}${j.phaseName ? ` (${j.phaseName})` : ""}\n`;
    if (j.customerActions) text += `  Hành động: ${j.customerActions}\n`;
    if (j.painpoints) text += `  Painpoint: ${j.painpoints}\n`;
  }
  return text;
}

export function formatPricingRules(
  configs: PricingConfigRecord[],
  marketId: string,
): string {
  const relevant = configs.filter(
    (c) => c.marketId === marketId || !c.marketId,
  );
  if (relevant.length === 0) return "";
  let text = "\n[QUY TẮC GIÁ]\n";
  for (const c of relevant) {
    text += `- ${c.ruleName} (${c.ruleType})\n`;
    if (c.description) text += `  ${c.description}\n`;
  }
  return text;
}
