export type PropertyRoom = {
  roomType: string;
  bookingCode: string;
  capacity: number;
  description: string;
  amenities: string[];
  sortOrder: number;
};

export type Property = {
  name: string;
  slug: string;
  type: string;
  starRating: string;
  address: string;
  locationDetail: string;
  description: string;
  amenities: string[];
  contactInfo: Record<string, string>;
  invoiceStatus: string;
  notes: string;
  rooms: PropertyRoom[];
};

export const propertiesData: Record<string, Property[]> = {
  "phu-quy": [
    {
      name: "Homestay Biển Xanh Phú Quý",
      slug: "bien-xanh-phu-quy",
      type: "homestay",
      starRating: "3.0",
      address: "Thôn Quý Thạnh, xã Tam Thanh, Phú Quý, Bình Thuận",
      locationDetail: "Cách cảng tàu 500m, gần bãi Nhỏ 1km, view biển từ sân thượng",
      description: "Homestay gia đình ấm cúng, phòng thoáng mát, chủ nhà am hiểu địa phương, hỗ trợ đặt tour lặn biển và câu cá",
      amenities: ["wifi", "air-conditioning", "private-bathroom", "sea-view-rooftop", "motorbike-rental", "breakfast-optional"],
      contactInfo: { phone: "0901234567", zalo: "0901234567", facebook: "homestaybienxanhphuquy" },
      invoiceStatus: "none",
      notes: "Chủ nhà tên anh Hải, biết tiếng Anh cơ bản. Hỗ trợ đặt vé tàu cho khách",
      rooms: [
        {
          roomType: "Phòng Đôi View Biển",
          bookingCode: "BX-DBL",
          capacity: 2,
          description: "Phòng đôi 25m², cửa sổ view biển, giường đôi Queen, máy lạnh, WC riêng",
          amenities: ["air-conditioning", "private-bathroom", "sea-view", "wifi"],
          sortOrder: 1,
        },
        {
          roomType: "Phòng Gia Đình",
          bookingCode: "BX-FAM",
          capacity: 4,
          description: "Phòng rộng 35m², 1 giường đôi + 2 giường đơn, phù hợp gia đình hoặc nhóm 4 người",
          amenities: ["air-conditioning", "private-bathroom", "wifi", "extra-bed-available"],
          sortOrder: 2,
        },
      ],
    },
    {
      name: "Nhà Nghỉ Hoa Biển",
      slug: "hoa-bien-phu-quy",
      type: "guesthouse",
      starRating: "2.0",
      address: "Khu vực chợ Phú Quý, xã Ngũ Phụng, Bình Thuận",
      locationDetail: "Trung tâm đảo, gần chợ và các quán ăn địa phương",
      description: "Nhà nghỉ đơn giản, sạch sẽ, giá bình dân, phù hợp khách ưu tiên tiết kiệm chi phí",
      amenities: ["wifi", "air-conditioning", "shared-bathroom", "motorbike-rental"],
      contactInfo: { phone: "0912345678", zalo: "0912345678" },
      invoiceStatus: "none",
      notes: "Không có bữa sáng, nhiều quán ăn gần đó. Giá tốt nhất đảo",
      rooms: [
        {
          roomType: "Phòng Tiêu Chuẩn",
          bookingCode: "HB-STD",
          capacity: 2,
          description: "Phòng 20m², giường đôi, máy lạnh, WC chung hành lang",
          amenities: ["air-conditioning", "wifi", "shared-bathroom"],
          sortOrder: 1,
        },
        {
          roomType: "Phòng 3 Người",
          bookingCode: "HB-TRP",
          capacity: 3,
          description: "Phòng 22m², 1 giường đôi + 1 giường đơn, WC riêng",
          amenities: ["air-conditioning", "wifi", "private-bathroom"],
          sortOrder: 2,
        },
      ],
    },
    {
      name: "Coastal Escape Phú Quý",
      slug: "coastal-escape-phu-quy",
      type: "homestay",
      starRating: "3.5",
      address: "Bãi Nhỏ, xã Tam Thanh, Phú Quý, Bình Thuận",
      locationDetail: "Ngay sát bãi biển Bãi Nhỏ, cách cảng 3km",
      description: "Homestay mới xây dựng 2023, thiết kế hiện đại, trực tiếp ra biển, phù hợp cặp đôi và du khách ưa trải nghiệm cao cấp hơn",
      amenities: ["wifi", "air-conditioning", "private-bathroom", "beachfront", "kayak-rental", "breakfast-included"],
      contactInfo: { phone: "0923456789", zalo: "0923456789", instagram: "coastalescapephuquy" },
      invoiceStatus: "vat",
      notes: "Có bữa sáng, cho thuê kayak. Booking tối thiểu 2 đêm mùa cao điểm",
      rooms: [
        {
          roomType: "Beachfront Deluxe",
          bookingCode: "CE-DLX",
          capacity: 2,
          description: "Phòng deluxe 30m², ban công nhìn thẳng ra biển, giường King, thiết kế hiện đại",
          amenities: ["air-conditioning", "private-bathroom", "sea-view-balcony", "wifi", "minibar"],
          sortOrder: 1,
        },
        {
          roomType: "Garden View Standard",
          bookingCode: "CE-STD",
          capacity: 2,
          description: "Phòng tiêu chuẩn 25m², view vườn nhiệt đới, giường Queen",
          amenities: ["air-conditioning", "private-bathroom", "garden-view", "wifi"],
          sortOrder: 2,
        },
      ],
    },
  ],
  "cat-ba": [
    {
      name: "Lan Hạ Bay Homestay",
      slug: "lan-ha-bay-homestay",
      type: "homestay",
      starRating: "3.5",
      address: "Bãi Cát Cò 1, thị trấn Cát Bà, Hải Phòng",
      locationDetail: "Cách bãi biển Cát Cò 1 đi bộ 2 phút, view vịnh từ tầng thượng",
      description: "Homestay gia đình 3 tầng gần biển, phong cách Indochine, chủ nhà thân thiện, hỗ trợ đặt tour kayak Vịnh Lan Hạ",
      amenities: ["wifi", "air-conditioning", "private-bathroom", "rooftop-bar", "kayak-booking", "breakfast-optional", "bike-rental"],
      contactInfo: { phone: "0934567890", zalo: "0934567890", booking: "lan-ha-bay-homestay" },
      invoiceStatus: "none",
      notes: "Chủ nhà nói tiếng Anh tốt. Có thể đặt kayak và tour VQG qua homestay",
      rooms: [
        {
          roomType: "Phòng Đôi Tiêu Chuẩn",
          bookingCode: "LH-STD",
          capacity: 2,
          description: "Phòng 22m², giường đôi Queen, WC riêng, máy lạnh, gần biển",
          amenities: ["air-conditioning", "private-bathroom", "wifi"],
          sortOrder: 1,
        },
        {
          roomType: "Phòng Gia Đình Tầng 3",
          bookingCode: "LH-FAM",
          capacity: 4,
          description: "Phòng rộng 32m² tầng 3, view vịnh, 1 giường King + 2 giường đơn gấp",
          amenities: ["air-conditioning", "private-bathroom", "bay-view", "wifi"],
          sortOrder: 2,
        },
      ],
    },
    {
      name: "Cat Ba Sunrise Boutique",
      slug: "cat-ba-sunrise-boutique",
      type: "hotel",
      starRating: "3.0",
      address: "Đường 1/4, thị trấn Cát Bà, Hải Phòng",
      locationDetail: "Trung tâm thị trấn, cách bến tàu 300m, cách Cát Cò 1 đi bộ 10 phút",
      description: "Khách sạn boutique 3 sao, phòng ốc hiện đại, lễ tân 24h, hỗ trợ đặt tour đầy đủ, phù hợp khách đi công tác và du lịch",
      amenities: ["wifi", "air-conditioning", "private-bathroom", "reception-24h", "tour-desk", "breakfast-buffet", "luggage-storage"],
      contactInfo: { phone: "0225678901", email: "info@catbasunrise.vn", booking: "cat-ba-sunrise-boutique" },
      invoiceStatus: "vat",
      notes: "Xuất hóa đơn VAT. Bữa sáng buffet từ 7:00–10:00. Thanh toán thẻ được",
      rooms: [
        {
          roomType: "Superior Room",
          bookingCode: "SB-SUP",
          capacity: 2,
          description: "Phòng Superior 28m², giường đôi, nội thất hiện đại, minibar",
          amenities: ["air-conditioning", "private-bathroom", "wifi", "minibar", "safe-box"],
          sortOrder: 1,
        },
        {
          roomType: "Deluxe Bay View",
          bookingCode: "SB-DLX",
          capacity: 2,
          description: "Phòng Deluxe 32m², view vịnh, ban công, giường King",
          amenities: ["air-conditioning", "private-bathroom", "bay-view-balcony", "wifi", "minibar", "bathtub"],
          sortOrder: 2,
        },
      ],
    },
  ],
};
