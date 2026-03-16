export type DiningSpot = {
  name: string;
  category: string;
  address: string;
  priceRange: string;
  priceLevel: string;
  notableFeatures: string;
  cuisineType: string;
  operatingHours: string;
  sortOrder: number;
};

export const diningSpotsData: Record<string, DiningSpot[]> = {
  "phu-quy": [
    {
      name: "Quán Bà Tư Hải Sản",
      category: "seafood",
      address: "Khu vực cảng Tam Thanh, Phú Quý",
      priceRange: "150,000–400,000 VND/người",
      priceLevel: "medium",
      notableFeatures: "Hải sản tươi sống bắt lên từ buổi sáng, ngồi ngoài trời view biển, chủ quán thân thiện",
      cuisineType: "Hải sản Việt Nam",
      operatingHours: "10:00–21:00",
      sortOrder: 1,
    },
    {
      name: "Cơm Tấm Sáng Cô Lan",
      category: "breakfast",
      address: "Trung tâm thị trấn Phú Quý",
      priceRange: "30,000–60,000 VND/người",
      priceLevel: "low",
      notableFeatures: "Cơm tấm sườn bì chả, bún bò, bánh mì ăn sáng, đông khách địa phương",
      cuisineType: "Cơm tấm, bún, bánh mì",
      operatingHours: "06:00–10:30",
      sortOrder: 2,
    },
    {
      name: "Nhà Hàng Biển Xanh",
      category: "restaurant",
      address: "Bãi Nhỏ, Phú Quý",
      priceRange: "200,000–600,000 VND/người",
      priceLevel: "medium-high",
      notableFeatures: "View biển đẹp, menu đa dạng, phù hợp nhóm đông, có phòng riêng",
      cuisineType: "Hải sản, món Việt",
      operatingHours: "11:00–22:00",
      sortOrder: 3,
    },
    {
      name: "Café Đảo Gió",
      category: "cafe",
      address: "Đường ven biển, gần cảng chính",
      priceRange: "30,000–80,000 VND/người",
      priceLevel: "low",
      notableFeatures: "Cà phê phin truyền thống, view biển, wifi, không gian thư giãn ban ngày",
      cuisineType: "Cà phê, nước giải khát",
      operatingHours: "06:30–22:00",
      sortOrder: 4,
    },
  ],
  "cat-ba": [
    {
      name: "Phố Hải Sản Bến Bèo",
      category: "seafood",
      address: "Bến Bèo, thị trấn Cát Bà",
      priceRange: "200,000–500,000 VND/người",
      priceLevel: "medium",
      notableFeatures: "Hải sản nuôi lồng bè tươi sống, cua ghẹ, bề bề, ngao, view cảng biển",
      cuisineType: "Hải sản Bắc Bộ",
      operatingHours: "10:00–22:00",
      sortOrder: 1,
    },
    {
      name: "Bánh Đa Cua Bà Hương",
      category: "breakfast",
      address: "Chợ Cát Bà, đường 1/4",
      priceRange: "40,000–70,000 VND/người",
      priceLevel: "low",
      notableFeatures: "Bánh đa cua Hải Phòng chính gốc, bún cá, đông khách địa phương buổi sáng",
      cuisineType: "Bánh đa cua, bún Hải Phòng",
      operatingHours: "06:00–11:00",
      sortOrder: 2,
    },
    {
      name: "Nhà Hàng Green Mango",
      category: "restaurant",
      address: "Đường 1/4, trung tâm thị trấn Cát Bà",
      priceRange: "150,000–350,000 VND/người",
      priceLevel: "medium",
      notableFeatures: "Menu song ngữ Anh–Việt, phục vụ khách quốc tế, cocktail, nhạc sống buổi tối",
      cuisineType: "Việt Nam, quốc tế",
      operatingHours: "09:00–23:00",
      sortOrder: 3,
    },
    {
      name: "Café Vịnh Lan Hạ",
      category: "cafe",
      address: "Bãi Cát Cò 1, Cát Bà",
      priceRange: "45,000–120,000 VND/người",
      priceLevel: "low-medium",
      notableFeatures: "View vịnh tuyệt đẹp, cà phê, sinh tố, bánh ngọt, không gian ngoài trời",
      cuisineType: "Cà phê, đồ uống, bánh",
      operatingHours: "07:00–21:00",
      sortOrder: 4,
    },
  ],
};
