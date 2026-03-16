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

export const marketAttractions = pgTable(
  "market_attractions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }),
    position: text("position"),
    natureDescription: text("nature_description"),
    experienceValue: text("experience_value"),
    popularity: varchar("popularity", { length: 50 }),
    bestTime: text("best_time"),
    costInfo: text("cost_info"),
    suitableFor: text("suitable_for"),
    connectivity: text("connectivity"),
    risks: text("risks"),
    images: jsonb("images").default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_attractions_market_id_idx").on(table.marketId)],
);

export type MarketAttractionRecord = typeof marketAttractions.$inferSelect;
export type NewMarketAttractionRecord = typeof marketAttractions.$inferInsert;
