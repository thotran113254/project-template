export const diningPricingConfigsSeedData = [
  {
    ruleName: "Lẩu (Hotpot)",
    ruleType: "dining_service",
    config: {
      serviceType: "hotpot",
      pricePerPerson: { min: 200000, max: 250000 },
      minPeople: 2,
      notes: "Giá/người, tối thiểu 2 người",
    },
    description: "Dịch vụ lẩu tại khách sạn",
    isActive: true,
    aiVisible: true,
  },
  {
    ruleName: "BBQ nướng",
    ruleType: "dining_service",
    config: {
      serviceType: "bbq",
      pricePerPerson: { min: 250000, max: 300000 },
      minPeople: 4,
      notes: "Giá/người, tối thiểu 4 người",
    },
    description: "Dịch vụ nướng BBQ tại khách sạn",
    isActive: true,
    aiVisible: true,
  },
  {
    ruleName: "Set menu",
    ruleType: "dining_service",
    config: {
      serviceType: "set_menu",
      pricePerPerson: { min: 200000, max: 500000 },
      priceOptions: [200000, 300000, 400000, 500000],
      minPeople: 8,
      notes: "Giá/người, tối thiểu 8 người, giá tùy menu chọn",
    },
    description: "Dịch vụ ăn thực đơn theo set tại khách sạn",
    isActive: true,
    aiVisible: true,
  },
  {
    ruleName: "Biên lợi nhuận combo mặc định",
    ruleType: "profit_margin",
    config: {
      defaultPercent: 15,
      description: "Áp dụng cho tất cả combo trừ khi có override",
    },
    description: "Biên lợi nhuận mặc định áp dụng cho combo",
    isActive: true,
    aiVisible: true,
  },
];
