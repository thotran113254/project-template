export type Attraction = {
  name: string;
  type: string;
  position: string;
  natureDescription: string;
  experienceValue: string;
  popularity: string;
  bestTime: string;
  costInfo: string;
  suitableFor: string;
  connectivity: string;
  risks: string;
  sortOrder: number;
};

export const attractionsData: Record<string, Attraction[]> = {
  "phu-quy": [
    {
      name: "Bãi Nhỏ",
      type: "beach",
      position: "Phía Tây Nam đảo, cách trung tâm 3km",
      natureDescription: "Bãi cát trắng nhỏ, nước trong xanh, có rạn đá san hô gần bờ",
      experienceValue: "Tắm biển, snorkeling gần bờ, chụp ảnh hoàng hôn",
      popularity: "high",
      bestTime: "5:00–8:00 sáng và 15:00–18:00 chiều",
      costInfo: "Miễn phí vào bãi. Thuê dụng cụ snorkeling ~50k/bộ",
      suitableFor: "Cặp đôi, gia đình, nhóm bạn",
      connectivity: "Đi xe máy ~10 phút từ trung tâm đảo",
      risks: "Sóng mạnh mùa gió (tháng 9–2), không có cứu hộ",
      sortOrder: 1,
    },
    {
      name: "Gành Hang",
      type: "landmark",
      position: "Phía Đông đảo, khu vực đá núi lửa",
      natureDescription: "Vách đá núi lửa hàng triệu năm tuổi, cấu trúc địa chất độc đáo, hang động tự nhiên",
      experienceValue: "Khám phá địa chất, chụp ảnh phong cảnh hoang dã, ngắm sóng vỗ",
      popularity: "medium",
      bestTime: "Buổi sáng sớm 6:00–9:00, ánh sáng đẹp cho chụp ảnh",
      costInfo: "Miễn phí",
      suitableFor: "Người thích khám phá, chụp ảnh phong cảnh",
      connectivity: "Đi xe máy từ trung tâm, đường mòn ~2km đi bộ",
      risks: "Đường trơn trượt khi ướt, không nên đến khi biển động",
      sortOrder: 2,
    },
    {
      name: "Linh Sơn Tự",
      type: "cultural",
      position: "Trên đồi cao, trung tâm đảo",
      natureDescription: "Chùa cổ linh thiêng, view toàn cảnh đảo và biển từ trên cao",
      experienceValue: "Tâm linh, ngắm panorama toàn đảo, tìm hiểu văn hóa địa phương",
      popularity: "high",
      bestTime: "Sáng sớm 5:30–7:00 và chiều tà 16:00–18:00",
      costInfo: "Miễn phí, tự nguyện công đức",
      suitableFor: "Tất cả khách, đặc biệt gia đình và người cao tuổi",
      connectivity: "Đi xe máy lên dốc hoặc đi bộ ~30 phút từ chân đồi",
      risks: "Đường lên dốc cao, không phù hợp khi trời mưa",
      sortOrder: 3,
    },
    {
      name: "Hòn Tranh",
      type: "island",
      position: "Đảo nhỏ cách Phú Quý ~2km về phía Nam",
      natureDescription: "Đảo hoang không người ở, rạn san hô nguyên vẹn bao quanh, cá biển đa dạng",
      experienceValue: "Lặn SCUBA/snorkeling ngắm san hô, câu cá, picnic đảo hoang",
      popularity: "medium",
      bestTime: "Mùa khô tháng 3–8, buổi sáng khi nước trong nhất",
      costInfo: "Thuê thuyền khứ hồi ~200–300k/người (nhóm), không có dịch vụ trên đảo",
      suitableFor: "Người thích lặn biển, phiêu lưu, nhóm bạn",
      connectivity: "Thuê thuyền địa phương từ bến tàu, ~20 phút",
      risks: "Không có dịch vụ cứu hộ, cần có kỹ năng bơi lội",
      sortOrder: 4,
    },
  ],
  "cat-ba": [
    {
      name: "Vịnh Lan Hạ",
      type: "bay",
      position: "Phía Đông Nam đảo Cát Bà, tiếp giáp Vịnh Hạ Long",
      natureDescription: "Vịnh biển đẹp với hàng trăm đảo đá vôi, nước xanh trong, ít khách hơn Hạ Long",
      experienceValue: "Kayak khám phá hang động, bơi lội, chụp ảnh phong cảnh, ngủ đêm trên thuyền",
      popularity: "high",
      bestTime: "Tháng 4–10, buổi sáng 7:00–11:00 trước khi đông khách",
      costInfo: "Tour kayak từ 350k–600k/người (nửa ngày), thuê kayak tự lái ~150k/giờ",
      suitableFor: "Cặp đôi, nhóm bạn, gia đình có con trên 8 tuổi",
      connectivity: "Thuê kayak/thuyền từ bãi biển Cát Cò hoặc qua tour",
      risks: "Sóng đột ngột khi thời tiết thay đổi, cần áo phao",
      sortOrder: 1,
    },
    {
      name: "Bãi Cát Cò 1",
      type: "beach",
      position: "Phía Nam đảo, cách trung tâm thị trấn 2km",
      natureDescription: "Bãi cát trắng dài 300m, nước trong xanh, được bao bởi núi đá vôi",
      experienceValue: "Tắm biển, thư giãn, các trò chơi nước, ngắm hoàng hôn",
      popularity: "high",
      bestTime: "Tháng 5–9, buổi sáng 7:00–10:00 trước khi đông đúc",
      costInfo: "Vào bãi miễn phí. Ghế nằm ~50k, dù biển ~30k",
      suitableFor: "Tất cả đối tượng",
      connectivity: "Đi bộ hoặc xe máy từ thị trấn Cát Bà ~5 phút",
      risks: "Đông đúc mùa hè, vệ sinh bãi biển không đồng đều",
      sortOrder: 2,
    },
    {
      name: "Vườn Quốc Gia Cát Bà",
      type: "nature",
      position: "Trung tâm và phía Bắc đảo, chiếm ~50% diện tích đảo",
      natureDescription: "Rừng nhiệt đới đa dạng sinh học, nơi sinh sống của Voọc Cát Bà đặc hữu",
      experienceValue: "Trekking, quan sát động vật hoang dã, leo núi Pháo Đài, khám phá hang Trung Trang",
      popularity: "medium",
      bestTime: "Sáng sớm 6:00–10:00, tránh mùa mưa tháng 7–8",
      costInfo: "Vé vào cổng ~40k người lớn, 20k trẻ em. Tour có hướng dẫn viên ~150–300k/người",
      suitableFor: "Người yêu thiên nhiên, trekking, gia đình có trẻ trên 10 tuổi",
      connectivity: "Xe máy hoặc ô tô đến cổng VQG, đi bộ trong rừng",
      risks: "Đường mòn trơn trượt mùa mưa, cần giày trekking",
      sortOrder: 3,
    },
    {
      name: "Đảo Khỉ",
      type: "island",
      position: "Đảo nhỏ cách Cát Bà ~10km, trong vùng vịnh",
      natureDescription: "Đảo có đàn khỉ hoang dã sinh sống tự nhiên, rừng nguyên sinh",
      experienceValue: "Quan sát khỉ hoang dã, tắm biển, chụp ảnh thiên nhiên",
      popularity: "medium",
      bestTime: "Buổi sáng 8:00–11:00, tránh giờ trưa nóng",
      costInfo: "Vé tàu khứ hồi + vào đảo ~150–200k/người",
      suitableFor: "Gia đình có trẻ em, nhóm bạn thích thiên nhiên",
      connectivity: "Tàu từ bến cảng Cát Bà, ~30 phút",
      risks: "Khỉ có thể giật đồ ăn, không cho ăn trực tiếp",
      sortOrder: 4,
    },
  ],
};
