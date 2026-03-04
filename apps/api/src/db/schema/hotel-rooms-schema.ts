import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { hotels } from "./hotels-schema";

export const hotelRooms = pgTable(
  "hotel_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomType: varchar("room_type", { length: 100 }).notNull(),
    pricePerNight: integer("price_per_night").notNull().default(0),
    capacity: integer("capacity").notNull().default(2),
    description: text("description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hotel_rooms_hotel_id_idx").on(table.hotelId)],
);

export type HotelRoomRecord = typeof hotelRooms.$inferSelect;
export type NewHotelRoomRecord = typeof hotelRooms.$inferInsert;
