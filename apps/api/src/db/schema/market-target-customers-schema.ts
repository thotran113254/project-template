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

export const marketTargetCustomers = pgTable(
  "market_target_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    segmentName: varchar("segment_name", { length: 100 }).notNull(),
    ageRange: varchar("age_range", { length: 50 }),
    gender: varchar("gender", { length: 50 }),
    occupation: text("occupation"),
    incomeRange: varchar("income_range", { length: 100 }),
    location: text("location"),
    travelMotivation: text("travel_motivation"),
    bookingHabits: text("booking_habits"),
    stayDuration: varchar("stay_duration", { length: 100 }),
    travelFrequency: varchar("travel_frequency", { length: 100 }),
    primaryChannels: text("primary_channels"),
    contentInterests: text("content_interests"),
    painPoints: text("pain_points"),
    preferences: text("preferences"),
    trustFactors: text("trust_factors"),
    decisionFactors: text("decision_factors"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_target_customers_market_id_idx").on(table.marketId)],
);

export type MarketTargetCustomerRecord = typeof marketTargetCustomers.$inferSelect;
export type NewMarketTargetCustomerRecord = typeof marketTargetCustomers.$inferInsert;
