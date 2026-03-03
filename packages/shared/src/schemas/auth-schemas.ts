import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(100).optional(),
  email: z.string().email("Email không hợp lệ").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z
    .string()
    .min(6, "Mật khẩu mới tối thiểu 6 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
