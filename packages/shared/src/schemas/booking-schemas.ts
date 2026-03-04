import { z } from "zod";

export const createBookingSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  notes: z.string().max(1000).optional(),
  guests: z.number().int().positive().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
