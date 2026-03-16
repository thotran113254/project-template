import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { marketProperties } from "./market-properties-schema";

export const propertyRooms = pgTable(
  "property_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull().references(() => marketProperties.id, { onDelete: "cascade" }),
    roomType: varchar("room_type", { length: 255 }).notNull(),
    bookingCode: varchar("booking_code", { length: 50 }),
    capacity: integer("capacity").notNull().default(2),
    description: text("description"),
    amenities: jsonb("amenities").default([]),
    images: jsonb("images").default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("property_rooms_property_id_idx").on(table.propertyId)],
);

export type PropertyRoomRecord = typeof propertyRooms.$inferSelect;
export type NewPropertyRoomRecord = typeof propertyRooms.$inferInsert;
