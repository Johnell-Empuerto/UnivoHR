-- 039_clear_plaintext_api_key.sql
-- Phase 12.2.1.1: Clear old plaintext api_key values from devices table
-- The api_key_hash column now stores SHA-256 hashes; the old plaintext column
-- is no longer read by any code and should be cleared for security.

UPDATE devices SET api_key = NULL WHERE api_key IS NOT NULL;

-- Note: The api_key column is NOT dropped to avoid breaking any downstream
-- queries that may reference it. It will be removed in a future cleanup
-- after all code paths are verified to use api_key_hash exclusively.
