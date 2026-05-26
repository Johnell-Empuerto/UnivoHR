const redisClient = require("../config/redis");

const BLACKLIST_PREFIX = "token_blacklist:";

const blacklistToken = async (jti, ttlSeconds) => {
  if (!jti || ttlSeconds <= 0) return;
  const key = `${BLACKLIST_PREFIX}${jti}`;
  await redisClient.setEx(key, ttlSeconds, "1");
};

const isTokenBlacklisted = async (jti) => {
  if (!jti) return false;
  const key = `${BLACKLIST_PREFIX}${jti}`;
  const result = await redisClient.get(key);
  return result === "1";
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};
