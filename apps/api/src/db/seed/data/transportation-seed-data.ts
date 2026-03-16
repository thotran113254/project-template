export type Transportation = {
  routeSegment: string;
  transportType: string;
  departurePoints: string;
  arrivalPoints: string;
  duration: string;
  costInfo: string;
  convenienceNotes: string;
  packageIntegration: string;
  suitableFor: string;
  notes: string;
  sortOrder: number;
};

export const transportationData: Record<string, Transportation[]> = {
  "phu-quy": [
    {
      routeSegment: "TP.HCM → Phan Thiết",
      transportType: "bus",
      departurePoints: "Bến xe Miền Đông, các điểm đón dọc đường",
      arrivalPoints: "Bến xe Phan Thiết, trung tâm thành phố",
      duration: "3–4 tiếng",
      costInfo: "Xe khách thường: 80–120k. Limousine: 150–200k",
      convenienceNotes: "Nhiều chuyến mỗi ngày, đặt trước qua app hoặc số hotline",
      packageIntegration: "Có thể kết hợp vào gói tour đón–trả tại TP.HCM",
      suitableFor: "Tất cả đối tượng",
      notes: "Nên đến Phan Thiết tối hôm trước để kịp tàu sáng sớm",
      sortOrder: 1,
    },
    {
      routeSegment: "Phan Thiết → Phú Quý",
      transportType: "ferry",
      departurePoints: "Bến tàu Phan Thiết (cảng Phan Thiết)",
      arrivalPoints: "Cảng Phú Quý (xã Tam Thanh)",
      duration: "2.5–3.5 tiếng (tàu cao tốc)",
      costInfo: "Vé ghế: 180–220k. Vé nằm: 250–300k. Giá có thể tăng mùa cao điểm",
      convenienceNotes: "Lịch tàu: 7:00 và 13:00. Đặt vé trước 1–3 ngày mùa cao điểm",
      packageIntegration: "Homestay thường hỗ trợ đặt vé tàu cho khách",
      suitableFor: "Tất cả đối tượng, lưu ý say sóng",
      notes: "Mùa gió tháng 9–2 có thể bị hủy chuyến. Nên mua vé 2 chiều sớm",
      sortOrder: 2,
    },
    {
      routeSegment: "Di chuyển trong đảo Phú Quý",
      transportType: "motorbike",
      departurePoints: "Cảng Phú Quý / Homestay",
      arrivalPoints: "Các điểm tham quan trên đảo",
      duration: "5–30 phút tùy điểm",
      costInfo: "Thuê xe máy số: 100–150k/ngày. Xe tay ga: 150–200k/ngày",
      convenienceNotes: "Thuê tại homestay hoặc các cửa hàng gần cảng, cần CMND/CCCD",
      packageIntegration: "Nhiều homestay miễn phí xe đạp hoặc giảm giá xe máy",
      suitableFor: "Người có bằng lái, thích tự do",
      notes: "Đường đảo nhỏ, không cần bản đồ phức tạp, cảnh đẹp dọc đường",
      sortOrder: 3,
    },
  ],
  "cat-ba": [
    {
      routeSegment: "Hà Nội → Hải Phòng",
      transportType: "bus",
      departurePoints: "Bến xe Giáp Bát, Mỹ Đình, Lương Yên (HN)",
      arrivalPoints: "Bến xe Cầu Rào, bến phà Bến Bính (HP)",
      duration: "2–2.5 tiếng",
      costInfo: "Xe khách: 100–150k. Limousine: 160–220k",
      convenienceNotes: "Limousine đưa thẳng đến bến phà tiện hơn, nhiều chuyến 5:00–18:00",
      packageIntegration: "Tour từ HN thường bao gồm xe đưa đón đến bến phà",
      suitableFor: "Tất cả đối tượng",
      notes: "Nên chọn limousine đến bến phà Bến Bính để tiết kiệm thời gian",
      sortOrder: 1,
    },
    {
      routeSegment: "Hải Phòng → Cát Bà",
      transportType: "ferry",
      departurePoints: "Bến phà Bến Bính (HP) hoặc Tuần Châu (Quảng Ninh)",
      arrivalPoints: "Cảng Cát Bà (Bến Gót) hoặc Phù Long",
      duration: "45 phút (Bến Bính) hoặc 35 phút (Tuần Châu)",
      costInfo: "Phà Bến Bính: 80–120k/người + xe máy. Tàu Tuần Châu: 150–200k",
      convenienceNotes: "Phà Bến Bính đông, lịch chạy 6:00–18:00 mỗi 1–2 tiếng",
      packageIntegration: "Tour từ HN thường dùng tuyến Tuần Châu nhanh hơn",
      suitableFor: "Tất cả đối tượng",
      notes: "Nếu có xe máy dùng phà Bến Bính. Nếu đi bộ dùng tàu Tuần Châu tiện hơn",
      sortOrder: 2,
    },
    {
      routeSegment: "Di chuyển trong đảo Cát Bà",
      transportType: "motorbike",
      departurePoints: "Trung tâm thị trấn Cát Bà",
      arrivalPoints: "VQG, bãi biển, Bến Bèo, các điểm tham quan",
      duration: "5–40 phút tùy điểm",
      costInfo: "Thuê xe máy: 120–180k/ngày. Xe đạp điện: 80–120k/ngày",
      convenienceNotes: "Nhiều điểm cho thuê tại bến tàu và dọc phố chính",
      packageIntegration: "Một số homestay có xe đạp miễn phí hoặc hỗ trợ thuê xe",
      suitableFor: "Người biết lái xe",
      notes: "Đường vào VQG dốc, nên dùng xe máy. Quanh thị trấn đi xe đạp được",
      sortOrder: 3,
    },
  ],
};
