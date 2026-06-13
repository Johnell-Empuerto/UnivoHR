-- 040_account_lockout.sql
-- Phase 12.2.2: Account lockout after failed login attempts
-- Adds columns to track failed logins and lock accounts temporarily.

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP;
