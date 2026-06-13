-- 038_per_device_api_keys.sql
--
-- Purpose:
--   Add per-device API key hashing support to replace the single shared DEVICE_API_KEY.
--   Stores only SHA-256 hashes of device API keys — never plain text.
--
-- Design:
--   - api_key_hash: SHA-256 hash of the device's unique API key
--   - api_key_created_at: when the current key was generated
--   - api_key_last_used_at: last successful authentication timestamp
--   - Existing api_key column kept for backward compatibility
--
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

BEGIN;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS api_key_hash         TEXT,
  ADD COLUMN IF NOT EXISTS api_key_created_at   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS api_key_last_used_at TIMESTAMP;

COMMIT;
