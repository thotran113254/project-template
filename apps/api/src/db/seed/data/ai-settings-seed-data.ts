export type AiDataSetting = {
  dataCategory: string;
  isEnabled: boolean;
  description: string;
};

export const aiSettingsData: AiDataSetting[] = [
  {
    dataCategory: "market",
    isEnabled: true,
    description: "Thông tin tổng quan về thị trường du lịch (địa lý, mùa vụ, thời tiết, highlights)",
  },
  {
    dataCategory: "property",
    isEnabled: true,
    description: "Thông tin cơ sở lưu trú (homestay, khách sạn, tiện nghi, liên hệ)",
  },
  {
    dataCategory: "pricing",
    isEnabled: true,
    description: "Bảng giá phòng theo combo, ngày trong tuần và mùa",
  },
  {
    dataCategory: "itinerary",
    isEnabled: true,
    description: "Lịch trình mẫu theo số ngày và chủ đề chuyến đi",
  },
  {
    dataCategory: "competitor",
    isEnabled: true,
    description: "Phân tích đối thủ cạnh tranh theo nhóm và kênh marketing",
  },
  {
    dataCategory: "journey",
    isEnabled: true,
    description: "Hành trình khách hàng từ tìm hiểu đến sau chuyến đi",
  },
  {
    dataCategory: "target_customer",
    isEnabled: true,
    description: "Phân khúc khách hàng mục tiêu và đặc điểm hành vi",
  },
  {
    dataCategory: "attraction",
    isEnabled: true,
    description: "Điểm tham quan, hoạt động và trải nghiệm tại điểm đến",
  },
  {
    dataCategory: "dining",
    isEnabled: true,
    description: "Nhà hàng, quán ăn và đặc sản địa phương",
  },
  {
    dataCategory: "transportation",
    isEnabled: true,
    description: "Phương tiện di chuyển, lộ trình và chi phí vận chuyển",
  },
  {
    dataCategory: "inventory_strategy",
    isEnabled: true,
    description: "Chiến lược quản lý phòng theo mùa và mức cầu",
  },
  {
    dataCategory: "evaluation",
    isEnabled: true,
    description: "Tiêu chí đánh giá và dữ liệu so sánh cơ sở lưu trú",
  },
];
