import { db, queryClient } from "./connection";
import { users, resources, hotels, hotelRooms, knowledgeBase } from "./schema";
import { hashPassword } from "../lib/password-utils";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Seed admin user
  const adminEmail = "admin@example.com";
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let adminId: string;
  if (existingAdmin.length === 0) {
    const [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        name: "Admin",
        passwordHash: await hashPassword("Admin123!"),
        role: "admin",
      })
      .returning();
    adminId = admin!.id;
    console.log("  Created admin user");
  } else {
    adminId = existingAdmin[0]!.id;
    console.log("  Admin user already exists");
  }

  // Seed regular user
  const userEmail = "user@example.com";
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  let userId: string;
  if (existingUser.length === 0) {
    const [regularUser] = await db
      .insert(users)
      .values({
        email: userEmail,
        name: "User",
        passwordHash: await hashPassword("User123!"),
        role: "user",
      })
      .returning();
    userId = regularUser!.id;
    console.log("  Created regular user");
  } else {
    userId = existingUser[0]!.id;
    console.log("  Regular user already exists");
  }

  // Seed sample resources
  const existingResources = await db.select().from(resources).limit(1);
  if (existingResources.length === 0) {
    const sampleResources = [
      {
        name: "Landing Page",
        slug: "landing-page",
        description: "Main landing page for the website",
        status: "active",
        category: "service",
        metadata: { priority: "high", version: "1.0" },
        userId: adminId,
      },
      {
        name: "API Documentation",
        slug: "api-documentation",
        description: "REST API documentation site",
        status: "active",
        category: "document",
        metadata: { format: "openapi", version: "3.0" },
        userId: adminId,
      },
      {
        name: "Mobile App",
        slug: "mobile-app",
        description: "Cross-platform mobile application",
        status: "inactive",
        category: "product",
        metadata: { platform: "react-native" },
        userId: userId,
      },
      {
        name: "Analytics Dashboard",
        slug: "analytics-dashboard",
        description: "Business analytics dashboard",
        status: "pending",
        category: "service",
        metadata: { framework: "react" },
        userId: adminId,
      },
    ];

    const inserted = await db
      .insert(resources)
      .values(sampleResources)
      .returning();
    console.log(`  Created ${inserted.length} sample resources`);
  } else {
    console.log("  Resources already exist");
  }

  // Seed hotels and rooms
  const existingHotels = await db.select().from(hotels).limit(1);
  if (existingHotels.length === 0) {
    const hotelData = [
      { name: "The Ritz-Carlton, Kyoto", slug: "ritz-carlton-kyoto", description: "A luxury hotel in the heart of Kyoto", location: "Kyoto, Japan", starRating: 5, images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"], amenities: ["pool", "free-wifi", "breakfast", "spa"], priceFrom: 450, metadata: {} },
      { name: "Hotel Granvia Kyoto", slug: "hotel-granvia-kyoto", description: "Modern comfort near Kyoto Station", location: "Kyoto, Japan", starRating: 4, images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"], amenities: ["gym", "free-wifi", "restaurant"], priceFrom: 280, metadata: {} },
      { name: "Ace Hotel Kyoto", slug: "ace-hotel-kyoto", description: "Stylish boutique hotel in Kyoto", location: "Kyoto, Japan", starRating: 4, images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"], amenities: ["free-wifi", "bar", "restaurant"], priceFrom: 320, metadata: {} },
      { name: "Park Hyatt Kyoto", slug: "park-hyatt-kyoto", description: "Elevated luxury in Higashiyama", location: "Kyoto, Japan", starRating: 5, images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"], amenities: ["spa", "breakfast", "fine-dining"], priceFrom: 600, metadata: {} },
      { name: "Sala Danang Beach Hotel", slug: "sala-danang-beach", description: "Beachfront resort in Da Nang", location: "Da Nang, Vietnam", starRating: 5, images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800"], amenities: ["pool", "free-wifi", "breakfast", "spa", "private-beach"], priceFrom: 150, metadata: {} },
      { name: "Vinpearl Discovery 1", slug: "vinpearl-discovery-1", description: "Family resort in Nha Trang", location: "Nha Trang, Vietnam", starRating: 5, images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"], amenities: ["pool", "free-wifi", "breakfast", "spa", "gym"], priceFrom: 120, metadata: {} },
      { name: "InterContinental Resort", slug: "intercontinental-resort", description: "Luxury resort on the coast", location: "Da Nang, Vietnam", starRating: 5, images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"], amenities: ["pool", "spa", "fine-dining", "gym"], priceFrom: 200, metadata: {} },
      { name: "Sun World Ba Na Hills", slug: "sun-world-ba-na-hills", description: "Mountain resort near Golden Bridge", location: "Da Nang, Vietnam", starRating: 4, images: ["https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800"], amenities: ["restaurant", "parking", "free-wifi"], priceFrom: 100, metadata: {} },
    ];
    const insertedHotels = await db.insert(hotels).values(hotelData).returning();
    console.log(`  Created ${insertedHotels.length} hotels`);

    const roomData = insertedHotels.flatMap((h) => [
      { hotelId: h.id, roomType: "Standard King", pricePerNight: h.priceFrom, capacity: 2, description: "Comfortable room with king bed" },
      { hotelId: h.id, roomType: "Deluxe Twin", pricePerNight: Math.round(h.priceFrom * 1.3), capacity: 3, description: "Spacious room with two beds" },
      { hotelId: h.id, roomType: "Deluxe Ocean View", pricePerNight: Math.round(h.priceFrom * 1.5), capacity: 2, description: "Premium room with ocean view" },
      { hotelId: h.id, roomType: "Superior Family Room", pricePerNight: Math.round(h.priceFrom * 1.8), capacity: 4, description: "Large family suite" },
    ]);
    const insertedRooms = await db.insert(hotelRooms).values(roomData).returning();
    console.log(`  Created ${insertedRooms.length} hotel rooms`);
  } else {
    console.log("  Hotels already exist");
  }

  // Seed knowledge base articles
  const existingKb = await db.select().from(knowledgeBase).limit(1);
  if (existingKb.length === 0) {
    const kbData = [
      { title: "Thời điểm du lịch Đà Lạt đẹp nhất?", content: "Gợi ý về mùa thu, mùa đông và mùa hoa đà lạt...", category: "destination", tags: ["dalat", "weather"], status: "published", createdBy: adminId },
      { title: "Chính sách hoàn hủy tour quốc tế", content: "Thông tin chi tiết về các chính sách hoàn hủy...", category: "policy", tags: ["cancellation", "international"], status: "published", createdBy: adminId },
      { title: "Cần chuẩn bị gì khi đi Sapa mùa đông?", content: "Danh sách đồ gia dụng, thuốc mang cần thiết...", category: "destination", tags: ["sapa", "winter"], status: "draft", createdBy: adminId },
      { title: "Cách đặt vé máy bay qua ứng dụng", content: "Hướng dẫn từng bước thực hiện trên Mobile App...", category: "general", tags: ["booking", "app"], status: "published", createdBy: adminId },
      { title: "Dịch vụ đưa đón sân bay bao gồm gì?", content: "Thông tin về loại xe và thời gian chờ...", category: "product", tags: ["airport", "transfer"], status: "published", createdBy: adminId },
    ];
    const insertedKb = await db.insert(knowledgeBase).values(kbData).returning();
    console.log(`  Created ${insertedKb.length} KB articles`);
  } else {
    console.log("  KB articles already exist");
  }

  console.log("Seed completed!");
  await queryClient.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
