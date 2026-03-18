export type TransportPricingSeed = {
  vehicleClass: string;
  seatType: string;
  capacityPerUnit: number;
  onewayListedPrice: number;
  onewayDiscountPrice: number;
  roundtripListedPrice: number;
  roundtripDiscountPrice: number;
  childFreeUnder?: number;
  childDiscountUnder?: number;
  childDiscountAmount?: number;
  onboardServices?: string;
  crossProvinceSurcharges?: Array<{ province: string; surcharge: number }>;
  sortOrder: number;
};

// Keyed by provider code
export const transportPricingSeedData: Record<string, TransportPricingSeed[]> = {
  "HG": [
    {
      vehicleClass: "cabin", seatType: "single", capacityPerUnit: 1,
      onewayListedPrice: 400000, onewayDiscountPrice: 350000,
      roundtripListedPrice: 800000, roundtripDiscountPrice: 700000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      crossProvinceSurcharges: [
        { province: "Quảng Ninh", surcharge: 200000 },
        { province: "Ninh Bình", surcharge: 300000 },
      ],
      sortOrder: 1,
    },
    {
      vehicleClass: "cabin", seatType: "double", capacityPerUnit: 2,
      onewayListedPrice: 600000, onewayDiscountPrice: 500000,
      roundtripListedPrice: 1200000, roundtripDiscountPrice: 1000000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      crossProvinceSurcharges: [
        { province: "Quảng Ninh", surcharge: 200000 },
        { province: "Ninh Bình", surcharge: 300000 },
      ],
      sortOrder: 2,
    },
    {
      vehicleClass: "limousine", seatType: "front", capacityPerUnit: 1,
      onewayListedPrice: 200000, onewayDiscountPrice: 180000,
      roundtripListedPrice: 400000, roundtripDiscountPrice: 360000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 3,
    },
    {
      vehicleClass: "limousine", seatType: "middle", capacityPerUnit: 1,
      onewayListedPrice: 250000, onewayDiscountPrice: 220000,
      roundtripListedPrice: 500000, roundtripDiscountPrice: 440000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 4,
    },
    {
      vehicleClass: "limousine", seatType: "back", capacityPerUnit: 1,
      onewayListedPrice: 200000, onewayDiscountPrice: 180000,
      roundtripListedPrice: 400000, roundtripDiscountPrice: 360000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 5,
    },
    {
      vehicleClass: "sleeper", seatType: "single", capacityPerUnit: 1,
      onewayListedPrice: 300000, onewayDiscountPrice: 270000,
      roundtripListedPrice: 600000, roundtripDiscountPrice: 540000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 6,
    },
  ],
  "NH": [
    {
      vehicleClass: "limousine", seatType: "standard", capacityPerUnit: 1,
      onewayListedPrice: 220000, onewayDiscountPrice: 200000,
      roundtripListedPrice: 440000, roundtripDiscountPrice: 400000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 1,
    },
  ],
  "NV": [
    {
      vehicleClass: "small_boat", seatType: "standard", capacityPerUnit: 1,
      onewayListedPrice: 200000, onewayDiscountPrice: 180000,
      roundtripListedPrice: 400000, roundtripDiscountPrice: 360000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      sortOrder: 1,
    },
    {
      vehicleClass: "speed_boat", seatType: "vip", capacityPerUnit: 1,
      onewayListedPrice: 200000, onewayDiscountPrice: 180000,
      roundtripListedPrice: 400000, roundtripDiscountPrice: 360000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      onboardServices: "Nước lọc, đồ ăn nhẹ",
      sortOrder: 2,
    },
    {
      vehicleClass: "speed_boat", seatType: "standard", capacityPerUnit: 1,
      onewayListedPrice: 250000, onewayDiscountPrice: 220000,
      roundtripListedPrice: 500000, roundtripDiscountPrice: 440000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      onboardServices: "Nước lọc, đồ ăn nhẹ",
      sortOrder: 3,
    },
    {
      vehicleClass: "speed_boat", seatType: "sleeper", capacityPerUnit: 1,
      onewayListedPrice: 200000, onewayDiscountPrice: 180000,
      roundtripListedPrice: 400000, roundtripDiscountPrice: 360000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      onboardServices: "Nước lọc, đồ ăn nhẹ",
      sortOrder: 4,
    },
  ],
  "MQ": [
    {
      vehicleClass: "speed_boat", seatType: "standard", capacityPerUnit: 1,
      onewayListedPrice: 220000, onewayDiscountPrice: 200000,
      roundtripListedPrice: 440000, roundtripDiscountPrice: 400000,
      childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
      onboardServices: "Nước lọc",
      sortOrder: 1,
    },
  ],
};
