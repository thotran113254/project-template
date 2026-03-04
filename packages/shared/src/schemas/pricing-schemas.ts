import { z } from "zod";

export const createPricingRuleSchema = z.object({
  hotelId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(255),
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional(),
  multiplier: z.number().positive().optional(),
  minNights: z.number().int().positive().optional(),
  adminNotes: z.string().max(1000).optional(),
});

export const updatePricingRuleSchema = z.object({
  hotelId: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional(),
  multiplier: z.number().positive().optional(),
  minNights: z.number().int().positive().optional(),
  adminNotes: z.string().max(1000).optional(),
});

export const calculatePriceSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().int().positive("Guests must be a positive integer"),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
