import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { markets } from "./markets-schema";

export const marketDiningSpots = pgTable(
  "market_dining_spots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    address: text("address"),
    priceRange: varchar("price_range", { length: 100 }),
    priceLevel: varchar("price_level", { length: 20 }),
    notableFeatures: text("notable_features"),
    cuisineType: varchar("cuisine_type", { length: 100 }),
    operatingHours: varchar("operating_hours", { length: 100 }),
    contactInfo: jsonb("contact_info").default({}),
    images: jsonb("images").default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("market_dining_spots_market_id_idx").on(table.marketId),
    index("market_dining_spots_category_idx").on(table.category),
  ],
);

export type MarketDiningSpotRecord = typeof marketDiningSpots.$inferSelect;
export type NewMarketDiningSpotRecord = typeof marketDiningSpots.$inferInsert;
