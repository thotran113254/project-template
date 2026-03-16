export type JourneyStage = {
  stageOrder: number;
  stageName: string;
  customerActions: string;
  touchpoints: string;
  painpoints: string;
  customerInfoNeeds: string;
  businessTouchpoints: string;
};

export const customerJourneysData: Record<string, JourneyStage[]> = {
  "phu-quy": [
    {
      stageOrder: 1,
      stageName: "Tìm hiểu",
      customerActions: "Xem video TikTok/Reels về Phú Quý, tìm kiếm Google, hỏi group du lịch",
      touchpoints: "TikTok, Facebook group, Google search, YouTube",
      painpoints: "Thông tin rải rác, thiếu review chi tiết về homestay, lo ngại về tàu say sóng",
      customerInfoNeeds: "Chi phí tổng, mùa nào đẹp, đi tàu mấy tiếng, có gì chơi",
      businessTouchpoints: "Content TikTok/Reels, bài blog SEO, reply group Facebook",
    },
    {
      stageOrder: 2,
      stageName: "Đặt dịch vụ",
      customerActions: "Nhắn tin Zalo/Facebook hỏi phòng, xem giá, đặt cọc chuyển khoản",
      touchpoints: "Zalo, Facebook Messenger, điện thoại trực tiếp",
      painpoints: "Không có hệ thống đặt phòng online, lo không có phòng mùa cao điểm",
      customerInfoNeeds: "Giá phòng cụ thể, chính sách hủy, bao gồm những gì",
      businessTouchpoints: "Zalo OA, báo giá nhanh, xác nhận đặt phòng rõ ràng",
    },
    {
      stageOrder: 3,
      stageName: "Di chuyển",
      customerActions: "Đặt vé tàu cao tốc Phan Thiết–Phú Quý, chuẩn bị hành lý, ra bến tàu",
      touchpoints: "Website/cổng vé tàu, hướng dẫn của homestay",
      painpoints: "Vé tàu hết chỗ, tàu bị hủy do sóng lớn, không biết bến tàu",
      customerInfoNeeds: "Lịch tàu, số điện thoại đặt vé, cách di chuyển đến bến tàu Phan Thiết",
      businessTouchpoints: "Gửi link đặt vé tàu, thông báo thời tiết, hướng dẫn di chuyển",
    },
    {
      stageOrder: 4,
      stageName: "Tại điểm đến",
      customerActions: "Check-in homestay, thuê xe máy, khám phá đảo tự do",
      touchpoints: "Nhân viên homestay, chủ xe cho thuê, người dân địa phương",
      painpoints: "Không biết chỗ ăn ngon, thiếu thông tin điểm tham quan, đường xá lạ",
      customerInfoNeeds: "Bản đồ đảo, quán ăn ngon, điểm lặn, lịch trình gợi ý",
      businessTouchpoints: "Cẩm nang du lịch tặng kèm, tư vấn trực tiếp tại homestay",
    },
    {
      stageOrder: 5,
      stageName: "Trải nghiệm",
      customerActions: "Lặn ngắm san hô, câu cá, tham quan Linh Sơn Tự, ăn hải sản",
      touchpoints: "Dịch vụ lặn biển, quán hải sản, điểm tham quan",
      painpoints: "Dịch vụ lặn biển chất lượng không đồng đều, thiếu hướng dẫn viên tin cậy",
      customerInfoNeeds: "Đơn vị lặn biển uy tín, giá hải sản, điểm câu cá tốt",
      businessTouchpoints: "Kết nối với đơn vị dịch vụ tin cậy, combo trải nghiệm",
    },
    {
      stageOrder: 6,
      stageName: "Sau chuyến đi",
      customerActions: "Đăng ảnh mạng xã hội, viết review, giới thiệu bạn bè",
      touchpoints: "Facebook, Instagram, TikTok, Google Maps review",
      painpoints: "Không có nơi để lại đánh giá cho homestay nhỏ",
      customerInfoNeeds: "Thông tin để giới thiệu cho người khác",
      businessTouchpoints: "Xin review sau chuyến đi, chương trình giới thiệu bạn bè",
    },
  ],
  "cat-ba": [
    {
      stageOrder: 1,
      stageName: "Tìm hiểu",
      customerActions: "Google 'tour Cát Bà', xem review trên Facebook group, hỏi bạn bè",
      touchpoints: "Google, Facebook group du lịch, Tiktok, blog travel",
      painpoints: "Quá nhiều lựa chọn tour, khó so sánh giá và chất lượng",
      customerInfoNeeds: "Nên đi tự túc hay tour, mùa nào đẹp, chi phí dự kiến",
      businessTouchpoints: "Blog SEO, content so sánh tour vs tự túc, video review",
    },
    {
      stageOrder: 2,
      stageName: "Đặt dịch vụ",
      customerActions: "Đặt phòng trên Booking/Agoda hoặc nhắn tin trực tiếp, mua vé xe limousine",
      touchpoints: "Booking.com, Agoda, Facebook Messenger, Zalo",
      painpoints: "Giá phòng cao mùa hè, phòng hết sớm, khó chọn vị trí tốt",
      customerInfoNeeds: "Phòng gần bãi biển, chính sách hủy linh hoạt, bao gồm bữa sáng không",
      businessTouchpoints: "Hệ thống đặt phòng online, ưu đãi đặt sớm, tư vấn qua chat",
    },
    {
      stageOrder: 3,
      stageName: "Di chuyển",
      customerActions: "Đặt vé limousine HN–HP, mua vé phà HP–Cát Bà, di chuyển trong đảo",
      touchpoints: "Website limousine, bến phà Bến Bính/Tuần Châu",
      painpoints: "Lịch phà phức tạp, thời gian di chuyển dài (5–6 tiếng từ HN)",
      customerInfoNeeds: "Lịch phà mới nhất, mua vé phà ở đâu, mất bao lâu",
      businessTouchpoints: "Hướng dẫn di chuyển chi tiết, đón từ bến phà",
    },
    {
      stageOrder: 4,
      stageName: "Tại điểm đến",
      customerActions: "Check-in, thuê xe máy/xe đạp, hỏi thông tin tại lễ tân",
      touchpoints: "Nhân viên lễ tân, bản đồ đảo, ứng dụng Google Maps",
      painpoints: "Đường trong đảo khó đi, nhiều điểm tham quan chưa có biển chỉ dẫn",
      customerInfoNeeds: "Lịch trình gợi ý, điểm kayak, nhà hàng hải sản ngon",
      businessTouchpoints: "Cẩm nang du lịch, gợi ý lịch trình theo ngày",
    },
    {
      stageOrder: 5,
      stageName: "Trải nghiệm",
      customerActions: "Kayak Vịnh Lan Hạ, tắm biển Cát Cò, trekking VQG Cát Bà, ăn hải sản",
      touchpoints: "Công ty kayak, bãi biển công cộng, VQG, nhà hàng hải sản",
      painpoints: "Tour kayak đông đúc, bãi biển chật mùa hè, giá hải sản không niêm yết",
      customerInfoNeeds: "Đơn vị kayak uy tín, giá vào VQG, lịch trình trekking",
      businessTouchpoints: "Đặt tour kayak qua homestay, combo ưu đãi",
    },
    {
      stageOrder: 6,
      stageName: "Sau chuyến đi",
      customerActions: "Đăng story, viết review Booking/Google, chia sẻ với cộng đồng",
      touchpoints: "Instagram, TikTok, Google Maps, Booking review",
      painpoints: "Quên để lại review vì không có nhắc nhở",
      customerInfoNeeds: "Thông tin liên hệ để đặt lại lần sau",
      businessTouchpoints: "Email/Zalo cảm ơn sau chuyến đi, xin review, giảm giá lần sau",
    },
  ],
};
