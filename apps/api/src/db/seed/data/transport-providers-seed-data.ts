export type TransportProviderSeed = {
  providerName: string;
  providerCode: string;
  transportCategory: "bus" | "ferry";
  routeName: string;
  contactInfo?: Record<string, string>;
  pickupPoints?: Array<{ name: string; time: string }>;
  notes?: string;
  sortOrder: number;
};

export const transportProvidersSeedData: Record<string, TransportProviderSeed[]> = {
  "cat-ba": [
    {
      providerName: "Nhà xe Hải Giang",
      providerCode: "HG",
      transportCategory: "bus",
      routeName: "Hà Nội <-> Cát Bà",
      pickupPoints: [
        { name: "Bến xe Mỹ Đình", time: "6h00" },
        { name: "Bến xe Giáp Bát", time: "6h30" },
        { name: "Bến xe Gia Lâm", time: "7h00" },
      ],
      notes: "Hỗ trợ đón liên tỉnh từ Quảng Ninh, Ninh Bình",
      sortOrder: 1,
    },
    {
      providerName: "Nhà xe Nguyên Hằng",
      providerCode: "NH",
      transportCategory: "bus",
      routeName: "Hà Nội <-> Cát Bà",
      pickupPoints: [
        { name: "Bến xe Mỹ Đình", time: "7h00" },
        { name: "Đối diện ĐH Bách Khoa", time: "7h30" },
      ],
      sortOrder: 2,
    },
    {
      providerName: "Nhà tàu Nguyên Việt",
      providerCode: "NV",
      transportCategory: "ferry",
      routeName: "Cảng Ao Tiên -> Đảo Cát Bà",
      notes: "Thường kết hợp trong combo du lịch biển đảo",
      sortOrder: 3,
    },
    {
      providerName: "Nhà tàu Minh Quang",
      providerCode: "MQ",
      transportCategory: "ferry",
      routeName: "Cảng Ao Tiên -> Đảo Cát Bà",
      sortOrder: 4,
    },
  ],
};
