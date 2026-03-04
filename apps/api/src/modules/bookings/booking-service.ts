import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { bookings, hotelRooms } from "../../db/schema/index.js";
import type { Booking, CreateBookingDto, UpdateBookingDto } from "@app/shared";

function toBooking(row: typeof bookings.$inferSelect): Booking {
  return {
    ...row,
    status: row.status as Booking["status"],
    checkIn: row.checkIn.toISOString(),
    checkOut: row.checkOut.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function canAccessBooking(
  booking: typeof bookings.$inferSelect,
  userId: string,
  role: string,
): boolean {
  return role === "admin" || booking.userId === userId;
}

function calcNights(checkIn: string, checkOut: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay,
  );
  return Math.max(1, nights);
}

export async function listBookings(userId: string, role: string): Promise<Booking[]> {
  const rows =
    role === "admin"
      ? await db.select().from(bookings)
      : await db.select().from(bookings).where(eq(bookings.userId, userId));
  return rows.map(toBooking);
}

export async function getBookingById(
  id: string,
  userId: string,
  role: string,
): Promise<Booking> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) throw new HTTPException(404, { message: "Booking not found" });
  if (!canAccessBooking(booking, userId, role))
    throw new HTTPException(403, { message: "Access denied" });
  return toBooking(booking);
}

export async function createBooking(dto: CreateBookingDto, userId: string): Promise<Booking> {
  const [room] = await db
    .select({ pricePerNight: hotelRooms.pricePerNight })
    .from(hotelRooms)
    .where(eq(hotelRooms.id, dto.roomId))
    .limit(1);

  if (!room) throw new HTTPException(404, { message: "Room not found" });

  const nights = calcNights(dto.checkIn, dto.checkOut);
  const totalPrice = room.pricePerNight * nights;

  const [booking] = await db
    .insert(bookings)
    .values({
      userId,
      hotelId: dto.hotelId,
      roomId: dto.roomId,
      checkIn: new Date(dto.checkIn),
      checkOut: new Date(dto.checkOut),
      guests: dto.guests ?? 1,
      status: "pending",
      totalPrice,
      notes: dto.notes ?? "",
    })
    .returning();

  return toBooking(booking!);
}

export async function updateBooking(
  id: string,
  dto: UpdateBookingDto,
  userId: string,
  role: string,
): Promise<Booking> {
  const [existing] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Booking not found" });
  if (!canAccessBooking(existing, userId, role))
    throw new HTTPException(403, { message: "Access denied" });

  const [updated] = await db
    .update(bookings)
    .set({ ...dto, updatedAt: sql`now()` })
    .where(eq(bookings.id, id))
    .returning();

  return toBooking(updated!);
}

export async function deleteBooking(
  id: string,
  userId: string,
  role: string,
): Promise<void> {
  const [existing] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Booking not found" });
  if (!canAccessBooking(existing, userId, role))
    throw new HTTPException(403, { message: "Access denied" });
  await db.delete(bookings).where(eq(bookings.id, id));
}
