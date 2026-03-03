import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(128),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
