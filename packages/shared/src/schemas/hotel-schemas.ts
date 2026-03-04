import { z } from "zod";

export const createHotelSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional(),
  location: z.string().min(1, "Location is required").max(255),
  starRating: z.number().int().min(1).max(5).optional(),
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
  priceFrom: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateHotelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().min(1).max(255).optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
  priceFrom: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createHotelRoomSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomType: z.string().min(1, "Room type is required").max(100),
  pricePerNight: z.number().positive("Price per night must be positive"),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

export const updateHotelRoomSchema = z.object({
  roomType: z.string().min(1).max(100).optional(),
  pricePerNight: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

export const hotelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  location: z.string().optional(),
  minStars: z.coerce.number().int().min(1).max(5).optional(),
  maxPrice: z.coerce.number().positive().optional(),
});

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type CreateHotelRoomInput = z.infer<typeof createHotelRoomSchema>;
export type UpdateHotelRoomInput = z.infer<typeof updateHotelRoomSchema>;
export type HotelQueryInput = z.infer<typeof hotelQuerySchema>;
