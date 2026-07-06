jest.mock("../config/redis", () => ({
  setEx: jest.fn().mockResolvedValue("OK"),
  get: jest.fn(),
}));

const redisClient = require("../config/redis");
const { blacklistToken, isTokenBlacklisted } = require("../services/tokenBlacklist.service");

describe("tokenBlacklist.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("blacklistToken", () => {
    it("stores token with blacklist prefix and TTL", async () => {
      await blacklistToken("abc123", 3600);
      expect(redisClient.setEx).toHaveBeenCalledWith("token_blacklist:abc123", 3600, "1");
    });

    it("does nothing when jti is falsy", async () => {
      await blacklistToken(null, 3600);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });

    it("does nothing when ttl is zero or negative", async () => {
      await blacklistToken("abc123", 0);
      expect(redisClient.setEx).not.toHaveBeenCalled();

      await blacklistToken("abc123", -1);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });

    it("does nothing when jti is empty string", async () => {
      await blacklistToken("", 3600);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });
  });

  describe("isTokenBlacklisted", () => {
    it("returns true when token exists in redis", async () => {
      redisClient.get.mockResolvedValue("1");
      const result = await isTokenBlacklisted("abc123");
      expect(redisClient.get).toHaveBeenCalledWith("token_blacklist:abc123");
      expect(result).toBe(true);
    });

    it("returns false when token not in redis", async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await isTokenBlacklisted("abc123");
      expect(result).toBe(false);
    });

    it("returns false when jti is falsy", async () => {
      const result = await isTokenBlacklisted(null);
      expect(redisClient.get).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("returns false when jti is empty string", async () => {
      const result = await isTokenBlacklisted("");
      expect(redisClient.get).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
