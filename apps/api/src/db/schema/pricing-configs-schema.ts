import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { markets } from "./markets-schema";
import { marketProperties } from "./market-properties-schema";

export const pricingConfigs = pgTable(
  "pricing_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => marketProperties.id, { onDelete: "cascade" }),
    ruleName: varchar("rule_name", { length: 255 }).notNull(),
    ruleType: varchar("rule_type", { length: 50 }).notNull(),
    config: jsonb("config").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    aiVisible: boolean("ai_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("pricing_configs_market_id_idx").on(table.marketId),
    index("pricing_configs_property_id_idx").on(table.propertyId),
  ],
);

export type PricingConfigRecord = typeof pricingConfigs.$inferSelect;
export type NewPricingConfigRecord = typeof pricingConfigs.$inferInsert;
