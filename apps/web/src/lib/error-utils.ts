import type { AxiosError } from "axios";

/**
 * Extract user-friendly error message from API or validation errors.
 * Handles Axios errors (server message in response.data.message),
 * standard Error objects, and unknown error types.
 */
export function getErrorMessage(err: unknown): string {
  // Axios error with server message
  const axiosErr = err as AxiosError<{ message?: string }>;
  if (axiosErr?.response?.data?.message) {
    return axiosErr.response.data.message;
  }

  // Standard Error
  if (err instanceof Error) return err.message;

  return "Đã xảy ra lỗi, vui lòng thử lại.";
}
