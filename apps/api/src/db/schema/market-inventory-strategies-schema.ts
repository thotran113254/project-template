import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { markets } from "./markets-schema";

export const marketInventoryStrategies = pgTable(
  "market_inventory_strategies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    monthRange: varchar("month_range", { length: 50 }).notNull(),
    seasonName: varchar("season_name", { length: 100 }),
    demandLevel: varchar("demand_level", { length: 50 }),
    priceVariation: text("price_variation"),
    holdingType: varchar("holding_type", { length: 20 }),
    targetSegment: text("target_segment"),
    applicablePeriods: text("applicable_periods"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_inventory_strategies_market_id_idx").on(table.marketId)],
);

export type MarketInventoryStrategyRecord = typeof marketInventoryStrategies.$inferSelect;
export type NewMarketInventoryStrategyRecord = typeof marketInventoryStrategies.$inferInsert;
