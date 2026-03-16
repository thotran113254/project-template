export type PricingConfig = {
  ruleName: string;
  ruleType: string;
  config: Record<string, unknown>;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

// Global pricing configs (no marketId/propertyId)
export const pricingConfigsData: PricingConfig[] = [
  {
    ruleName: "Chính sách trẻ em",
    ruleType: "child_policy",
    config: {
      ageRanges: [
        { label: "Trẻ dưới 3 tuổi", minAge: 0, maxAge: 2, chargeType: "free", note: "Miễn phí, không tính thêm" },
        { label: "Trẻ 3–6 tuổi", minAge: 3, maxAge: 6, chargeType: "percent", percent: 50, note: "50% giá người lớn, không cần thêm giường" },
        { label: "Trẻ 7–11 tuổi", minAge: 7, maxAge: 11, chargeType: "percent", percent: 75, note: "75% giá người lớn nếu dùng giường riêng" },
      ],
    },
    description: "Chính sách tính phí trẻ em theo độ tuổi cho tất cả cơ sở lưu trú",
    isActive: true,
    sortOrder: 1,
  },
  {
    ruleName: "Phụ thu khách thêm",
    ruleType: "extra_guest_surcharge",
    config: {
      baseGuests: 2,
      extraGuestFee: 200000,
      currency: "VND",
      unit: "per_person_per_night",
      maxExtraGuests: 2,
      note: "Áp dụng khi số khách vượt quá capacity cơ bản của phòng",
    },
    description: "Phụ thu 200,000 VND/người/đêm khi số khách vượt capacity tiêu chuẩn",
    isActive: true,
    sortOrder: 2,
  },
  {
    ruleName: "Giá vận chuyển Phan Thiết – Phú Quý",
    ruleType: "transport_pricing",
    config: {
      route: "Phan Thiết → Phú Quý",
      options: [
        { type: "seat", label: "Vé ghế tàu cao tốc", price: 200000, currency: "VND", unit: "per_person_one_way" },
        { type: "bunk", label: "Vé nằm tàu cao tốc", price: 280000, currency: "VND", unit: "per_person_one_way" },
        { type: "private_boat", label: "Thuê thuyền riêng", price: 1500000, currency: "VND", unit: "per_boat_one_way", minGroup: 4 },
      ],
      note: "Giá tham khảo, có thể thay đổi theo mùa và đơn vị tàu",
    },
    description: "Bảng giá vận chuyển tham khảo tuyến Phan Thiết – Phú Quý",
    isActive: true,
    sortOrder: 3,
  },
];
