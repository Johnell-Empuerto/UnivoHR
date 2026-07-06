jest.mock("../config/redis", () => ({
  setEx: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
}));

const redisClient = require("../config/redis");
const {
  normalizeUsername,
  invalidateUserCache,
  cacheUserForLogin,
  USER_CACHE_TTL_SECONDS,
} = require("../services/userCache.service");

describe("userCache.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeUsername", () => {
    it("lowercases and trims username", () => {
      expect(normalizeUsername("  AdminUser  ")).toBe("adminuser");
    });

    it("returns empty string for null", () => {
      expect(normalizeUsername(null)).toBe("");
    });

    it("returns empty string for non-string input", () => {
      expect(normalizeUsername(123)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(normalizeUsername(undefined)).toBe("");
    });
  });

  describe("invalidateUserCache", () => {
    it("deletes the user cache key from Redis", async () => {
      await invalidateUserCache("AdminUser");
      expect(redisClient.del).toHaveBeenCalledWith("user:adminuser");
    });

    it("does nothing for empty username", async () => {
      await invalidateUserCache("");
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it("does nothing for null username", async () => {
      await invalidateUserCache(null);
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

  describe("cacheUserForLogin", () => {
    const mockUser = {
      id: 1,
      username: "AdminUser",
      password_hash: "secret",
      otp: "123456",
      reset_token: "token123",
    };

    it("caches user without sensitive fields", async () => {
      await cacheUserForLogin("AdminUser", mockUser);

      expect(redisClient.setEx).toHaveBeenCalledTimes(1);
      const [key, ttl, value] = redisClient.setEx.mock.calls[0];
      expect(key).toBe("user:adminuser");
      expect(ttl).toBe(USER_CACHE_TTL_SECONDS);

      const parsed = JSON.parse(value);
      expect(parsed.id).toBe(1);
      expect(parsed.username).toBe("AdminUser");
      expect(parsed.password_hash).toBeUndefined();
      expect(parsed.otp).toBeUndefined();
      expect(parsed.reset_token).toBeUndefined();
    });

    it("does nothing when user is null", async () => {
      await cacheUserForLogin("AdminUser", null);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });

    it("does nothing when username is empty", async () => {
      await cacheUserForLogin("", mockUser);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });
  });
});
