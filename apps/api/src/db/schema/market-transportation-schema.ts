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

export const marketTransportation = pgTable(
  "market_transportation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    routeSegment: varchar("route_segment", { length: 255 }).notNull(),
    transportType: varchar("transport_type", { length: 50 }).notNull(),
    departurePoints: text("departure_points"),
    arrivalPoints: text("arrival_points"),
    duration: varchar("duration", { length: 100 }),
    costInfo: text("cost_info"),
    convenienceNotes: text("convenience_notes"),
    packageIntegration: text("package_integration"),
    suitableFor: text("suitable_for"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_transportation_market_id_idx").on(table.marketId)],
);

export type MarketTransportationRecord = typeof marketTransportation.$inferSelect;
export type NewMarketTransportationRecord = typeof marketTransportation.$inferInsert;
