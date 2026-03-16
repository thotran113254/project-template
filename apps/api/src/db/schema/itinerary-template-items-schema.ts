import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { itineraryTemplates } from "./itinerary-templates-schema";

export const itineraryTemplateItems = pgTable(
  "itinerary_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id").notNull().references(() => itineraryTemplates.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    timeOfDay: varchar("time_of_day", { length: 20 }).notNull(),
    timeStart: varchar("time_start", { length: 10 }),
    timeEnd: varchar("time_end", { length: 10 }),
    activity: text("activity").notNull(),
    location: varchar("location", { length: 255 }),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("itinerary_template_items_template_id_idx").on(table.templateId)],
);

export type ItineraryTemplateItemRecord = typeof itineraryTemplateItems.$inferSelect;
export type NewItineraryTemplateItemRecord = typeof itineraryTemplateItems.$inferInsert;
