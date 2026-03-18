import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { pricingConfigs } from "../../db/schema/index.js";
import { resolveMarket } from "../market-data/ai-data-fetchers.js";
import { resolveRoomCandidates, allocateRooms } from "./combo-room-allocator.js";
import { resolveTransportLine } from "./combo-transport-resolver.js";
import type { ComboCalculateRequest, ComboCalculationResult } from "@app/shared";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nightsToComboType(numNights: number): string {
  if (numNights === 1) return "2n1d";
  if (numNights === 2) return "3n2d";
  return "per_night";
}

async function loadProfitMargin(marketId: string, override?: number): Promise<number> {
  if (override !== undefined) return override;
  const configs = await db
    .select()
    .from(pricingConfigs)
    .where(and(eq(pricingConfigs.ruleType, "profit_margin"), eq(pricingConfigs.isActive, true)));
  const marketCfg = configs.find((c) => c.marketId === marketId);
  const globalCfg = configs.find((c) => !c.marketId);
  const cfg = marketCfg ?? globalCfg;
  if (!cfg) return 0;
  const raw = cfg.config as Record<string, unknown>;
  const pct = raw.defaultPercent ?? raw.percent;
  return typeof pct === "number" ? pct : 0;
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export async function calculateCombo(
  dto: ComboCalculateRequest,
  userRole: string,
): Promise<ComboCalculationResult> {
  const isAdmin = userRole === "admin";
  const numPeople = dto.numAdults + dto.numChildrenUnder10 + dto.numChildrenUnder5;

  const market = await resolveMarket(dto.marketSlug);
  const comboType = nightsToComboType(dto.numNights);

  // Room allocation
  const candidates = await resolveRoomCandidates(
    market.id, dto.propertySlug, comboType, dto.dayType,
  );
  const rooms = allocateRooms(candidates, numPeople, isAdmin);

  const roomCost = rooms.reduce((s, r) => s + r.totalRoomCost, 0);
  const roomDiscountCost = isAdmin
    ? rooms.reduce((s, r) => s + (r.totalDiscountCost ?? r.totalRoomCost), 0)
    : null;

  // Transport + Ferry
  const transport = await resolveTransportLine(
    market.id, "bus", dto.transportClass,
    dto.numAdults, dto.numChildrenUnder10, dto.numChildrenUnder5, isAdmin,
  );
  const ferry = await resolveTransportLine(
    market.id, "ferry", dto.ferryClass,
    dto.numAdults, dto.numChildrenUnder10, dto.numChildrenUnder5, isAdmin,
  );

  const transportCost = transport?.totalCost ?? 0;
  const ferryCost = ferry?.totalCost ?? 0;
  const subtotal = roomCost + transportCost + ferryCost;

  const discountSubtotal = isAdmin && roomDiscountCost !== null
    ? roomDiscountCost
      + (transport?.totalDiscountCost ?? transportCost)
      + (ferry?.totalDiscountCost ?? ferryCost)
    : null;

  // Profit margin (override only for admin)
  const marginOverride = isAdmin ? dto.profitMarginOverride : undefined;
  const profitMarginPercent = await loadProfitMargin(market.id, marginOverride);
  const marginAmount = Math.round(subtotal * profitMarginPercent / 100);
  const grandTotal = subtotal + marginAmount;
  const perPerson = numPeople > 0 ? Math.round(grandTotal / numPeople) : 0;

  const discountMarginAmount = discountSubtotal !== null
    ? Math.round(discountSubtotal * profitMarginPercent / 100) : null;
  const discountGrandTotal = discountSubtotal !== null && discountMarginAmount !== null
    ? discountSubtotal + discountMarginAmount : null;
  const discountPerPerson = discountGrandTotal !== null && numPeople > 0
    ? Math.round(discountGrandTotal / numPeople) : null;

  return {
    input: { numPeople, numNights: dto.numNights, dayType: dto.dayType },
    rooms,
    transport,
    ferry,
    subtotal,
    profitMarginPercent: isAdmin ? profitMarginPercent : 0,
    marginAmount: isAdmin ? marginAmount : 0,
    grandTotal,
    perPerson,
    discountSubtotal: isAdmin ? discountSubtotal : null,
    discountGrandTotal: isAdmin ? discountGrandTotal : null,
    discountPerPerson: isAdmin ? discountPerPerson : null,
  };
}
