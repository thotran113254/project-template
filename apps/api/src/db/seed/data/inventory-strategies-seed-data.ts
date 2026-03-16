export type InventoryStrategy = {
  monthRange: string;
  seasonName: string;
  demandLevel: string;
  priceVariation: string;
  holdingType: string;
  targetSegment: string;
  applicablePeriods: string;
  notes: string;
  sortOrder: number;
};

export const inventoryStrategiesData: Record<string, InventoryStrategy[]> = {
  "phu-quy": [
    {
      monthRange: "3–8",
      seasonName: "Mùa cao điểm",
      demandLevel: "high",
      priceVariation: "Tăng 20–40% so với giá cơ bản",
      holdingType: "hard",
      targetSegment: "Cặp đôi, nhóm bạn, gia đình",
      applicablePeriods: "Tháng 4–5 (lễ 30/4–1/5), tháng 6–8 (hè học sinh)",
      notes: "Hold phòng trước 2–4 tuần. Yêu cầu cọc 30–50% khi đặt. Không hoàn hủy trong 72h",
      sortOrder: 1,
    },
    {
      monthRange: "9–2",
      seasonName: "Mùa thấp điểm",
      demandLevel: "low",
      priceVariation: "Giảm 10–20% so với giá cơ bản, ưu đãi đặt sớm",
      holdingType: "none",
      targetSegment: "Khách ưa hoang sơ, nhiếp ảnh gia, du lịch ít đông",
      applicablePeriods: "Tháng 9–11 (gió chướng), tháng 12–2 (mùa đông)",
      notes: "Không hold, nhận đặt linh hoạt. Chú ý thông báo rủi ro sóng lớn cho khách",
      sortOrder: 2,
    },
    {
      monthRange: "4–5,9",
      seasonName: "Dịp lễ đặc biệt",
      demandLevel: "peak",
      priceVariation: "Tăng 40–60%, áp dụng giá lễ Tết/30-4/1-5",
      holdingType: "hard",
      targetSegment: "Tất cả phân khúc",
      applicablePeriods: "Lễ 30/4–1/5, Tết Dương Lịch, Tết Âm Lịch (nếu thời tiết đẹp)",
      notes: "Hold toàn bộ phòng ít nhất 1 tháng trước. Yêu cầu cọc 50%, không hoàn hủy",
      sortOrder: 3,
    },
  ],
  "cat-ba": [
    {
      monthRange: "5–9",
      seasonName: "Mùa hè cao điểm",
      demandLevel: "high",
      priceVariation: "Tăng 30–50% so với giá cơ bản",
      holdingType: "hard",
      targetSegment: "Gia đình, nhóm bạn, cặp đôi",
      applicablePeriods: "Tháng 6–8 (hè học sinh), tháng 5 và 9 trung bình",
      notes: "Hold phòng trước 3–6 tuần. Ưu tiên đặt dài ngày. Cọc 50% khi đặt phòng",
      sortOrder: 1,
    },
    {
      monthRange: "11–3",
      seasonName: "Mùa đông thấp điểm",
      demandLevel: "low",
      priceVariation: "Giảm 25–35%, ưu đãi gói dài ngày",
      holdingType: "none",
      targetSegment: "Khách thích yên tĩnh, du lịch khám phá thiên nhiên, photographer",
      applicablePeriods: "Tháng 11–3, đặc biệt tháng 12–2 lạnh và sương mù",
      notes: "Không hold, nhận đặt linh hoạt. Tập trung marketing VQG, trekking off-peak",
      sortOrder: 2,
    },
    {
      monthRange: "4,10",
      seasonName: "Mùa trung gian",
      demandLevel: "medium",
      priceVariation: "Giá cơ bản, ưu đãi nhẹ cuối tuần",
      holdingType: "soft",
      targetSegment: "Cặp đôi, nhóm bạn nhỏ",
      applicablePeriods: "Tháng 4 (trước hè) và tháng 10 (sau hè)",
      notes: "Hold nhẹ 3–7 ngày trước, chính sách hủy linh hoạt 24h miễn phí",
      sortOrder: 3,
    },
  ],
};
