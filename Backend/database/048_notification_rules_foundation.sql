-- ============================================
-- Migration 048: Notification Rules Foundation
-- ============================================
-- Creates the notification_rules table for unified
-- control over in-app and email notifications.
-- Existing system_settings key-value toggles remain untouched.
-- ============================================

-- STEP 1: Create notification_rules table
CREATE TABLE IF NOT EXISTS notification_rules (
  id SERIAL PRIMARY KEY,
  rule_key VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,

  is_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,

  threshold_count INTEGER,
  threshold_days INTEGER,
  threshold_hours NUMERIC(10,2),
  threshold_percent NUMERIC(10,4),

  frequency VARCHAR(30) NOT NULL DEFAULT 'immediate',
  target_roles TEXT[],
  template_key VARCHAR(100),

  is_system BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- STEP 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_rules_module
ON notification_rules(module);

CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled
ON notification_rules(is_enabled);

CREATE INDEX IF NOT EXISTS idx_notification_rules_rule_key
ON notification_rules(rule_key);

-- STEP 3: Add updated_at trigger
DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON notification_rules;
CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 4: Seed existing email notification rules from system_settings
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, template_key)
VALUES
  ('login_otp', 'system', 'Login OTP Email', 'Send OTP code via email during login', true, false,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'enable_2fa_login_email'), true),
   null, null, 'immediate', null),

  ('late_notice', 'attendance', 'Late Notice Email', 'Send email when employee is late multiple times', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'enable_late_email_notice'), true),
   COALESCE((SELECT NULLIF(value, '')::int FROM system_settings WHERE key = 'late_threshold_count'), 3),
   7, 'immediate', 'LATE_NOTICE'),

  ('absent_no_leave', 'attendance', 'Absent Without Leave Notice', 'Send email if employee is absent without approved leave', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'enable_absent_no_leave_email'), true),
   null, null, 'immediate', 'ABSENT_WITHOUT_LEAVE'),

  ('leave_approved', 'leave', 'Leave Approved Notification', 'Notify when leave request is approved', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_leave_approved'), true),
   null, null, 'immediate', 'LEAVE_APPROVED'),

  ('leave_rejected', 'leave', 'Leave Rejected Notification', 'Notify when leave request is rejected', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_leave_rejected'), true),
   null, null, 'immediate', 'LEAVE_REJECTED'),

  ('overtime_approved', 'overtime', 'Overtime Approved Notification', 'Notify when overtime request is approved', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_overtime_approved'), true),
   null, null, 'immediate', 'OVERTIME_APPROVED'),

  ('overtime_rejected', 'overtime', 'Overtime Rejected Notification', 'Notify when overtime request is rejected', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_overtime_rejected'), true),
   null, null, 'immediate', 'OVERTIME_REJECTED'),

  ('man_hour_approved', 'man_hours', 'Man Hour Approved Notification', 'Notify when man hour report is approved', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_man_hour_approved'), true),
   null, null, 'immediate', 'MAN_HOUR_APPROVED'),

  ('man_hour_rejected', 'man_hours', 'Man Hour Rejected Notification', 'Notify when man hour report is rejected', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_man_hour_rejected'), true),
   null, null, 'immediate', 'MAN_HOUR_REJECTED'),

  ('payroll_marked_paid', 'payroll', 'Payroll Marked Paid Notification', 'Notify employee when payroll is marked as paid', true, true,
   COALESCE((SELECT CASE WHEN value = 'true' THEN true ELSE false END FROM system_settings WHERE key = 'notify_payroll_marked_paid'), true),
   null, null, 'immediate', 'PAYROLL_MARKED_PAID')
ON CONFLICT (rule_key) DO UPDATE SET
  email_enabled = EXCLUDED.email_enabled,
  threshold_count = COALESCE(EXCLUDED.threshold_count, notification_rules.threshold_count),
  threshold_days = COALESCE(EXCLUDED.threshold_days, notification_rules.threshold_days);

-- STEP 5: Seed anomaly/scheduler rules (hardcoded defaults as editable rules)
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency)
VALUES
  ('anomaly_late', 'attendance', 'Repeated Late Anomaly', 'Detect employees with repeated late attendance', true, true, false, 3, 7, 'immediate'),
  ('anomaly_missing_checkout', 'attendance', 'Missing Checkout Anomaly', 'Detect employees missing checkout repeatedly', true, true, false, 3, 7, 'immediate'),
  ('anomaly_undertime', 'attendance', 'Undertime Anomaly', 'Detect employees with frequent undertime', true, true, false, 3, 7, 'immediate'),
  ('anomaly_excessive_daily_ot', 'attendance', 'Excessive Daily Overtime', 'Detect excessive daily overtime hours', true, true, false, null, null, 'immediate'),
  ('anomaly_excessive_weekly_ot', 'attendance', 'Excessive Weekly Overtime', 'Detect excessive weekly overtime hours', true, true, false, null, null, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency)
VALUES
  ('anomaly_rejected_ot', 'overtime', 'Repeated Rejected Overtime', 'Detect employees with repeatedly rejected overtime', true, true, false, 3, 30, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_percent, frequency)
VALUES
  ('anomaly_salary_change', 'payroll', 'Salary Change Anomaly', 'Detect significant net salary changes', true, true, false, 0.30, 'immediate'),
  ('anomaly_deduction_change', 'payroll', 'Deduction Change Anomaly', 'Detect significant deduction changes', true, true, false, 0.50, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency)
VALUES
  ('anomaly_frequent_leave', 'leave', 'Frequent Leave Anomaly', 'Detect employees taking leave too frequently', true, true, false, 3, 30, 'immediate'),
  ('anomaly_leave_around_absence', 'leave', 'Leave Around Absence Anomaly', 'Detect leave patterns around absences', true, true, false, 2, 3, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency)
VALUES
  ('anomaly_time_mod', 'attendance', 'Time Modification Anomaly', 'Detect excessive time modification edits', true, true, false, 3, 30, 'immediate'),
  ('anomaly_rejected_time_mod', 'attendance', 'Rejected Time Modification Anomaly', 'Detect repeatedly rejected time modifications', true, true, false, 3, 30, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, threshold_hours, frequency)
VALUES
  ('anomaly_man_hour_excessive', 'man_hours', 'Excessive Man Hours Anomaly', 'Detect excessive man hour reports', true, true, false, null, null, 12, 'immediate'),
  ('anomaly_man_hour_edits', 'man_hours', 'Repeated Man Hour Edits Anomaly', 'Detect repeated man hour report edits', true, true, false, 3, 7, null, 'immediate')
ON CONFLICT (rule_key) DO NOTHING;

-- STEP 6: Seed excessive daily/weekly OT threshold_hours separately
UPDATE notification_rules SET threshold_hours = 4 WHERE rule_key = 'anomaly_excessive_daily_ot' AND threshold_hours IS NULL;
UPDATE notification_rules SET threshold_hours = 12 WHERE rule_key = 'anomaly_excessive_weekly_ot' AND threshold_hours IS NULL;

-- ============================================
-- Verification Queries (run after migration)
-- ============================================
-- SELECT COUNT(*) AS rule_count FROM notification_rules;
-- SELECT rule_key, module, name, is_enabled, in_app_enabled, email_enabled,
--        threshold_count, threshold_days, threshold_hours, threshold_percent
-- FROM notification_rules
-- ORDER BY module, rule_key;
