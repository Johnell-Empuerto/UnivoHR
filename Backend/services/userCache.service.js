const redisClient = require("../config/redis");

const USER_CACHE_TTL_SECONDS = 300;

const normalizeUsername = (username) => {
  if (!username || typeof username !== "string") return "";
  return username.toLowerCase().trim();
};

const userCacheKey = (username) => `user:${normalizeUsername(username)}`;

/** Remove cached login user row so password/username changes take effect immediately. */
const invalidateUserCache = async (username) => {
  const key = userCacheKey(username);
  if (!key || key === "user:") return;
  await redisClient.del(key);
};

const cacheUserForLogin = async (username, user) => {
  const key = userCacheKey(username);
  if (!key || key === "user:" || !user) return;
  await redisClient.setEx(key, USER_CACHE_TTL_SECONDS, JSON.stringify(user));
};

module.exports = {
  normalizeUsername,
  invalidateUserCache,
  cacheUserForLogin,
  USER_CACHE_TTL_SECONDS,
};
