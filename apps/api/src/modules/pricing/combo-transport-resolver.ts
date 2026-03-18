import { eq, and } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { transportProviders, transportPricing } from "../../db/schema/index.js";
import type { ComboTransportLine } from "@app/shared";

/** Resolve transport/ferry pricing for combo calculation */
export async function resolveTransportLine(
  marketId: string,
  category: string,
  vehicleClass: string | undefined,
  numAdults: number,
  numChildrenUnder10: number,
  numChildrenUnder5: number,
  isAdmin: boolean,
): Promise<ComboTransportLine | null> {
  if (!vehicleClass) return null;

  const providers = await db
    .select()
    .from(transportProviders)
    .where(
      and(
        eq(transportProviders.marketId, marketId),
        eq(transportProviders.transportCategory, category),
        eq(transportProviders.aiVisible, true),
      ),
    )
    .limit(1);

  if (!providers.length) return null;
  const provider = providers[0]!;

  const pricingRows = await db
    .select()
    .from(transportPricing)
    .where(
      and(
        eq(transportPricing.providerId, provider.id),
        eq(transportPricing.vehicleClass, vehicleClass),
        eq(transportPricing.aiVisible, true),
      ),
    )
    .limit(1);

  if (!pricingRows.length) return null;
  const tp = pricingRows[0]!;

  const basePrice = tp.roundtripListedPrice ?? tp.onewayListedPrice;
  const baseDiscount = tp.roundtripDiscountPrice ?? tp.onewayDiscountPrice ?? null;
  const discountAmt = tp.childDiscountAmount ?? 0;

  const childFreeCount = numChildrenUnder5;
  const childDiscountCount = numChildrenUnder10;
  const totalPeople = numAdults + numChildrenUnder10 + numChildrenUnder5;

  const adultCost = numAdults * basePrice;
  const childDiscountCost = childDiscountCount * Math.max(0, basePrice - discountAmt);
  const totalCost = adultCost + childDiscountCost;

  let totalDiscountCost: number | null = null;
  if (isAdmin && baseDiscount !== null) {
    const adultDiscountCost = numAdults * baseDiscount;
    const childDiscountCostAdj = childDiscountCount * Math.max(0, baseDiscount - discountAmt);
    totalDiscountCost = adultDiscountCost + childDiscountCostAdj;
  }

  return {
    providerName: provider.providerName,
    vehicleClass: tp.vehicleClass,
    seatType: tp.seatType,
    pricePerPerson: basePrice,
    discountPerPerson: isAdmin ? baseDiscount : null,
    totalPeople,
    childFreeCount,
    childDiscountCount,
    totalCost,
    totalDiscountCost: isAdmin ? totalDiscountCost : null,
  };
}
