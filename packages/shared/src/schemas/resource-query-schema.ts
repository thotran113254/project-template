import { z } from "zod";
import { paginationQuerySchema } from "./pagination-schema";

export const resourceQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export type ResourceQuery = z.infer<typeof resourceQuerySchema>;
