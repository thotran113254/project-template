export type AiDataSetting = {
  dataCategory: string;
  isEnabled: boolean;
  creativityLevel: "strict" | "enhanced" | "creative";
  description: string;
};

export const aiSettingsData: AiDataSetting[] = [
  {
    dataCategory: "market",
    isEnabled: true,
    creativityLevel: "enhanced",
    description: "Thông tin tổng quan về thị trường du lịch (địa lý, mùa vụ, thời tiết, highlights)",
  },
  {
    dataCategory: "property",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Thông tin cơ sở lưu trú (homestay, khách sạn, tiện nghi, liên hệ)",
  },
  {
    dataCategory: "pricing",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Bảng giá phòng theo combo, ngày trong tuần và mùa",
  },
  {
    dataCategory: "itinerary",
    isEnabled: true,
    creativityLevel: "enhanced",
    description: "Lịch trình mẫu theo số ngày và chủ đề chuyến đi",
  },
  {
    dataCategory: "competitor",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Phân tích đối thủ cạnh tranh theo nhóm và kênh marketing",
  },
  {
    dataCategory: "journey",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Hành trình khách hàng từ tìm hiểu đến sau chuyến đi",
  },
  {
    dataCategory: "target_customer",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Phân khúc khách hàng mục tiêu và đặc điểm hành vi",
  },
  {
    dataCategory: "attraction",
    isEnabled: true,
    creativityLevel: "enhanced",
    description: "Điểm tham quan, hoạt động và trải nghiệm tại điểm đến",
  },
  {
    dataCategory: "dining",
    isEnabled: true,
    creativityLevel: "enhanced",
    description: "Nhà hàng, quán ăn và đặc sản địa phương",
  },
  {
    dataCategory: "transportation",
    isEnabled: true,
    creativityLevel: "enhanced",
    description: "Phương tiện di chuyển, lộ trình và chi phí vận chuyển",
  },
  {
    dataCategory: "inventory_strategy",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Chiến lược quản lý phòng theo mùa và mức cầu",
  },
  {
    dataCategory: "evaluation",
    isEnabled: true,
    creativityLevel: "strict",
    description: "Tiêu chí đánh giá và dữ liệu so sánh cơ sở lưu trú",
  },
];
