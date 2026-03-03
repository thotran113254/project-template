import { db, queryClient } from "./connection";
import { users, resources } from "./schema";
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

  console.log("Seed completed!");
  await queryClient.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
