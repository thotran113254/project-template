import { z } from "zod";

export const createKbArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().max(50000).optional(),
  category: z.string().min(1, "Category is required").max(100),
  tags: z.array(z.string().max(50)).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const updateKbArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(50000).optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const kbQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export type CreateKbArticleInput = z.infer<typeof createKbArticleSchema>;
export type UpdateKbArticleInput = z.infer<typeof updateKbArticleSchema>;
export type KbQueryInput = z.infer<typeof kbQuerySchema>;
