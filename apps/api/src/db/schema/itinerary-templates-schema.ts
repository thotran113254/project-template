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

export const itineraryTemplates = pgTable(
  "itinerary_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    durationDays: integer("duration_days").notNull(),
    durationNights: integer("duration_nights").notNull(),
    theme: varchar("theme", { length: 50 }),
    description: text("description"),
    highlights: jsonb("highlights").default([]),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    aiVisible: boolean("ai_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("itinerary_templates_market_id_idx").on(table.marketId)],
);

export type ItineraryTemplateRecord = typeof itineraryTemplates.$inferSelect;
export type NewItineraryTemplateRecord = typeof itineraryTemplates.$inferInsert;
