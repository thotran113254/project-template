import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { markets } from "./markets-schema";

export const evaluationCriteria = pgTable(
  "evaluation_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").references(() => markets.id, { onDelete: "set null" }),
    category: varchar("category", { length: 100 }).notNull(),
    subcategory: varchar("subcategory", { length: 100 }),
    criteriaName: varchar("criteria_name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("evaluation_criteria_market_id_idx").on(table.marketId)],
);

export type EvaluationCriteriaRecord = typeof evaluationCriteria.$inferSelect;
export type NewEvaluationCriteriaRecord = typeof evaluationCriteria.$inferInsert;
