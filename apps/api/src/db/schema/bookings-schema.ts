import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users-schema";
import { hotels } from "./hotels-schema";
import { hotelRooms } from "./hotel-rooms-schema";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => hotelRooms.id, { onDelete: "cascade" }),
    checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
    checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
    guests: integer("guests").notNull().default(1),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    totalPrice: integer("total_price").notNull().default(0),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_hotel_id_idx").on(table.hotelId),
    index("bookings_status_idx").on(table.status),
  ],
);

export type BookingRecord = typeof bookings.$inferSelect;
export type NewBookingRecord = typeof bookings.$inferInsert;
