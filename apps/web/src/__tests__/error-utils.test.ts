import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../lib/error-utils";

describe("getErrorMessage", () => {
  it("should extract message from Axios-like error response", () => {
    const err = {
      response: { data: { message: "Invalid credentials" } },
    };
    expect(getErrorMessage(err)).toBe("Invalid credentials");
  });

  it("should extract message from standard Error", () => {
    const err = new Error("Something went wrong");
    expect(getErrorMessage(err)).toBe("Something went wrong");
  });

  it("should return fallback for unknown error types", () => {
    expect(getErrorMessage(null)).toBe("Đã xảy ra lỗi, vui lòng thử lại.");
    expect(getErrorMessage(42)).toBe("Đã xảy ra lỗi, vui lòng thử lại.");
    expect(getErrorMessage(undefined)).toBe("Đã xảy ra lỗi, vui lòng thử lại.");
  });

  it("should prefer Axios error message over Error.message", () => {
    const err = {
      message: "Network Error",
      response: { data: { message: "Server says no" } },
    };
    expect(getErrorMessage(err)).toBe("Server says no");
  });

  it("should return fallback for object without response.data.message and not Error instance", () => {
    const err = {
      message: "Network Error",
      response: { data: {} },
    };
    // Plain object (not instanceof Error), so falls to default
    expect(getErrorMessage(err)).toBe("Đã xảy ra lỗi, vui lòng thử lại.");
  });

  it("should extract message from a real Error instance", () => {
    const err = new Error("Network Error");
    expect(getErrorMessage(err)).toBe("Network Error");
  });
});
