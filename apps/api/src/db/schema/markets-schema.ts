import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const markets = pgTable(
  "markets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    region: varchar("region", { length: 100 }),
    geography: text("geography"),
    seasonInfo: text("season_info"),
    weatherInfo: text("weather_info"),
    highlights: text("highlights"),
    travelTips: text("travel_tips"),
    localSpecialties: jsonb("local_specialties").default([]),
    accommodationOverview: text("accommodation_overview"),
    visitorStats: jsonb("visitor_stats").default({}),
    images: jsonb("images").default([]),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("markets_slug_idx").on(table.slug)],
);

export type MarketRecord = typeof markets.$inferSelect;
export type NewMarketRecord = typeof markets.$inferInsert;
