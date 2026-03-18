export interface ComboCalculateRequest {
  marketSlug: string;
  propertySlug?: string;
  numAdults: number;
  numChildrenUnder10: number;
  numChildrenUnder5: number;
  numNights: number;
  dayType: string; // weekday, friday, saturday, holiday
  transportClass?: string; // cabin, limousine, sleeper
  ferryClass?: string; // speed_boat, small_boat (null = no ferry)
  profitMarginOverride?: number;
}

export interface ComboCalculationResult {
  input: { numPeople: number; numNights: number; dayType: string };
  rooms: ComboRoomAllocation[];
  transport: ComboTransportLine | null;
  ferry: ComboTransportLine | null;
  subtotal: number;
  profitMarginPercent: number;
  marginAmount: number;
  grandTotal: number;
  perPerson: number;
  discountSubtotal: number | null;
  discountGrandTotal: number | null;
  discountPerPerson: number | null;
}

export interface ComboRoomAllocation {
  propertyName: string;
  roomType: string;
  roomCode: string | null;
  quantity: number;
  guestsPerRoom: number;
  pricePerRoom: number;
  discountPricePerRoom: number | null;
  totalRoomCost: number;
  totalDiscountCost: number | null;
}

export interface ComboTransportLine {
  providerName: string;
  vehicleClass: string;
  seatType: string;
  pricePerPerson: number;
  discountPerPerson: number | null;
  totalPeople: number;
  childFreeCount: number;
  childDiscountCount: number;
  totalCost: number;
  totalDiscountCost: number | null;
}
