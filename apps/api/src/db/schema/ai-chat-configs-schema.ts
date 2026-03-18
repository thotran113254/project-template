import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Admin-configurable AI chat settings: model params, prompt sections, behavior controls.
 *  All values stored as text — parsed by config service based on config_type. */
export const aiChatConfigs = pgTable(
  "ai_chat_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    configKey: varchar("config_key", { length: 100 }).notNull(),
    configValue: text("config_value").notNull(),
    configType: varchar("config_type", { length: 20 }).notNull().default("string"),
    category: varchar("category", { length: 30 }).notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_chat_configs_key_idx").on(table.configKey),
  ],
);

export type AiChatConfigRecord = typeof aiChatConfigs.$inferSelect;
export type NewAiChatConfigRecord = typeof aiChatConfigs.$inferInsert;
