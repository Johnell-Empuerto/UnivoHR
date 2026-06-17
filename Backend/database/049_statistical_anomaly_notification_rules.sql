-- ============================================
-- Migration 049: Statistical Anomaly Notification Rules
-- ============================================
-- Seeds threshold rules for statistical anomaly detection.
-- follows the pattern from 048_notification_rules_foundation.sql.
-- ============================================

INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency)
VALUES
  ('stat_anomaly_moving_average', 'attendance', 'Moving Average Window', 'Minimum data points / window size for attendance trend calculations', true, true, false, null, 7, 'daily'),
  ('stat_anomaly_attendance_rate', 'attendance', 'Attendance Rate Period', 'Analysis period in days for daily attendance rate monitoring', true, true, false, null, 30, 'daily'),
  ('stat_anomaly_absenteeism_spike', 'attendance', 'Absenteeism Spike Detection', 'Detect sudden increase in absences. threshold_days = recent window, threshold_count = spike difference threshold', true, true, false, 2, 7, 'daily'),
  ('stat_anomaly_overtime_history', 'overtime', 'Overtime History Period', 'Historical period in days for weekly overtime statistical analysis', true, true, false, null, 60, 'daily'),
  ('stat_anomaly_leave_frequency', 'leave', 'Leave Frequency Period', 'Leave frequency comparison. threshold_days = recent period, threshold_count = historical period', true, true, false, 90, 30, 'daily')
ON CONFLICT (rule_key) DO NOTHING;
