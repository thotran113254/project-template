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

export const marketCompetitors = pgTable(
  "market_competitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    groupName: varchar("group_name", { length: 255 }).notNull(),
    description: text("description"),
    examples: text("examples"),
    mainChannels: text("main_channels"),
    implementation: text("implementation"),
    effectiveness: varchar("effectiveness", { length: 50 }),
    strengths: text("strengths"),
    weaknesses: text("weaknesses"),
    competitionDensity: text("competition_density"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("market_competitors_market_id_idx").on(table.marketId)],
);

export type MarketCompetitorRecord = typeof marketCompetitors.$inferSelect;
export type NewMarketCompetitorRecord = typeof marketCompetitors.$inferInsert;
