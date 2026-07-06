jest.mock("../config/db", () => ({ query: jest.fn() }));

const pool = require("../config/db");
const {
  trackFailedAttempt,
  resetLoginAttempts,
  isAccountLocked,
  getLockoutTimeRemaining,
  normalizeUsername,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} = require("../services/loginAttempt.service");

describe("loginAttempt.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeUsername", () => {
    it("lowercases and trims", () => {
      expect(normalizeUsername("  TestUser  ")).toBe("testuser");
    });
  });

  describe("trackFailedAttempt", () => {
    it("increments failed attempts and returns not locked when below MAX", async () => {
      pool.query.mockResolvedValue({
        rows: [{ failed_login_attempts: 3, locked_until: null }],
      });

      const result = await trackFailedAttempt("testuser");
      expect(result.attempts).toBe(3);
      expect(result.locked).toBe(false);
    });

    it("returns locked=true when locked_until is in the future", async () => {
      const future = new Date(Date.now() + 60000).toISOString();
      pool.query.mockResolvedValue({
        rows: [{ failed_login_attempts: 5, locked_until: future }],
      });

      const result = await trackFailedAttempt("testuser");
      expect(result.locked).toBe(true);
    });

    it("returns attempts=0 locked=false when user not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await trackFailedAttempt("nonexistent");
      expect(result).toEqual({ attempts: 0, locked: false });
    });
  });

  describe("resetLoginAttempts", () => {
    it("resets failed login fields", async () => {
      pool.query.mockResolvedValue({});
      await resetLoginAttempts("testuser");
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe("isAccountLocked", () => {
    it("returns true when locked_until is in the future", async () => {
      const future = new Date(Date.now() + 60000).toISOString();
      pool.query.mockResolvedValue({ rows: [{ locked_until: future }] });

      const result = await isAccountLocked("testuser");
      expect(result).toBe(true);
    });

    it("returns false when user not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await isAccountLocked("nonexistent");
      expect(result).toBe(false);
    });

    it("returns false when locked_until is null", async () => {
      pool.query.mockResolvedValue({ rows: [{ locked_until: null }] });
      const result = await isAccountLocked("testuser");
      expect(result).toBe(false);
    });
  });

  describe("getLockoutTimeRemaining", () => {
    it("returns remaining seconds", async () => {
      pool.query.mockResolvedValue({ rows: [{ remaining: "120" }] });
      const result = await getLockoutTimeRemaining("testuser");
      expect(result).toBe(120);
    });

    it("returns 0 when user not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getLockoutTimeRemaining("nonexistent");
      expect(result).toBe(0);
    });

    it("returns 0 when remaining is negative", async () => {
      pool.query.mockResolvedValue({ rows: [{ remaining: "-10" }] });
      const result = await getLockoutTimeRemaining("testuser");
      expect(result).toBe(0);
    });
  });

  describe("constants", () => {
    it("exports correct lockout threshold", () => {
      expect(MAX_LOGIN_ATTEMPTS).toBe(5);
      expect(LOCKOUT_DURATION_MINUTES).toBe(15);
    });
  });
});
