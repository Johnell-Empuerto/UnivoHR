const redisClient = require("../config/redis");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 900; // 15 minutes in seconds

// Normalize username to prevent case sensitivity issues
const normalizeUsername = (username) => {
  return username.toLowerCase().trim();
};

// Track failed login attempt
const trackFailedAttempt = async (username) => {
  const normalizedUsername = normalizeUsername(username);
  const key = `login_attempts:${normalizedUsername}`;
  const attempts = await redisClient.get(key);

  if (!attempts) {
    // First attempt - set with expiration
    await redisClient.setEx(key, LOCKOUT_DURATION, "1");
    return { attempts: 1, locked: false };
  }

  const newAttempts = parseInt(attempts) + 1;

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the account - set with expiration
    await redisClient.setEx(key, LOCKOUT_DURATION, newAttempts.toString());
    return { attempts: newAttempts, locked: true };
  }

  // 🔥 FIXED: Only reset TTL on first attempt, otherwise preserve remaining time
  const ttl = await redisClient.ttl(key);
  if (ttl > 0) {
    await redisClient.setEx(key, ttl, newAttempts.toString());
  } else {
    await redisClient.setEx(key, LOCKOUT_DURATION, newAttempts.toString());
  }

  return { attempts: newAttempts, locked: false };
};

// Reset login attempts on successful login
const resetLoginAttempts = async (username) => {
  const normalizedUsername = normalizeUsername(username);
  const key = `login_attempts:${normalizedUsername}`;
  await redisClient.del(key);
};

// Check if account is locked
const isAccountLocked = async (username) => {
  const normalizedUsername = normalizeUsername(username);
  const key = `login_attempts:${normalizedUsername}`;
  const attempts = await redisClient.get(key);

  if (!attempts) return false;

  const attemptCount = parseInt(attempts);
  return attemptCount >= MAX_LOGIN_ATTEMPTS;
};

// Get remaining lockout time
const getLockoutTimeRemaining = async (username) => {
  const normalizedUsername = normalizeUsername(username);
  const key = `login_attempts:${normalizedUsername}`;
  const ttl = await redisClient.ttl(key);
  return ttl > 0 ? ttl : 0;
};

module.exports = {
  trackFailedAttempt,
  resetLoginAttempts,
  isAccountLocked,
  getLockoutTimeRemaining,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION,
  normalizeUsername,
};
