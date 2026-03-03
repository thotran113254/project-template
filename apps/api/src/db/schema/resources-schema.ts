import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users-schema";

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description").notNull().default(""),
    status: varchar("status", { length: 20 }).notNull().default("inactive"),
    category: varchar("category", { length: 100 }).notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    userId: uuid("user_id")
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
    index("resources_user_id_idx").on(table.userId),
    index("resources_status_idx").on(table.status),
    uniqueIndex("resources_slug_idx").on(table.slug),
  ],
);

export type ResourceRecord = typeof resources.$inferSelect;
export type NewResourceRecord = typeof resources.$inferInsert;
