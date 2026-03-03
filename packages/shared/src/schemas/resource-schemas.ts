import { z } from "zod";
import { RESOURCE_CATEGORIES } from "../constants/resource-constants";

const validCategories = RESOURCE_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export const createResourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500),
  category: z.enum(validCategories, {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  metadata: z.record(z.string()).optional(),
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z
    .enum(validCategories, {
      errorMap: () => ({ message: "Invalid category" }),
    })
    .optional(),
  metadata: z.record(z.string()).optional(),
});

export const resourceActionSchema = z.object({
  action: z.enum(["activate", "deactivate", "archive", "restore"]),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceActionInput = z.infer<typeof resourceActionSchema>;
