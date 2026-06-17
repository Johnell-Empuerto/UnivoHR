const { validatePassword } = require("../utils/passwordValidator");

describe("validatePassword", () => {
  test("accepts a strong password", () => {
    const errors = validatePassword("Str0ng!Pass", "user1");
    expect(errors).toEqual([]);
  });

  test("rejects empty password", () => {
    const errors = validatePassword("");
    expect(errors).not.toEqual([]);
    expect(errors[0]).toBe("Password is required");
  });

  test("rejects null password", () => {
    const errors = validatePassword(null);
    expect(errors).not.toEqual([]);
  });

  test("rejects password shorter than 8 characters", () => {
    const errors = validatePassword("Abc1!x");
    expect(errors).toEqual(
      expect.arrayContaining(["Password must be at least 8 characters"]),
    );
  });

  test("rejects password exceeding 128 characters", () => {
    const longPwd = "A1!" + "x".repeat(130);
    const errors = validatePassword(longPwd);
    expect(errors).toEqual(
      expect.arrayContaining(["Password must not exceed 128 characters"]),
    );
  });

  test("rejects password without uppercase letter", () => {
    const errors = validatePassword("weak1!pass");
    expect(errors).toEqual(
      expect.arrayContaining([
        "Password must contain at least one uppercase letter",
      ]),
    );
  });

  test("rejects password without lowercase letter", () => {
    const errors = validatePassword("WEAK1!PASS");
    expect(errors).toEqual(
      expect.arrayContaining([
        "Password must contain at least one lowercase letter",
      ]),
    );
  });

  test("rejects password without number", () => {
    const errors = validatePassword("Weak!Pass");
    expect(errors).toEqual(
      expect.arrayContaining(["Password must contain at least one number"]),
    );
  });

  test("rejects password without special character", () => {
    const errors = validatePassword("Weak1Pass");
    expect(errors).toEqual(
      expect.arrayContaining([
        "Password must contain at least one special character",
      ]),
    );
  });

  test("rejects password with spaces", () => {
    const errors = validatePassword("Weak1! Pass");
    expect(errors).toEqual(
      expect.arrayContaining(["Password must not contain spaces"]),
    );
  });

  test("rejects password containing username", () => {
    const errors = validatePassword("Str0ng!user1Pass", "user1");
    expect(errors).toEqual(
      expect.arrayContaining(["Password must not contain your username"]),
    );
  });

  test("rejects password containing username case-insensitively", () => {
    const errors = validatePassword("Str0ng!USER1Pass", "user1");
    expect(errors).toEqual(
      expect.arrayContaining(["Password must not contain your username"]),
    );
  });

  test("returns multiple errors for multiple violations", () => {
    const errors = validatePassword("short", "user1");
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
