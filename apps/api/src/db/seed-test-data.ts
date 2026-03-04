import { db, queryClient } from "./connection";
import {
  users,
  hotels,
  hotelRooms,
  bookings,
  pricingRules,
  chatSessions,
  chatMessages,
} from "./schema";
import { eq } from "drizzle-orm";

async function seedTestData() {
  console.log("Seeding test data...");

  // Get existing users
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@example.com"))
    .limit(1);
  const [regularUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "user@example.com"))
    .limit(1);

  if (!admin || !regularUser) {
    console.error("Run base seed first: pnpm db:seed");
    await queryClient.end();
    process.exit(1);
  }

  const adminId = admin.id;
  const userId = regularUser.id;

  // --- Additional Hotels ---
  const newHotelData = [
    {
      name: "Vinpearl Resort Phu Quoc",
      slug: "vinpearl-resort-phu-quoc",
      description: "Tropical beachfront paradise on Phu Quoc island",
      location: "Phu Quoc, Vietnam",
      starRating: 5,
      images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800"],
      amenities: ["pool", "spa", "free-wifi", "breakfast", "private-beach", "gym"],
      priceFrom: 180,
      metadata: {},
    },
    {
      name: "Phu Quoc Sailing Club",
      slug: "phu-quoc-sailing-club",
      description: "Boutique seaside hotel with sailing experiences",
      location: "Phu Quoc, Vietnam",
      starRating: 4,
      images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
      amenities: ["pool", "free-wifi", "restaurant", "water-sports"],
      priceFrom: 90,
      metadata: {},
    },
    {
      name: "Hoi An Ancient House Resort",
      slug: "hoi-an-ancient-house-resort",
      description: "Traditional Vietnamese architecture meets modern comfort",
      location: "Hoi An, Vietnam",
      starRating: 4,
      images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
      amenities: ["pool", "free-wifi", "breakfast", "bicycle-rental"],
      priceFrom: 75,
      metadata: {},
    },
    {
      name: "JW Marriott Hotel Ha Noi",
      slug: "jw-marriott-ha-noi",
      description: "Luxury five-star hotel in the heart of Ha Noi",
      location: "Ha Noi, Vietnam",
      starRating: 5,
      images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"],
      amenities: ["pool", "spa", "fine-dining", "gym", "free-wifi", "bar"],
      priceFrom: 250,
      metadata: {},
    },
    {
      name: "Hanoi La Siesta Hotel",
      slug: "hanoi-la-siesta-hotel",
      description: "Charming boutique hotel in Hanoi Old Quarter",
      location: "Ha Noi, Vietnam",
      starRating: 4,
      images: ["https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800"],
      amenities: ["free-wifi", "breakfast", "restaurant", "bar"],
      priceFrom: 65,
      metadata: {},
    },
  ];

  const insertedHotels = await db.insert(hotels).values(newHotelData).returning();
  console.log(`  Created ${insertedHotels.length} additional hotels`);

  // Create rooms for new hotels
  const newRoomData = insertedHotels.flatMap((h) => [
    { hotelId: h.id, roomType: "Standard King", pricePerNight: h.priceFrom, capacity: 2, description: "Comfortable room with king bed" },
    { hotelId: h.id, roomType: "Deluxe Suite", pricePerNight: Math.round(h.priceFrom * 1.5), capacity: 3, description: "Spacious suite with separate living area" },
    { hotelId: h.id, roomType: "Premium Ocean View", pricePerNight: Math.round(h.priceFrom * 1.8), capacity: 2, description: "Premium room with panoramic view" },
  ]);

  const insertedRooms = await db.insert(hotelRooms).values(newRoomData).returning();
  console.log(`  Created ${insertedRooms.length} rooms for new hotels`);

  // --- Bookings ---
  // Get some existing hotels + rooms for bookings
  const allHotels = await db.select().from(hotels).limit(6);
  const allRooms = await db.select().from(hotelRooms);

  const getRoomForHotel = (hotelId: string) =>
    allRooms.find((r) => r.hotelId === hotelId)!;

  const bookingData = [
    {
      userId: adminId,
      hotelId: allHotels[0]!.id,
      roomId: getRoomForHotel(allHotels[0]!.id).id,
      checkIn: new Date("2026-04-10"),
      checkOut: new Date("2026-04-15"),
      guests: 2,
      status: "confirmed",
      totalPrice: 2250,
      notes: "Anniversary trip",
    },
    {
      userId: adminId,
      hotelId: allHotels[1]!.id,
      roomId: getRoomForHotel(allHotels[1]!.id).id,
      checkIn: new Date("2026-05-01"),
      checkOut: new Date("2026-05-04"),
      guests: 1,
      status: "pending",
      totalPrice: 840,
      notes: "Business travel",
    },
    {
      userId: userId,
      hotelId: allHotels[2]!.id,
      roomId: getRoomForHotel(allHotels[2]!.id).id,
      checkIn: new Date("2026-03-20"),
      checkOut: new Date("2026-03-25"),
      guests: 3,
      status: "confirmed",
      totalPrice: 1600,
      notes: "Family vacation",
    },
    {
      userId: userId,
      hotelId: allHotels[3]!.id,
      roomId: getRoomForHotel(allHotels[3]!.id).id,
      checkIn: new Date("2026-01-10"),
      checkOut: new Date("2026-01-12"),
      guests: 2,
      status: "completed",
      totalPrice: 1200,
      notes: "Weekend getaway - great experience",
    },
    {
      userId: adminId,
      hotelId: allHotels[4]!.id,
      roomId: getRoomForHotel(allHotels[4]!.id).id,
      checkIn: new Date("2026-02-14"),
      checkOut: new Date("2026-02-17"),
      guests: 2,
      status: "cancelled",
      totalPrice: 450,
      notes: "Cancelled due to schedule change",
    },
    {
      userId: userId,
      hotelId: allHotels[0]!.id,
      roomId: getRoomForHotel(allHotels[0]!.id).id,
      checkIn: new Date("2025-12-20"),
      checkOut: new Date("2025-12-27"),
      guests: 4,
      status: "completed",
      totalPrice: 3150,
      notes: "Christmas holiday trip",
    },
    {
      userId: adminId,
      hotelId: allHotels[5]!.id,
      roomId: getRoomForHotel(allHotels[5]!.id).id,
      checkIn: new Date("2026-06-01"),
      checkOut: new Date("2026-06-05"),
      guests: 2,
      status: "pending",
      totalPrice: 720,
      notes: "Summer vacation planning",
    },
  ];

  const insertedBookings = await db.insert(bookings).values(bookingData).returning();
  console.log(`  Created ${insertedBookings.length} bookings`);

  // --- Pricing Rules ---
  const pricingData = [
    {
      hotelId: allHotels[0]!.id,
      name: "Peak Season Summer",
      seasonStart: new Date("2026-06-01"),
      seasonEnd: new Date("2026-08-31"),
      multiplier: "1.50",
      minNights: 1,
      adminNotes: "Peak season pricing for summer months",
    },
    {
      hotelId: allHotels[0]!.id,
      name: "Low Season Discount",
      seasonStart: new Date("2026-09-01"),
      seasonEnd: new Date("2026-11-30"),
      multiplier: "0.80",
      minNights: 1,
      adminNotes: "Off-season discount to attract guests",
    },
    {
      hotelId: null,
      name: "Tet Holiday Surcharge",
      seasonStart: new Date("2026-01-25"),
      seasonEnd: new Date("2026-02-05"),
      multiplier: "2.00",
      minNights: 1,
      adminNotes: "Global Tet holiday surcharge for all hotels",
    },
    {
      hotelId: allHotels[2]!.id,
      name: "Long Stay Discount 7+",
      seasonStart: null,
      seasonEnd: null,
      multiplier: "0.85",
      minNights: 7,
      adminNotes: "15% discount for stays of 7 nights or more",
    },
    {
      hotelId: allHotels[4]!.id,
      name: "Christmas Holiday Rate",
      seasonStart: new Date("2026-12-20"),
      seasonEnd: new Date("2026-12-31"),
      multiplier: "1.80",
      minNights: 1,
      adminNotes: "Christmas and New Year premium rate",
    },
    {
      hotelId: allHotels[1]!.id,
      name: "Weekday Special",
      seasonStart: new Date("2026-03-01"),
      seasonEnd: new Date("2026-05-31"),
      multiplier: "0.90",
      minNights: 2,
      adminNotes: "Spring weekday discount for 2+ nights",
    },
  ];

  const insertedRules = await db.insert(pricingRules).values(pricingData).returning();
  console.log(`  Created ${insertedRules.length} pricing rules`);

  // --- Chat Sessions & Messages ---
  const sessionData = [
    { userId: userId, title: "Planning Phu Quoc trip" },
    { userId: userId, title: "Best hotels in Ha Noi" },
    { userId: adminId, title: "Da Nang travel recommendations" },
  ];

  const insertedSessions = await db.insert(chatSessions).values(sessionData).returning();
  console.log(`  Created ${insertedSessions.length} chat sessions`);

  const messageData = [
    // Session 1: Phu Quoc trip
    { sessionId: insertedSessions[0]!.id, role: "user", content: "I want to plan a trip to Phu Quoc for 5 days. Any suggestions?", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "assistant", content: "Phu Quoc is a beautiful island! For 5 days, I recommend staying at a beachfront resort. The best time is November to March for dry weather.", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "user", content: "What about hotels? I need something family-friendly with a pool.", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "assistant", content: "Vinpearl Resort Phu Quoc is an excellent choice for families. It has a large pool, private beach, spa, and kids activities. Prices start from $180/night.", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "user", content: "Can you check availability for April 10-15?", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "assistant", content: "Let me check the availability for Vinpearl Resort Phu Quoc from April 10-15. Standard King rooms are available at $180/night, total ~$900 for 5 nights.", metadata: {} },
    { sessionId: insertedSessions[0]!.id, role: "user", content: "Great, please book it!", metadata: {} },
    // Session 2: Ha Noi hotels
    { sessionId: insertedSessions[1]!.id, role: "user", content: "What are the best hotels in Ha Noi for a business trip?", metadata: {} },
    { sessionId: insertedSessions[1]!.id, role: "assistant", content: "For business travel in Ha Noi, I recommend JW Marriott Hotel Ha Noi (5-star, $250+) or Hanoi La Siesta Hotel (4-star, $65+) in the Old Quarter.", metadata: {} },
    { sessionId: insertedSessions[1]!.id, role: "user", content: "JW Marriott sounds good. What amenities do they have?", metadata: {} },
    { sessionId: insertedSessions[1]!.id, role: "assistant", content: "JW Marriott Ha Noi offers pool, spa, fine-dining, gym, free WiFi, and bar. It's close to the convention center, ideal for business travelers.", metadata: {} },
    { sessionId: insertedSessions[1]!.id, role: "user", content: "Do they have meeting rooms?", metadata: {} },
    // Session 3: Da Nang recommendations
    { sessionId: insertedSessions[2]!.id, role: "user", content: "I'm going to Da Nang next month. What should I see?", metadata: {} },
    { sessionId: insertedSessions[2]!.id, role: "assistant", content: "Da Nang highlights: My Khe Beach, Marble Mountains, Ba Na Hills (Golden Bridge), Dragon Bridge, and Han Market. Also visit nearby Hoi An Ancient Town.", metadata: {} },
    { sessionId: insertedSessions[2]!.id, role: "user", content: "Which hotel do you recommend near My Khe Beach?", metadata: {} },
    { sessionId: insertedSessions[2]!.id, role: "assistant", content: "Sala Danang Beach Hotel is right on My Khe Beach - 5-star with pool, spa, private beach access. Rooms start at $150/night. InterContinental Resort is another great option at $200/night.", metadata: {} },
    { sessionId: insertedSessions[2]!.id, role: "user", content: "How about food? Any local restaurants?", metadata: {} },
    { sessionId: insertedSessions[2]!.id, role: "assistant", content: "Must-try in Da Nang: Mi Quang (turmeric noodles), Banh Xeo (crispy pancakes), and seafood at Nam O Beach. Visit Thanh Hien for the freshest seafood!", metadata: {} },
  ];

  const insertedMessages = await db.insert(chatMessages).values(messageData).returning();
  console.log(`  Created ${insertedMessages.length} chat messages`);

  // --- Summary ---
  console.log("\n=== Seed Test Data Summary ===");
  console.log(`  Hotels:         ${insertedHotels.length}`);
  console.log(`  Hotel Rooms:    ${insertedRooms.length}`);
  console.log(`  Bookings:       ${insertedBookings.length}`);
  console.log(`  Pricing Rules:  ${insertedRules.length}`);
  console.log(`  Chat Sessions:  ${insertedSessions.length}`);
  console.log(`  Chat Messages:  ${insertedMessages.length}`);
  console.log("Seed test data completed!");

  await queryClient.end();
}

seedTestData().catch((err) => {
  console.error("Seed test data failed:", err);
  process.exit(1);
});
