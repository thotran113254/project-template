import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users-schema";

export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull().default(""),
    category: varchar("category", { length: 100 }).notNull(),
    tags: jsonb("tags").notNull().default([]),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    sourceUrl: varchar("source_url", { length: 1000 }),
    sourceType: varchar("source_type", { length: 50 }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("knowledge_base_category_idx").on(table.category),
    index("knowledge_base_status_idx").on(table.status),
    index("knowledge_base_created_by_idx").on(table.createdBy),
  ],
);

export type KnowledgeBaseRecord = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBaseRecord = typeof knowledgeBase.$inferInsert;
