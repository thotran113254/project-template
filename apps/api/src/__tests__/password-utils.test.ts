import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../lib/password-utils.js";

describe("password-utils", () => {
  it("should hash a password and return a bcrypt string", async () => {
    const hash = await hashPassword("MySecret123");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("MySecret123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("should return true when comparing correct password", async () => {
    const hash = await hashPassword("CorrectPassword");
    const result = await comparePassword("CorrectPassword", hash);
    expect(result).toBe(true);
  });

  it("should return false when comparing wrong password", async () => {
    const hash = await hashPassword("CorrectPassword");
    const result = await comparePassword("WrongPassword", hash);
    expect(result).toBe(false);
  });

  it("should produce different hashes for the same input (salt)", async () => {
    const hash1 = await hashPassword("SamePassword");
    const hash2 = await hashPassword("SamePassword");
    expect(hash1).not.toBe(hash2);
  });
});
