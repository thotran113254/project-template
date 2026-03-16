import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users-schema";

export const aiDataSettings = pgTable(
  "ai_data_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dataCategory: varchar("data_category", { length: 50 }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ai_data_settings_category_idx").on(table.dataCategory)],
);

export type AiDataSettingRecord = typeof aiDataSettings.$inferSelect;
export type NewAiDataSettingRecord = typeof aiDataSettings.$inferInsert;
