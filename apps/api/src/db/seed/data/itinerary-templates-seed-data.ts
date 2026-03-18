export type ItineraryTemplateItem = {
  dayNumber: number;
  timeOfDay: string;
  timeStart: string;
  timeEnd: string;
  activity: string;
  location: string;
  notes: string;
  sortOrder: number;
};

export type ItineraryTemplate = {
  title: string;
  durationDays: number;
  durationNights: number;
  theme: string;
  description: string;
  highlights: string[];
  items: ItineraryTemplateItem[];
};

export const itineraryTemplatesData: Record<string, ItineraryTemplate[]> = {
  "phu-quy": [
    {
      title: "Phú Quý 3N2Đ – Đảo Hoang Sơ",
      durationDays: 3,
      durationNights: 2,
      theme: "adventure",
      description: "Trải nghiệm đảo Phú Quý trọn vẹn: lặn san hô, khám phá làng chài, câu cá đêm và thưởng thức hải sản tươi sống",
      highlights: ["Lặn ngắm san hô Hòn Tranh", "Câu cá đêm với ngư dân", "Ngắm bình minh từ Linh Sơn Tự", "Hải sản tươi sống tại chỗ"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "07:00", timeEnd: "11:00", activity: "Khởi hành từ Phan Thiết, đi tàu cao tốc ra đảo", location: "Bến tàu Phan Thiết", notes: "Mang theo thuốc chống say sóng, đặt vé tàu trước", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "12:00", timeEnd: "14:00", activity: "Check-in homestay, ăn trưa hải sản", location: "Homestay, quán ăn gần cảng", notes: "Nghỉ ngơi sau chuyến tàu", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "15:00", timeEnd: "18:00", activity: "Thuê xe máy khám phá Bãi Nhỏ và Gành Hang", location: "Bãi Nhỏ, Gành Hang", notes: "Mang kem chống nắng, máy ảnh", sortOrder: 3 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "19:00", timeEnd: "22:00", activity: "Câu cá đêm cùng ngư dân địa phương", location: "Cảng Tam Thanh", notes: "Đặt qua homestay, chi phí ~200k/người", sortOrder: 4 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "05:30", timeEnd: "07:30", activity: "Lên Linh Sơn Tự ngắm bình minh và toàn cảnh đảo", location: "Linh Sơn Tự", notes: "Đi sớm để có góc chụp đẹp nhất", sortOrder: 5 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "08:30", timeEnd: "13:00", activity: "Thuê thuyền ra Hòn Tranh lặn ngắm san hô", location: "Hòn Tranh", notes: "Mang dụng cụ snorkeling hoặc thuê tại chỗ ~50k", sortOrder: 6 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "14:00", timeEnd: "17:00", activity: "Tham quan làng chài Tam Thanh, mua đặc sản", location: "Làng chài Tam Thanh", notes: "Mực một nắng, cá thu khô là đặc sản nên mua", sortOrder: 7 },
        { dayNumber: 2, timeOfDay: "evening", timeStart: "18:00", timeEnd: "21:00", activity: "Ăn tối hải sản tươi, thưởng thức không khí đảo ban đêm", location: "Nhà hàng Biển Xanh hoặc quán địa phương", notes: "Thử bạch tuộc xào và gỏi cá mai", sortOrder: 8 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "06:00", timeEnd: "09:00", activity: "Ăn sáng đặc sản, mua quà lưu niệm, chuẩn bị trở về", location: "Chợ Phú Quý, quán Cô Lan", notes: "Check-out trước 11h, gửi hành lý tại homestay", sortOrder: 9 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "10:00", timeEnd: "13:30", activity: "Tàu về Phan Thiết", location: "Cảng Phú Quý → Bến tàu Phan Thiết", notes: "Về đến Phan Thiết ~13:30, bắt xe về TP.HCM", sortOrder: 10 },
      ],
    },
  ],
  "da-nang": [
    {
      title: "Đà Nẵng – Hội An 3N2Đ",
      durationDays: 3,
      durationNights: 2,
      theme: "culture",
      description: "Khám phá trọn vẹn Đà Nẵng và phố cổ Hội An: biển Mỹ Khê, Bà Nà Hills, Ngũ Hành Sơn và không khí Hội An về đêm lung linh đèn lồng",
      highlights: ["Bà Nà Hills và Cầu Vàng", "Phố cổ Hội An về đêm", "Bãi biển Mỹ Khê sáng sớm", "Ngũ Hành Sơn và làng đá mỹ nghệ", "Show Cầu Rồng phun lửa cuối tuần"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "08:00", timeEnd: "11:00", activity: "Check-in khách sạn, dạo biển Mỹ Khê buổi sáng", location: "Bãi biển Mỹ Khê", notes: "Biển sáng sớm ít người và đẹp nhất, mang đồ bơi nếu muốn tắm biển", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "morning", timeStart: "11:30", timeEnd: "13:00", activity: "Ăn trưa mì Quảng đặc sản Đà Nẵng", location: "Quán Bà Thôi Mì Quảng, Trưng Nữ Vương", notes: "Đến sớm tránh hết suất, quán chỉ mở đến ~11:30", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "14:00", timeEnd: "18:00", activity: "Tham quan Bà Nà Hills, Cầu Vàng và Fantasy Park", location: "Bà Nà Hills", notes: "Mua vé online trước, đặt xe từ khách sạn, mang áo khoác vì trên núi mát", sortOrder: 3 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "21:00", timeEnd: "22:00", activity: "Xem Cầu Rồng phun lửa (nếu ngày cuối tuần)", location: "Cầu Rồng, bờ sông Hàn", notes: "Show lúc 21:00 thứ 7 và Chủ Nhật, đến sớm 20:30 để có chỗ đẹp", sortOrder: 4 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "08:00", timeEnd: "11:30", activity: "Tham quan Ngũ Hành Sơn và làng đá mỹ nghệ Non Nước", location: "Ngũ Hành Sơn, làng Non Nước", notes: "Đi sáng sớm khi trời mát, mang giày bằng để leo bậc thang", sortOrder: 5 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "18:00", activity: "Di chuyển Hội An, tham quan phố cổ và may đo quần áo", location: "Phố cổ Hội An", notes: "Grab từ Đà Nẵng ~200-300k. Thuê xe đạp 50k trong phố cổ rất thú vị", sortOrder: 6 },
        { dayNumber: 2, timeOfDay: "evening", timeStart: "18:30", timeEnd: "21:30", activity: "Thả đèn hoa đăng sông Hoài, ngắm đèn lồng Hội An về đêm", location: "Bờ sông Hoài, phố cổ Hội An", notes: "Đêm 14 âm lịch hàng tháng cấm xe máy, nhiều đèn lồng nhất. Đèn hoa đăng ~20k/đèn", sortOrder: 7 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "06:00", timeEnd: "09:00", activity: "Tắm biển Mỹ Khê lần cuối, ăn sáng bánh mì Phượng Hội An (nếu còn ở đó)", location: "Bãi biển Mỹ Khê hoặc Hội An", notes: "Bánh mì Phượng số 2B Phan Châu Trinh, Hội An – nổi tiếng nhất thế giới", sortOrder: 8 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "10:00", timeEnd: "12:00", activity: "Tham quan Bán đảo Sơn Trà và Chùa Linh Ứng", location: "Bán đảo Sơn Trà, Chùa Linh Ứng", notes: "Ghé mua đặc sản về làm quà: bánh tráng, mì Quảng khô, nước mắm Nam Ô", sortOrder: 9 },
        { dayNumber: 3, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "15:00", activity: "Ăn trưa hải sản, check-out và ra sân bay", location: "Nhà hàng hải sản gần biển Mỹ Khê", notes: "Sân bay chỉ cách trung tâm 10 phút, đặt taxi sớm 30 phút trước giờ bay", sortOrder: 10 },
      ],
    },
  ],
  "phu-quoc": [
    {
      title: "Phú Quốc 4N3Đ – Biển Đảo Thiên Đường",
      durationDays: 4,
      durationNights: 3,
      theme: "relaxation",
      description: "Kỳ nghỉ hoàn hảo tại Phú Quốc: thư giãn Bãi Sao, khám phá đảo Hòn Thơm, mua sắm chợ đêm và thưởng thức ẩm thực đặc sắc của đảo ngọc",
      highlights: ["Bãi Sao trắng mịn tinh khiết", "Cáp treo vượt biển Hòn Thơm", "Chợ đêm Dương Đông", "Lặn ngắm san hô", "Hoàng hôn Long Beach", "Nước mắm và ngọc trai Phú Quốc"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "09:00", timeEnd: "11:00", activity: "Check-in resort/khách sạn, ăn trưa đặc sản bánh canh chả cá", location: "Khách sạn, chợ Dương Đông", notes: "Nghỉ ngơi sau chuyến bay, ăn nhẹ tại Bánh Canh Chả Cá Cô Ba", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "17:30", activity: "Khám phá trung tâm Dương Đông, thăm nhà thùng nước mắm Phú Quốc", location: "Dương Đông, nhà thùng nước mắm Khải Hoàn", notes: "Nước mắm Phú Quốc có độ đạm cao nhất Việt Nam, mua về làm quà", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "18:30", timeEnd: "21:30", activity: "Dạo chợ đêm Phú Quốc, ăn tối ốc và hải sản", location: "Chợ đêm Phú Quốc, Quán Ốc Đào", notes: "Mặc cả ngọc trai và đặc sản, thử ốc hương và bào ngư nướng", sortOrder: 3 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "07:00", timeEnd: "12:00", activity: "Tour cáp treo Hòn Thơm, water park và snorkeling", location: "An Thới, cáp treo Hòn Thơm", notes: "Xe từ Dương Đông ~30 phút. Mua vé combo cáp treo + water park trước", sortOrder: 4 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "13:30", timeEnd: "17:30", activity: "Thư giãn tại Bãi Sao – bãi biển đẹp nhất Phú Quốc", location: "Bãi Sao, xã An Thới", notes: "Ở lại Bãi Sao sau khi từ Hòn Thơm về, chụp ảnh hoàng hôn tuyệt đẹp", sortOrder: 5 },
        { dayNumber: 2, timeOfDay: "evening", timeStart: "19:00", timeEnd: "21:30", activity: "Ăn tối cua và hải sản tại Crab House", location: "Crab House, Long Beach", notes: "Đặt bàn trước vì đông khách, thử cua rang me và tôm hùm nướng", sortOrder: 6 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "08:00", timeEnd: "13:00", activity: "VinWonders – công viên giải trí, thủy cung và safari", location: "VinWonders Phú Quốc, Gành Dầu", notes: "Đến sớm tránh xếp hàng. Trẻ em rất thích khu vực Fantasy Land và thủy cung", sortOrder: 7 },
        { dayNumber: 3, timeOfDay: "afternoon", timeStart: "14:00", timeEnd: "17:30", activity: "Trekking Suối Tranh, tắm suối mát trong rừng", location: "Suối Tranh", notes: "Mặc đồ thoải mái, đi dép tông hoặc giày chống nước", sortOrder: 8 },
        { dayNumber: 3, timeOfDay: "evening", timeStart: "18:00", timeEnd: "21:00", activity: "Uống cocktail ngắm hoàng hôn Long Beach", location: "Café Biển Xanh hoặc resort ven biển", notes: "Hoàng hôn Long Beach là một trong những hoàng hôn đẹp nhất Đông Nam Á", sortOrder: 9 },
        { dayNumber: 4, timeOfDay: "morning", timeStart: "07:00", timeEnd: "10:00", activity: "Ăn sáng chợ Dương Đông, mua đặc sản về làm quà", location: "Chợ Dương Đông, các cửa hàng đặc sản", notes: "Mua nước mắm, tiêu Phú Quốc, ngọc trai, sim rừng ngâm rượu làm quà", sortOrder: 10 },
        { dayNumber: 4, timeOfDay: "morning", timeStart: "10:30", timeEnd: "12:00", activity: "Check-out, ra sân bay về TP.HCM hoặc Hà Nội", location: "Sân bay Quốc tế Phú Quốc", notes: "Đặt xe sân bay trước 1 tiếng, sân bay cách Dương Đông ~20 phút", sortOrder: 11 },
      ],
    },
  ],
  "sa-pa": [
    {
      title: "Sa Pa 3N2Đ – Chinh Phục Fansipan",
      durationDays: 3,
      durationNights: 2,
      theme: "adventure",
      description: "Hành trình chinh phục Nóc nhà Đông Dương và khám phá văn hóa bản làng H'Mong: Fansipan, ruộng bậc thang Mường Hoa, bản Cát Cát và homestay trải nghiệm",
      highlights: ["Đỉnh Fansipan 3143m bằng cáp treo", "Ruộng bậc thang Mường Hoa mùa lúa chín", "Homestay bản người H'Mong", "Chợ phiên Sa Pa cuối tuần", "Ăn thắng cố và lợn cắp nách đặc sản"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "07:00", timeEnd: "14:00", activity: "Khởi hành từ Hà Nội bằng xe limousine lên Sa Pa", location: "Hà Nội → Sa Pa (370km)", notes: "Đặt xe limousine giường nằm trước, chuyến sáng 7:00 từ Mỹ Đình, đến Sa Pa ~13:00", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "14:30", timeEnd: "17:30", activity: "Check-in homestay, tham quan thị trấn Sa Pa và nhà thờ đá", location: "Thị trấn Sa Pa, nhà thờ đá", notes: "Mặc thêm áo khoác vì Sa Pa lạnh hơn Hà Nội 10–15 độ", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "18:30", timeEnd: "21:00", activity: "Ăn tối thắng cố và lợn cắp nách, khám phá chợ đêm Sa Pa", location: "Nhà hàng thắng cố A Quỳnh, chợ đêm Sa Pa", notes: "Thử thắng cố ngựa và ngô nướng than, không khí chợ đêm rất đặc biệt", sortOrder: 3 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "08:00", timeEnd: "11:30", activity: "Chinh phục đỉnh Fansipan bằng cáp treo", location: "Ga cáp treo Fansipan Legend", notes: "Mua vé online trước, mang áo khoác dày (đỉnh Fansipan có thể dưới 10 độ). Sương mù dày buổi chiều", sortOrder: 4 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "17:00", activity: "Trekking qua Bản Cát Cát, tham quan làng H'Mong và thác nước", location: "Bản Cát Cát", notes: "Mua vé 70k tại cổng. Thuê hướng dẫn bản địa 200k để nghe câu chuyện văn hóa", sortOrder: 5 },
        { dayNumber: 2, timeOfDay: "evening", timeStart: "18:00", timeEnd: "21:00", activity: "Thư giãn tại homestay, tắm lá thuốc người H'Mong", location: "Homestay bản làng", notes: "Tắm lá thuốc theo công thức truyền thống chống lạnh và mệt mỏi, rất thư giãn", sortOrder: 6 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "07:00", timeEnd: "11:00", activity: "Trekking thung lũng Mường Hoa ngắm ruộng bậc thang và bản Tả Van", location: "Thung lũng Mường Hoa, bản Tả Van", notes: "Thuê guide bản địa người Giáy, đường trekking ~5km qua ruộng bậc thang rất đẹp", sortOrder: 7 },
        { dayNumber: 3, timeOfDay: "afternoon", timeStart: "12:00", timeEnd: "18:00", activity: "Ăn trưa, mua đặc sản, lên xe trở về Hà Nội", location: "Sa Pa → Hà Nội", notes: "Mua về: mận Sa Pa, rau sạch, thổ cẩm H'Mong, trà Shan Tuyết Suối Giàng. Về đến HN ~20:00", sortOrder: 8 },
      ],
    },
  ],
  "nha-trang": [
    {
      title: "Nha Trang 3N2Đ – Biển & Đảo",
      durationDays: 3,
      durationNights: 2,
      theme: "beach",
      description: "Tận hưởng biển đảo Nha Trang trọn vẹn: tour 4 đảo vịnh Nha Trang, lặn ngắm san hô Hòn Mun, Vinpearl Land và khám phá văn hóa Chăm Pa cổ",
      highlights: ["Tour 4 đảo vịnh Nha Trang", "Lặn SCUBA tại Hòn Mun", "Tháp Bà Ponagar Chăm Pa", "Vinpearl Land qua cáp treo", "Nem nướng và hải sản tươi Nha Trang"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "09:00", timeEnd: "11:00", activity: "Check-in khách sạn ven biển, ăn sáng nem nướng đặc sản", location: "Bãi biển Trần Phú, Quán Nem Nướng Đặng Văn Quyên", notes: "Khách sạn ven biển cho view trực tiếp vịnh Nha Trang tuyệt đẹp", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "morning", timeStart: "11:30", timeEnd: "13:30", activity: "Tham quan Tháp Bà Ponagar – di tích Chăm Pa cổ thế kỷ 8", location: "Tháp Bà Ponagar, phường Vĩnh Phước", notes: "Mặc kín đáo khi vào tháp. Hướng dẫn viên tại chỗ giải thích lịch sử rất hay", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "14:00", timeEnd: "18:00", activity: "Vinpearl Land – cáp treo vượt biển, công viên nước và trò chơi", location: "Vinpearl Land, đảo Hòn Tre", notes: "Trẻ em rất thích khu nước. Đặt vé online rẻ hơn tại quầy ~10–15%", sortOrder: 3 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "19:00", timeEnd: "21:30", activity: "Ăn tối hải sản tươi tại phố hải sản Trần Phú", location: "Quán Hải Sản 4 Mùa, đường Trần Phú", notes: "Chọn hải sản từ bể sống, mặc cả giá trước khi chế biến. Tôm hùm theo mùa", sortOrder: 4 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "07:30", timeEnd: "16:00", activity: "Tour 4 đảo vịnh Nha Trang: Hòn Tằm, Hòn Mun, Hòn Miễu, Hòn Một", location: "Cầu tàu 26 Tháng 3 → Vịnh Nha Trang", notes: "Đặt tour qua khách sạn hoặc công ty tour uy tín. Bao gồm snorkeling, ăn trưa trên biển, lặn Hòn Mun", sortOrder: 5 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "16:30", timeEnd: "18:30", activity: "Tắm biển Trần Phú buổi chiều, thư giãn", location: "Bãi biển Trần Phú", notes: "Bãi biển Trần Phú dài và đẹp, buổi chiều ít sóng hơn buổi sáng", sortOrder: 6 },
        { dayNumber: 2, timeOfDay: "evening", timeStart: "19:30", timeEnd: "22:00", activity: "Cocktail và nhạc sống tại Sailing Club", location: "Sailing Club Nha Trang, 72 Trần Phú", notes: "Beach bar hot nhất Nha Trang, đặt bàn trước vào cuối tuần", sortOrder: 7 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "07:00", timeEnd: "10:00", activity: "Sáng sớm đạp xe ven biển Trần Phú, ăn sáng bún cá đặc sản", location: "Bãi biển Trần Phú, quán bún cá", notes: "Thuê xe đạp 50–80k/ngày, đường ven biển đẹp và ít xe buổi sáng", sortOrder: 8 },
        { dayNumber: 3, timeOfDay: "morning", timeStart: "10:00", timeEnd: "12:00", activity: "Mua sắm chợ Đầm, mua đặc sản về làm quà", location: "Chợ Đầm, Nha Trang", notes: "Mua yến sào, mực khô, nước mắm, rong biển – đặc sản Khánh Hòa. Nhớ mặc cả giá", sortOrder: 9 },
        { dayNumber: 3, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "15:00", activity: "Ăn trưa, check-out và ra sân bay Cam Ranh", location: "Nhà hàng Louisiane hoặc quán địa phương", notes: "Sân bay Cam Ranh cách trung tâm 35km, tính thêm 60 phút di chuyển trước giờ bay", sortOrder: 10 },
      ],
    },
  ],
  "cat-ba": [
    {
      title: "Cát Bà 2N1Đ – Vịnh Lan Hạ & Biển",
      durationDays: 2,
      durationNights: 1,
      theme: "nature",
      description: "Gói cuối tuần lý tưởng từ Hà Nội: kayak khám phá Vịnh Lan Hạ, tắm biển Cát Cò, thưởng thức hải sản Bến Bèo",
      highlights: ["Kayak Vịnh Lan Hạ", "Tắm biển Cát Cò 1", "Hải sản lồng bè Bến Bèo", "Ngắm hoàng hôn từ đỉnh Pháo Đài"],
      items: [
        { dayNumber: 1, timeOfDay: "morning", timeStart: "06:00", timeEnd: "08:30", activity: "Khởi hành từ Hà Nội bằng xe limousine đến bến phà Bến Bính", location: "Hà Nội → Bến phà Bến Bính, Hải Phòng", notes: "Đặt xe limousine trước, chọn chuyến sớm 6:00–6:30", sortOrder: 1 },
        { dayNumber: 1, timeOfDay: "morning", timeStart: "09:00", timeEnd: "10:00", activity: "Đi phà từ Hải Phòng sang Cát Bà", location: "Bến Bính → Bến Gót, Cát Bà", notes: "Phà chạy mỗi 1–2 tiếng, mua vé tại bến ~100k", sortOrder: 2 },
        { dayNumber: 1, timeOfDay: "morning", timeStart: "10:30", timeEnd: "12:00", activity: "Check-in homestay, ăn sáng muộn/bún cua tại chợ", location: "Homestay, chợ Cát Bà", notes: "Gửi hành lý, nhận phòng sớm nếu có thể", sortOrder: 3 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "13:00", timeEnd: "17:30", activity: "Tour kayak nửa ngày khám phá Vịnh Lan Hạ", location: "Vịnh Lan Hạ", notes: "Đặt qua homestay, ~400k/người, mang áo chống nắng", sortOrder: 4 },
        { dayNumber: 1, timeOfDay: "afternoon", timeStart: "17:30", timeEnd: "19:00", activity: "Lên Pháo Đài ngắm hoàng hôn toàn cảnh vịnh", location: "Đỉnh Pháo Đài, Cát Bà", notes: "Đi bộ ~20 phút hoặc đi xe máy, vào cửa ~30k", sortOrder: 5 },
        { dayNumber: 1, timeOfDay: "evening", timeStart: "19:30", timeEnd: "21:30", activity: "Ăn tối hải sản tươi sống tại Bến Bèo", location: "Phố hải sản Bến Bèo", notes: "Thử bề bề hấp bia, ghẹ rang me, giá ~300–500k/người", sortOrder: 6 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "07:00", timeEnd: "09:00", activity: "Ăn sáng bánh đa cua tại chợ, dạo bờ biển buổi sớm", location: "Chợ Cát Bà, bãi Cát Cò 1", notes: "Biển buổi sáng rất đẹp và ít người", sortOrder: 7 },
        { dayNumber: 2, timeOfDay: "morning", timeStart: "09:30", timeEnd: "12:00", activity: "Tắm biển Cát Cò 1, chơi các trò chơi nước", location: "Bãi Cát Cò 1", notes: "Mang kem chống nắng, đồ bơi, thuê dù ~30k", sortOrder: 8 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "12:30", timeEnd: "14:00", activity: "Ăn trưa, check-out, mua đặc sản mang về", location: "Nhà hàng, chợ Cát Bà", notes: "Mua chả mực, tôm khô, bánh đa cua đặc sản HP", sortOrder: 9 },
        { dayNumber: 2, timeOfDay: "afternoon", timeStart: "14:30", timeEnd: "19:00", activity: "Phà về Hải Phòng, xe limousine về Hà Nội", location: "Cát Bà → Hải Phòng → Hà Nội", notes: "Về đến HN khoảng 19:00–19:30", sortOrder: 10 },
      ],
    },
  ],
};
