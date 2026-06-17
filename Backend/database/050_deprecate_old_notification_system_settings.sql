-- ============================================
-- Migration 050: Deprecate Old Notification system_settings Keys
-- ============================================
-- Creates a backup table of old notification keys before deprecation.
-- Keys are NOT deleted in this migration — only backed up for safety.
-- Actual deletion should be done in a future release after confirming
-- zero runtime dependencies.
-- ============================================

-- STEP 1: Backup old notification settings to a dedicated table
CREATE TABLE IF NOT EXISTS system_settings_notification_backup_before_deprecation AS
SELECT *
FROM system_settings
WHERE key IN (
  'enable_late_email_notice',
  'late_threshold_count',
  'enable_absent_no_leave_email',
  'notify_leave_approved',
  'notify_leave_rejected',
  'notify_overtime_approved',
  'notify_overtime_rejected',
  'notify_man_hour_approved',
  'notify_man_hour_rejected',
  'notify_payroll_marked_paid'
);

-- NOTE: enable_2fa_login_email is intentionally excluded.
-- It is a 2FA feature toggle, not a pure notification key.

-- ============================================
-- Verification Queries
-- ============================================
-- SELECT COUNT(*) AS backup_count FROM system_settings_notification_backup_before_deprecation;
-- SELECT key, value FROM system_settings WHERE key IN ('enable_2fa_login_email');
