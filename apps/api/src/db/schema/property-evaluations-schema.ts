import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { marketProperties } from "./market-properties-schema";
import { evaluationCriteria } from "./evaluation-criteria-schema";

export const propertyEvaluations = pgTable(
  "property_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull().references(() => marketProperties.id, { onDelete: "cascade" }),
    criteriaId: uuid("criteria_id").notNull().references(() => evaluationCriteria.id),
    value: text("value"),
    notes: text("notes"),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("property_evaluations_prop_criteria_idx").on(table.propertyId, table.criteriaId),
  ],
);

export type PropertyEvaluationRecord = typeof propertyEvaluations.$inferSelect;
export type NewPropertyEvaluationRecord = typeof propertyEvaluations.$inferInsert;
