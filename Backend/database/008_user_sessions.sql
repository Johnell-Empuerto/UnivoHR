-- =============================================================================
-- Migration 008: Create user_sessions table for refresh token & session management
-- =============================================================================
-- WHAT: Tracks active refresh token sessions per user with device info,
--       enabling token rotation, revocation, and concurrent session control.
-- WHY:  Required for enterprise-grade auth upgrade — short-lived access tokens
--       + long-lived refresh tokens with rotation and blacklist support.
-- HOW:  Each login creates a session row storing a SHA-256 hash of the refresh
--       token (never the raw token). Logout/refresh deactivates the session.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id              SERIAL                   PRIMARY KEY,
    user_id         INTEGER                  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255)          NOT NULL,
    device_name     VARCHAR(255)             DEFAULT '',
    browser         VARCHAR(100)             DEFAULT '',
    ip_address      VARCHAR(45)              DEFAULT '',
    user_agent      TEXT                     DEFAULT '',
    is_active       BOOLEAN                  DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id       ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_hash  ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires       ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active        ON user_sessions(is_active);

COMMENT ON TABLE  user_sessions                        IS 'Tracks active refresh token sessions per user';
COMMENT ON COLUMN user_sessions.refresh_token_hash      IS 'SHA-256 hash of the refresh token (never store raw token)';
COMMENT ON COLUMN user_sessions.is_active               IS 'Soft-delete flag — set to false on logout or token rotation';
COMMENT ON COLUMN user_sessions.last_activity_at         IS 'Updated on each token refresh';
COMMENT ON COLUMN user_sessions.expires_at               IS 'Mirrors the refresh token expiry (default 7 days from creation)';
