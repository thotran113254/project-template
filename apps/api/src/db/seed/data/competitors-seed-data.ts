// Competitor data keyed by market slug for reference during seeding
export const competitorsData: Record<string, Array<{
  groupName: string;
  description: string;
  examples: string;
  mainChannels: string;
  strengths: string;
  weaknesses: string;
  effectiveness: string;
  sortOrder: number;
}>> = {
  "phu-quy": [
    {
      groupName: "Homestay tự marketing",
      description: "Các hộ kinh doanh homestay nhỏ lẻ tự quảng bá qua mạng xã hội và quan hệ cá nhân",
      examples: "Homestay Biển Xanh, Nhà Nghỉ Hoa Biển, Homestay Bà Tám",
      mainChannels: "Facebook cá nhân, Zalo, Tiktok, giới thiệu miệng",
      strengths: "Giá rẻ, linh hoạt, am hiểu địa phương, dịch vụ thân thiện",
      weaknesses: "Thiếu chuyên nghiệp, không có hệ thống đặt phòng, chất lượng không đồng đều",
      effectiveness: "medium",
      sortOrder: 1,
    },
    {
      groupName: "OTA platforms (Booking, Agoda)",
      description: "Các nền tảng đặt phòng trực tuyến quốc tế và trong nước",
      examples: "Booking.com, Agoda, Traveloka, Airbnb",
      mainChannels: "Website, app di động, SEO toàn cầu",
      strengths: "Tiếp cận khách quốc tế, hệ thống đặt phòng chuyên nghiệp, review tin cậy",
      weaknesses: "Phí hoa hồng 15–25%, ít cơ sở ở Phú Quý, khó kiểm soát trải nghiệm",
      effectiveness: "low",
      sortOrder: 2,
    },
    {
      groupName: "Tour operators từ đất liền",
      description: "Công ty lữ hành ở TP.HCM, Phan Thiết tổ chức tour trọn gói ra đảo",
      examples: "Vietravel, Saigontourist, tour địa phương Phan Thiết",
      mainChannels: "Website công ty, Facebook ads, hội du lịch",
      strengths: "Trọn gói tiện lợi, uy tín thương hiệu, khách đông đảo",
      weaknesses: "Giá cao, ít cá nhân hóa, lợi nhuận chia sẻ với nhiều bên",
      effectiveness: "medium",
      sortOrder: 3,
    },
    {
      groupName: "Hướng dẫn viên địa phương",
      description: "Người dân địa phương kiêm hướng dẫn viên tự do",
      examples: "Anh Hùng tour, Chú Ba câu cá, dân địa phương chạy xe ôm kiêm guide",
      mainChannels: "Zalo, giới thiệu trực tiếp tại bến tàu",
      strengths: "Am hiểu địa phương sâu, linh hoạt, giá tốt",
      weaknesses: "Không chính thức, thiếu kỹ năng, khó đặt trước",
      effectiveness: "medium",
      sortOrder: 4,
    },
  ],
  "cat-ba": [
    {
      groupName: "Resort và khách sạn 3–4 sao",
      description: "Các chuỗi resort và khách sạn trung-cao cấp tại đảo",
      examples: "Catba Island Resort, Sunrise Resort, Noble Hotel Cat Ba",
      mainChannels: "Booking.com, Agoda, website riêng, OTA",
      strengths: "Cơ sở vật chất tốt, dịch vụ chuyên nghiệp, vị trí đẹp",
      weaknesses: "Giá cao, thiếu trải nghiệm địa phương chân thực",
      effectiveness: "high",
      sortOrder: 1,
    },
    {
      groupName: "Tour package từ Hà Nội",
      description: "Công ty lữ hành HN bán tour Cát Bà 2N1Đ, 3N2Đ",
      examples: "Vietravel HN, Flamingo, các tour HN–Cát Bà giá rẻ",
      mainChannels: "Website, Facebook ads, Google ads, sàn du lịch",
      strengths: "Tiện lợi trọn gói, đa dạng mức giá, thương hiệu mạnh",
      weaknesses: "Chất lượng không đồng đều, đông khách, ít cá nhân hóa",
      effectiveness: "high",
      sortOrder: 2,
    },
    {
      groupName: "OTA platforms",
      description: "Nền tảng đặt phòng trực tuyến phủ rộng tại Cát Bà",
      examples: "Booking.com, Agoda, Airbnb, Traveloka",
      mainChannels: "App, website, SEO",
      strengths: "Tiếp cận khách quốc tế, hệ thống review, đặt phòng tự động",
      weaknesses: "Phí hoa hồng cao, cạnh tranh giá khốc liệt",
      effectiveness: "high",
      sortOrder: 3,
    },
    {
      groupName: "Homestay và nhà nghỉ bình dân",
      description: "Homestay tự marketing qua mạng xã hội và bạch tảo",
      examples: "Homestay Minh Loan, Nhà nghỉ Hoài, Phòng trọ bãi Cát Cò",
      mainChannels: "Facebook, Zalo, giới thiệu",
      strengths: "Giá rẻ, gần gũi, linh hoạt",
      weaknesses: "Thiếu chuyên nghiệp, chất lượng không đồng đều",
      effectiveness: "medium",
      sortOrder: 4,
    },
  ],
};
