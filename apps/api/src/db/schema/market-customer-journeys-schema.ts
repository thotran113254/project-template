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

export const marketCustomerJourneys = pgTable(
  "market_customer_journeys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    phaseName: varchar("phase_name", { length: 100 }),
    stageOrder: integer("stage_order").notNull(),
    stageName: varchar("stage_name", { length: 255 }).notNull(),
    customerActions: text("customer_actions"),
    touchpoints: text("touchpoints"),
    painpoints: text("painpoints"),
    customerInfoNeeds: text("customer_info_needs"),
    businessTouchpoints: text("business_touchpoints"),
    extendedDetails: text("extended_details"),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_customer_journeys_market_id_idx").on(table.marketId)],
);

export type MarketCustomerJourneyRecord = typeof marketCustomerJourneys.$inferSelect;
export type NewMarketCustomerJourneyRecord = typeof marketCustomerJourneys.$inferInsert;
