const pool = require("../config/db");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

const normalizeUsername = (username) => {
  return username.toLowerCase().trim();
};

const trackFailedAttempt = async (username) => {
  const normalized = normalizeUsername(username);
  const result = await pool.query(
    `UPDATE users SET
       failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
       last_failed_login_at = NOW(),
       locked_until = CASE
         WHEN COALESCE(failed_login_attempts, 0) + 1 >= $1 THEN NOW() + ($2 || ' minutes')::INTERVAL
         ELSE locked_until
       END
     WHERE LOWER(username) = LOWER($3)
     RETURNING failed_login_attempts, locked_until`,
    [MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES, normalized],
  );

  if (result.rows.length === 0) {
    return { attempts: 0, locked: false };
  }

  const attempts = result.rows[0].failed_login_attempts;
  const locked = result.rows[0].locked_until !== null && new Date(result.rows[0].locked_until) > new Date();
  return { attempts, locked };
};

const resetLoginAttempts = async (username) => {
  const normalized = normalizeUsername(username);
  await pool.query(
    `UPDATE users SET
       failed_login_attempts = 0,
       locked_until = NULL,
       last_failed_login_at = NULL
     WHERE LOWER(username) = LOWER($1)`,
    [normalized],
  );
};

const isAccountLocked = async (username) => {
  const normalized = normalizeUsername(username);
  const result = await pool.query(
    `SELECT locked_until FROM users WHERE LOWER(username) = LOWER($1)`,
    [normalized],
  );
  if (result.rows.length === 0) return false;
  const lockedUntil = result.rows[0].locked_until;
  return lockedUntil !== null && new Date(lockedUntil) > new Date();
};

const getLockoutTimeRemaining = async (username) => {
  const normalized = normalizeUsername(username);
  const result = await pool.query(
    `SELECT EXTRACT(EPOCH FROM (locked_until - NOW())) AS remaining FROM users WHERE LOWER(username) = LOWER($1)`,
    [normalized],
  );
  if (result.rows.length === 0) return 0;
  const remaining = parseInt(result.rows[0].remaining) || 0;
  return remaining > 0 ? remaining : 0;
};

module.exports = {
  trackFailedAttempt,
  resetLoginAttempts,
  isAccountLocked,
  getLockoutTimeRemaining,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  normalizeUsername,
};
