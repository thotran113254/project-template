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
