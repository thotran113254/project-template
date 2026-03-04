export interface PricingRule {
  id: string;
  hotelId: string | null;
  name: string;
  seasonStart: string | null;
  seasonEnd: string | null;
  multiplier: string;
  minNights: number;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePricingRuleDto = {
  hotelId?: string;
  name: string;
  seasonStart?: string;
  seasonEnd?: string;
  multiplier?: number;
  minNights?: number;
  adminNotes?: string;
};

export type UpdatePricingRuleDto = Partial<CreatePricingRuleDto>;

export interface PriceCalculation {
  basePrice: number;
  multiplier: number;
  nights: number;
  guests: number;
  totalPrice: number;
  breakdown: { label: string; amount: number }[];
}

export type CalculatePriceDto = {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};
