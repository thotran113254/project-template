import { eq, and, ilike, or, count, sql, desc, gte, lte, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { hotels, hotelRooms } from "../../db/schema/index.js";
import type {
  Hotel,
  HotelRoom,
  CreateHotelDto,
  UpdateHotelDto,
  CreateHotelRoomDto,
  UpdateHotelRoomDto,
  HotelQuery,
  PaginationMeta,
} from "@app/shared";

function toHotel(row: typeof hotels.$inferSelect): Hotel {
  return {
    ...row,
    images: (row.images ?? []) as string[],
    amenities: (row.amenities ?? []) as string[],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toHotelRoom(row: typeof hotelRooms.$inferSelect): HotelRoom {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;

  while (attempt < 10) {
    const condition = excludeId
      ? sql`${hotels.slug} = ${slug} AND ${hotels.id} != ${excludeId}`
      : eq(hotels.slug, slug);
    const [existing] = await db
      .select({ id: hotels.id })
      .from(hotels)
      .where(condition)
      .limit(1);

    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }

  return `${base}-${Date.now()}`;
}

export async function listHotels(
  query: HotelQuery,
): Promise<{ data: Hotel[]; meta: PaginationMeta }> {
  const { page, limit, search, location, minStars, maxPrice } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(ilike(hotels.name, pattern), ilike(hotels.location, pattern))!);
  }
  if (location) conditions.push(ilike(hotels.location, `%${location}%`));
  if (minStars !== undefined) conditions.push(gte(hotels.starRating, minStars));
  if (maxPrice !== undefined) conditions.push(lte(hotels.priceFrom, maxPrice));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countResult]] = await Promise.all([
    whereClause
      ? db.select().from(hotels).where(whereClause).orderBy(desc(hotels.createdAt)).limit(limit).offset(offset)
      : db.select().from(hotels).orderBy(desc(hotels.createdAt)).limit(limit).offset(offset),
    whereClause
      ? db.select({ total: count() }).from(hotels).where(whereClause)
      : db.select({ total: count() }).from(hotels),
  ]);

  return {
    data: rows.map(toHotel),
    meta: {
      page,
      limit,
      total: countResult!.total,
      totalPages: Math.ceil(countResult!.total / limit),
    },
  };
}

export async function getHotelById(id: string): Promise<Hotel> {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!hotel) throw new HTTPException(404, { message: "Hotel not found" });
  return toHotel(hotel);
}

export async function getHotelBySlug(slug: string): Promise<Hotel> {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.slug, slug)).limit(1);
  if (!hotel) throw new HTTPException(404, { message: "Hotel not found" });
  return toHotel(hotel);
}

export async function createHotel(dto: CreateHotelDto): Promise<Hotel> {
  const slug = await generateUniqueSlug(dto.name);
  const [hotel] = await db
    .insert(hotels)
    .values({
      name: dto.name,
      slug,
      description: dto.description ?? "",
      location: dto.location,
      starRating: dto.starRating ?? 5,
      images: dto.images ?? [],
      amenities: dto.amenities ?? [],
      priceFrom: dto.priceFrom ?? 0,
      metadata: dto.metadata ?? {},
    })
    .returning();
  return toHotel(hotel!);
}

export async function updateHotel(id: string, dto: UpdateHotelDto): Promise<Hotel> {
  const [existing] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Hotel not found" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFields: Record<string, any> = { ...dto, updatedAt: sql`now()` };
  if (dto.name) updateFields.slug = await generateUniqueSlug(dto.name, id);

  const [updated] = await db.update(hotels).set(updateFields).where(eq(hotels.id, id)).returning();
  return toHotel(updated!);
}

export async function deleteHotel(id: string): Promise<void> {
  const [existing] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Hotel not found" });
  await db.delete(hotels).where(eq(hotels.id, id));
}

export async function listRooms(hotelId: string): Promise<HotelRoom[]> {
  const rows = await db.select().from(hotelRooms).where(eq(hotelRooms.hotelId, hotelId));
  return rows.map(toHotelRoom);
}

export async function createRoom(dto: CreateHotelRoomDto): Promise<HotelRoom> {
  const [room] = await db
    .insert(hotelRooms)
    .values({
      hotelId: dto.hotelId,
      roomType: dto.roomType,
      pricePerNight: dto.pricePerNight,
      capacity: dto.capacity ?? 2,
      description: dto.description ?? "",
    })
    .returning();
  return toHotelRoom(room!);
}

export async function updateRoom(id: string, dto: UpdateHotelRoomDto): Promise<HotelRoom> {
  const [existing] = await db.select().from(hotelRooms).where(eq(hotelRooms.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Room not found" });

  const [updated] = await db
    .update(hotelRooms)
    .set({ ...dto, updatedAt: sql`now()` })
    .where(eq(hotelRooms.id, id))
    .returning();
  return toHotelRoom(updated!);
}

export async function deleteRoom(id: string): Promise<void> {
  const [existing] = await db.select().from(hotelRooms).where(eq(hotelRooms.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Room not found" });
  await db.delete(hotelRooms).where(eq(hotelRooms.id, id));
}
