export type TargetCustomer = {
  segmentName: string;
  ageRange: string;
  gender: string;
  occupation: string;
  incomeRange: string;
  location: string;
  travelMotivation: string;
  bookingHabits: string;
  stayDuration: string;
  travelFrequency: string;
  primaryChannels: string;
  contentInterests: string;
  painPoints: string;
  preferences: string;
  trustFactors: string;
  decisionFactors: string;
  sortOrder: number;
};

export const targetCustomersData: Record<string, TargetCustomer[]> = {
  "phu-quy": [
    {
      segmentName: "Cặp đôi",
      ageRange: "22–30",
      gender: "Cả hai giới",
      occupation: "Nhân viên văn phòng, freelancer",
      incomeRange: "10–20 triệu/tháng",
      location: "TP.HCM, Bình Dương, Đồng Nai",
      travelMotivation: "Thoát khỏi thành phố, trải nghiệm đảo hoang sơ, lãng mạn",
      bookingHabits: "Đặt qua Zalo/Facebook, thích nhắn tin hỏi trực tiếp, đặt trước 1–2 tuần",
      stayDuration: "3N2Đ",
      travelFrequency: "2–3 lần/năm",
      primaryChannels: "TikTok, Instagram, Facebook group du lịch",
      contentInterests: "Ảnh biển đẹp, video lặn san hô, review homestay lãng mạn",
      painPoints: "Lo tàu say sóng, thiếu thông tin rõ ràng về dịch vụ, giá phòng không minh bạch",
      preferences: "Phòng có view biển, không gian riêng tư, chủ nhà thân thiện",
      trustFactors: "Review từ cặp đôi đã đi, hình ảnh thực tế, phản hồi nhanh",
      decisionFactors: "Giá tổng hợp lý, phòng đẹp, dịch vụ tốt",
      sortOrder: 1,
    },
    {
      segmentName: "Nhóm bạn",
      ageRange: "20–28",
      gender: "Cả hai giới",
      occupation: "Sinh viên, nhân viên mới đi làm",
      incomeRange: "5–15 triệu/tháng",
      location: "TP.HCM, Hà Nội, các tỉnh miền Nam",
      travelMotivation: "Trải nghiệm phiêu lưu, câu cá, lặn biển, tụ họp nhóm",
      bookingHabits: "Tìm deal giá rẻ, thích đặt phòng ghép, quyết định nhanh",
      stayDuration: "2N1Đ hoặc 3N2Đ",
      travelFrequency: "3–4 lần/năm",
      primaryChannels: "TikTok, Facebook group, hỏi bạn bè",
      contentInterests: "Video vui nhộn, hải sản rẻ, hoạt động nhóm",
      painPoints: "Hạn chế ngân sách, cần phòng nhiều người, khó tổ chức",
      preferences: "Giá tốt, phòng 3–4 người, gần biển, dễ thuê xe",
      trustFactors: "Bạn bè đã đi review, giá rõ ràng",
      decisionFactors: "Giá/người hợp lý, nhiều hoạt động, dễ tổ chức",
      sortOrder: 2,
    },
    {
      segmentName: "Gia đình",
      ageRange: "30–45",
      gender: "Cả hai giới",
      occupation: "Kinh doanh, quản lý, công chức",
      incomeRange: "20–50 triệu/tháng",
      location: "TP.HCM, Bình Dương, Vũng Tàu",
      travelMotivation: "Nghỉ ngơi cùng con cái, khám phá đảo yên tĩnh",
      bookingHabits: "Đặt trước 1–2 tháng, ưu tiên an toàn và tiện nghi",
      stayDuration: "3N2Đ",
      travelFrequency: "1–2 lần/năm",
      primaryChannels: "Facebook, Zalo, Google tìm kiếm",
      contentInterests: "Review gia đình, an toàn cho trẻ, dịch vụ đầy đủ",
      painPoints: "Lo an toàn trên tàu cho trẻ, thiếu tiện nghi cơ bản",
      preferences: "Phòng rộng, có bữa sáng, gần bãi tắm an toàn",
      trustFactors: "Review gia đình khác, hình ảnh thực tế, chính sách rõ ràng",
      decisionFactors: "An toàn, tiện nghi, giá trị tương xứng",
      sortOrder: 3,
    },
  ],
  "cat-ba": [
    {
      segmentName: "Cặp đôi",
      ageRange: "22–30",
      gender: "Cả hai giới",
      occupation: "Nhân viên văn phòng, designer, content creator",
      incomeRange: "10–25 triệu/tháng",
      location: "Hà Nội, Hải Phòng, các tỉnh miền Bắc",
      travelMotivation: "Nghỉ dưỡng cuối tuần, khám phá vịnh, chụp ảnh check-in",
      bookingHabits: "Đặt qua Booking/Agoda hoặc Facebook, đặt trước 1–3 tuần",
      stayDuration: "2N1Đ",
      travelFrequency: "3–5 lần/năm",
      primaryChannels: "Instagram, TikTok, Booking.com",
      contentInterests: "Ảnh vịnh Lan Hạ, sunset view, review phòng đẹp",
      painPoints: "Giá cao mùa hè, phòng view vịnh đắt, tắc đường mùa lễ",
      preferences: "Phòng view vịnh/biển, bữa sáng included, không gian yên tĩnh",
      trustFactors: "Review trên Booking, hình ảnh thực tế, điểm đánh giá cao",
      decisionFactors: "View phòng, giá hợp lý, vị trí gần bãi biển",
      sortOrder: 1,
    },
    {
      segmentName: "Nhóm bạn",
      ageRange: "20–28",
      gender: "Cả hai giới",
      occupation: "Sinh viên, nhân viên trẻ",
      incomeRange: "5–15 triệu/tháng",
      location: "Hà Nội, các trường đại học lớn",
      travelMotivation: "Phiêu lưu kayak, khám phá VQG, hải sản, tụ tập hè",
      bookingHabits: "Tìm deal nhóm, đặt homestay rẻ, quyết định nhanh cuối tuần",
      stayDuration: "2N1Đ hoặc 3N2Đ",
      travelFrequency: "4–6 lần/năm",
      primaryChannels: "TikTok, Facebook group sinh viên, Zalo",
      contentInterests: "Video kayak, ăn hải sản rẻ, phiêu lưu VQG",
      painPoints: "Ngân sách hạn chế, đặt phòng nhóm khó, xe khách hết vé",
      preferences: "Giá/người dưới 500k, gần bãi biển, có thể tổ chức BBQ",
      trustFactors: "Bạn bè đã đi, group review, hình ảnh thực tế",
      decisionFactors: "Giá tổng, hoạt động phong phú, dễ di chuyển",
      sortOrder: 2,
    },
    {
      segmentName: "Gia đình",
      ageRange: "30–45",
      gender: "Cả hai giới",
      occupation: "Kinh doanh, giáo viên, công chức",
      incomeRange: "15–40 triệu/tháng",
      location: "Hà Nội, Hải Phòng, Quảng Ninh",
      travelMotivation: "Nghỉ hè cùng gia đình, cho con trải nghiệm thiên nhiên",
      bookingHabits: "Đặt trước 1–2 tháng vào mùa hè, ưu tiên resort có hồ bơi",
      stayDuration: "3N2Đ",
      travelFrequency: "1–2 lần/năm",
      primaryChannels: "Google, Facebook, Booking.com, hỏi bạn bè",
      contentInterests: "Resort gia đình, VQG trẻ em, bãi tắm an toàn",
      painPoints: "Giá resort cao mùa hè, đông đúc, khó đặt phòng liền kề",
      preferences: "Resort có hồ bơi, bãi biển an toàn, bữa sáng buffet",
      trustFactors: "Review gia đình, chứng nhận an toàn, thương hiệu uy tín",
      decisionFactors: "An toàn cho trẻ, tiện nghi đầy đủ, vui chơi đa dạng",
      sortOrder: 3,
    },
  ],
};
