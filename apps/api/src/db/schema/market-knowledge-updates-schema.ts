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
import { users } from "./users-schema";

export const marketKnowledgeUpdates = pgTable(
  "market_knowledge_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
    aspect: varchar("aspect", { length: 100 }).notNull(),
    knowledge: text("knowledge").notNull(),
    // FB-13 workflow fields
    status: varchar("status", { length: 20 }).notNull().default("approved"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),
    aiVisible: boolean("ai_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("market_knowledge_market_id_idx").on(table.marketId),
    index("market_knowledge_status_idx").on(table.status),
    index("market_knowledge_created_by_idx").on(table.createdBy),
  ],
);

export type MarketKnowledgeUpdateRecord = typeof marketKnowledgeUpdates.$inferSelect;
export type NewMarketKnowledgeUpdateRecord = typeof marketKnowledgeUpdates.$inferInsert;

export const KNOWLEDGE_ASPECTS = [
  "Văn hóa", "Khí hậu", "Giao thông", "An ninh",
  "Dịch vụ", "Giá cả", "Mua sắm", "Ẩm thực",
  "Lưu trú", "Hoạt động", "Khác",
] as const;
