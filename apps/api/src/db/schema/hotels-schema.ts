import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const hotels = pgTable(
  "hotels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull().default(""),
    location: varchar("location", { length: 255 }).notNull(),
    starRating: integer("star_rating").notNull().default(5),
    images: jsonb("images").notNull().default([]),
    amenities: jsonb("amenities").notNull().default([]),
    priceFrom: integer("price_from").notNull().default(0),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hotels_slug_idx").on(table.slug),
    index("hotels_location_idx").on(table.location),
  ],
);

export type HotelRecord = typeof hotels.$inferSelect;
export type NewHotelRecord = typeof hotels.$inferInsert;
