import { z } from "zod";

export const createChatSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
