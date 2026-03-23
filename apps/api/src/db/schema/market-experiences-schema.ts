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

export const marketExperiences = pgTable(
  "market_experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    activityName: varchar("activity_name", { length: 255 }).notNull(),
    cost: text("cost"),
    description: text("description"),
    images: jsonb("images").default([]),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("market_experiences_market_id_idx").on(table.marketId),
  ],
);

export type MarketExperienceRecord = typeof marketExperiences.$inferSelect;
export type NewMarketExperienceRecord = typeof marketExperiences.$inferInsert;
