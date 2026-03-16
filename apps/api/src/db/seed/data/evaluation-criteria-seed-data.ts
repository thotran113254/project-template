export type EvaluationCriterion = {
  category: string;
  subcategory: string | null;
  criteriaName: string;
  sortOrder: number;
};

// Global criteria (no marketId) — apply to all properties
export const evaluationCriteriaData: EvaluationCriterion[] = [
  // Vị trí
  { category: "Vị trí", subcategory: null, criteriaName: "Khoảng cách đến biển", sortOrder: 1 },
  { category: "Vị trí", subcategory: null, criteriaName: "Khoảng cách đến trung tâm", sortOrder: 2 },
  { category: "Vị trí", subcategory: null, criteriaName: "Khoảng cách đến cảng/bến tàu", sortOrder: 3 },

  // CSVC - Phòng ngủ
  { category: "CSVC", subcategory: "Phòng ngủ", criteriaName: "Diện tích phòng", sortOrder: 4 },
  { category: "CSVC", subcategory: "Phòng ngủ", criteriaName: "View từ phòng", sortOrder: 5 },
  { category: "CSVC", subcategory: "Phòng ngủ", criteriaName: "Loại giường", sortOrder: 6 },
  { category: "CSVC", subcategory: "Phòng ngủ", criteriaName: "Điều hòa nhiệt độ", sortOrder: 7 },
  { category: "CSVC", subcategory: "Phòng ngủ", criteriaName: "Wifi tốc độ", sortOrder: 8 },

  // CSVC - Nhà vệ sinh
  { category: "CSVC", subcategory: "Nhà vệ sinh", criteriaName: "WC riêng hay chung", sortOrder: 9 },
  { category: "CSVC", subcategory: "Nhà vệ sinh", criteriaName: "Nước nóng lạnh", sortOrder: 10 },
  { category: "CSVC", subcategory: "Nhà vệ sinh", criteriaName: "Vệ sinh sạch sẽ", sortOrder: 11 },

  // Dịch vụ
  { category: "Dịch vụ", subcategory: null, criteriaName: "Bữa sáng", sortOrder: 12 },
  { category: "Dịch vụ", subcategory: null, criteriaName: "Cho thuê xe máy/xe đạp", sortOrder: 13 },
  { category: "Dịch vụ", subcategory: null, criteriaName: "Hỗ trợ đặt tour", sortOrder: 14 },
  { category: "Dịch vụ", subcategory: null, criteriaName: "Check-in/Check-out linh hoạt", sortOrder: 15 },

  // View
  { category: "View", subcategory: null, criteriaName: "View biển/vịnh", sortOrder: 16 },
  { category: "View", subcategory: null, criteriaName: "View từ sân thượng/ban công", sortOrder: 17 },
];
