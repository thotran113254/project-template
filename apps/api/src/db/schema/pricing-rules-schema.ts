import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { hotels } from "./hotels-schema";

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id").references(() => hotels.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    seasonStart: timestamp("season_start", { withTimezone: true }),
    seasonEnd: timestamp("season_end", { withTimezone: true }),
    multiplier: numeric("multiplier", { precision: 5, scale: 2 })
      .notNull()
      .default("1.00"),
    minNights: integer("min_nights").default(1),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("pricing_rules_hotel_id_idx").on(table.hotelId)],
);

export type PricingRuleRecord = typeof pricingRules.$inferSelect;
export type NewPricingRuleRecord = typeof pricingRules.$inferInsert;
