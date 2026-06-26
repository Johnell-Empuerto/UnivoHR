-- ==============================================================================
-- SYSTEM DEPLOYMENT FULL FRESH START
-- ==============================================================================
-- Purpose: Clear all data and reseed minimum defaults for a fresh start.
-- Preserves: Database schema only (tables, columns, constraints, indexes).
-- Removes: ALL application data including old config.
-- Reseeds: Fresh defaults + one admin user with full permissions.
--
-- Restore from backup if needed:
--   pg_dump --version  (must match server 16.8)
--   createdb -U postgres -h localhost -p 5432 smart_hrms_attendance
--   psql -U postgres -h localhost -p 5432 -d smart_hrms_attendance -f backup_before_full_fresh_start_YYYYMMDD_HHMM.sql
--
-- Backup file: Backend/database/backups/backup_before_full_fresh_start_20260617_1503.sql
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PHASE 0: Show preview counts (run these before executing DELETE sections)
-- ==============================================================================
-- Preview queries are at the end of this file (commented out).
-- Run them before and after cleanup to verify.

-- ==============================================================================
-- PHASE 1: DELETE transactional data (children first, respecting FK order)
-- ==============================================================================

-- 1a. Recruitment pipeline (deepest children first)
-- First break circular FK: applicants.workflow_instance_id -> applicant_workflow_instances (NO ACTION)
UPDATE applicants SET workflow_instance_id = NULL WHERE workflow_instance_id IS NOT NULL;
-- Delete workflow instances (CASCADE to applicant_stage_records -> applicant_stage_approvals)
DELETE FROM applicant_workflow_instances;
DELETE FROM applicant_stage_approvals;
DELETE FROM applicant_stage_records;
DELETE FROM applicant_interviews;
DELETE FROM applicant_approvals;
DELETE FROM applicant_documents;
DELETE FROM applicant_education;
DELETE FROM applicant_family_members;
DELETE FROM applicant_work_experience;
DELETE FROM applicant_requirements;
DELETE FROM applicants;

-- 1b. Time/attendance records
DELETE FROM time_modification_requests;
DELETE FROM attendance_logs;
DELETE FROM attendance;

-- 1c. Payroll-related
DELETE FROM email_logs;
DELETE FROM payroll;

-- 1d. Leave and leave balances
DELETE FROM leave_conversions;
DELETE FROM leaves;
DELETE FROM employee_leave_balances;

-- 1e. Employee sub-records (NO ACTION FK — delete before employees)
DELETE FROM employee_salary;
DELETE FROM employee_deductions;
DELETE FROM employee_family_members;
DELETE FROM employee_education;
DELETE FROM employee_work_experience;
DELETE FROM employee_rest_days;
DELETE FROM employee_shift_assignments;
DELETE FROM employee_rotation_group_assignments;
DELETE FROM employee_device_users;
DELETE FROM employee_approvers;
DELETE FROM employee_kpi_evaluations;
DELETE FROM employee_onboarding;
DELETE FROM employee_requirements;

-- 1f. KPI
DELETE FROM employee_kpi_scores;
DELETE FROM kpi_template_items;
DELETE FROM kpi_templates;

-- 1g. HR Forms
DELETE FROM hr_form_answers;
DELETE FROM hr_form_submissions;
DELETE FROM hr_form_assignments;
DELETE FROM hr_form_fields;
DELETE FROM hr_forms;

-- 1h. Man hours / overtime / anomaly / forecast
DELETE FROM man_hour_report_details;
DELETE FROM man_hour_reports;
DELETE FROM overtime_requests;
DELETE FROM anomaly_logs;
DELETE FROM forecast_logs;

-- 1i. Calendar / holidays
DELETE FROM calendar_days;

-- 1j. Final pay / conversion / audit / notifications
DELETE FROM final_pay;
DELETE FROM conversion_logs;
DELETE FROM approval_logs;
-- Audit logs have a BEFORE DELETE immutable trigger; disable temporarily
ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_immutable;
DELETE FROM audit_logs;
ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_immutable;
DELETE FROM notifications;

-- 1k. Device logs
DELETE FROM raw_logs;
DELETE FROM device_log_mappings;
DELETE FROM devices;

-- 1l. User sessions / branch access / permissions (CASCADE from users)
DELETE FROM user_sessions;
DELETE FROM user_branch_access;
DELETE FROM user_permissions;
DELETE FROM _migration_020_repair_log;

-- 1m. HR Policies (standalone)
DELETE FROM hr_policy_documents;

-- 1n. Email templates (standalone)
DELETE FROM email_templates;

-- 1o. Leave_credits backup table (migration artifact)
DELETE FROM leave_credits_backup_before_drop;

-- 1p. System backup table (migration artifact)
DELETE FROM system_settings_notification_backup_before_deprecation;

-- 1q. Job positions / recruitment workflow config
DELETE FROM job_positions;
DELETE FROM recruitment_workflow_stages;
DELETE FROM recruitment_workflows;

-- 1r. Rotation groups
DELETE FROM rotation_group_assignments;
DELETE FROM rotation_pattern_steps;
DELETE FROM rotation_patterns;
DELETE FROM rotation_groups;

-- ==============================================================================
-- PHASE 2: DELETE non-admin employees and non-admin users
-- ==============================================================================

-- 2a. Delete ALL employees (we reseed fresh admin below)
DELETE FROM employees;

-- 2b. Delete ALL users (we reseed fresh admin below)
-- Note: No FK from users.employee_id to employees.id (only UNIQUE constraint)
DELETE FROM users;

-- ==============================================================================
-- PHASE 3: DELETE all branches (optional — no default branch required)
-- ==============================================================================
DELETE FROM branch_rest_days;
DELETE FROM branches;

-- ==============================================================================
-- PHASE 4: DELETE all config/lookup rows (will be reseeded below)
-- ==============================================================================
DELETE FROM system_settings;
DELETE FROM company_settings;
DELETE FROM attendance_rules;
DELETE FROM pay_rules;
DELETE FROM payroll_rules;
DELETE FROM notification_rules;
DELETE FROM leave_types;
DELETE FROM smtp_settings;

-- ==============================================================================
-- PHASE 5: RESET SEQUENCES (before reseeding)
-- ==============================================================================
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employees_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_branch_access_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS branches_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS branch_rest_days_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS pay_rules_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payroll_rules_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leave_types_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notification_rules_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS attendance_rules_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS system_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS company_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS smtp_settings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS email_templates_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recruitment_workflows_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recruitment_workflow_stages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS attendance_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payroll_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leaves_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_leave_balances_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_salary_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_deductions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_family_members_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_education_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_work_experience_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_rest_days_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_shift_assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_rotation_group_assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_device_users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_approvers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_kpi_evaluations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_kpi_scores_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_onboarding_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS employee_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS kpi_templates_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS kpi_template_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_forms_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_form_fields_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_form_assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_form_submissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_form_answers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS man_hour_reports_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS man_hour_report_details_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS overtime_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS anomaly_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS forecast_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS calendar_days_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS final_pay_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS conversion_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS approval_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS raw_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS device_log_mappings_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS devices_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS job_positions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS hr_policy_documents_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS email_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS leave_conversions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS time_modification_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rotation_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rotation_patterns_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rotation_pattern_steps_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS rotation_group_assignments_id_seq RESTART WITH 1;

-- ==============================================================================
-- PHASE 6: RESEED DEFAULT CONFIGURATION
-- ==============================================================================

-- 6a. system_settings
INSERT INTO system_settings (id, key, value, description) VALUES
  (1, 'employee_code_padding', '3', 'Zero-padding for auto-generated employee codes'),
  (2, 'employee_code_separator', '', 'Separator between prefix and counter'),
  (3, 'employee_code_prefix', 'EMP', 'Prefix for auto-generated employee codes'),
  (4, 'employee_code_counter', '0', 'Last used counter value; next code = counter + 1'),
  (5, 'employee_code_auto_generate', 'true', 'Enable auto-generation of employee codes'),
  (6, 'enable_web_clock_in_out', 'true', 'Enable web-based clock in/out feature');
SELECT setval('system_settings_id_seq', 6);

-- 6b. company_settings
INSERT INTO company_settings (id) VALUES (1);
SELECT setval('company_settings_id_seq', 1);

-- 6c. attendance_rules
INSERT INTO attendance_rules (id, late_threshold, grace_period, max_work_hours, late_deduction_type, late_deduction_value, late_deduction_enabled, is_active) VALUES
  (1, 30, 15, 10, 'PER_MINUTE', 5.50, true, true);
SELECT setval('attendance_rules_id_seq', 1);

-- 6d. pay_rules (day type multipliers)
INSERT INTO pay_rules (id, day_type, multiplier) VALUES
  (1, 'REGULAR', 1.00),
  (2, 'SPECIAL_NON_WORKING', 2.00),
  (3, 'SPECIAL_HOLIDAY', 3.00),
  (4, 'REGULAR_HOLIDAY', 4.00),
  (5, 'REST_DAY', 1.30);
SELECT setval('pay_rules_id_seq', 5);

-- 6e. payroll_rules (config)
INSERT INTO payroll_rules (id, rule_key, rule_value, description) VALUES
  (1, 'night_differential_rate', 0.10, 'ND premium: 10%% of hourly rate for hours between 10PM-6AM'),
  (2, 'night_differential_enabled', 1, 'Global toggle for night differential calculation'),
  (3, 'holiday_rest_day_method', 1, 'Holiday on rest day calculation method: 1=multiply, 2=additive minus 1, 3=max');
SELECT setval('payroll_rules_id_seq', 3);

-- 6f. leave_types
INSERT INTO leave_types (id, code, name, is_paid, is_convertible, max_convertible_days, requires_balance, default_days, is_enabled, requires_approval, employee_requestable, include_in_credits, affects_payroll, deducts_salary, sort_order, description) VALUES
  (1, 'VL', 'Vacation Leave',    true,  true,  5,  true, 5,  true, true, true, true, true, false, 1, 'Annual vacation leave entitlement'),
  (2, 'SL', 'Sick Leave',        true,  false, NULL, true, 15, true, true, true, true, true, false, 2, 'Sick leave for medical needs'),
  (3, 'EL', 'Emergency Leave',   true,  false, NULL, true, 5,  true, true, true, true, true, false, 3, 'Emergency leave for urgent personal matters'),
  (4, 'ML', 'Maternity Leave',   true,  false, NULL, true, 60, true, true, true, true, true, false, 4, 'Maternity leave for childbirth and recovery'),
  (5, 'NP', 'No Pay Leave',      false, false, NULL, false, 0, true, true, true, true, true, true,  5, 'Unpaid leave without salary'),
  (6, 'CL', 'Compassionate Leave', true, false, NULL, true, 5,  true, true, true, true, true, false, 10, 'Leave for bereavement and family emergencies');
SELECT setval('leave_types_id_seq', 6);

-- 6g. notification_rules (from migrations 048 + 049)
-- Email notification rules
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('login_otp', 'system', 'Login OTP Email', 'Send OTP code via email during login', true, false, false, null, null, 'immediate', true),
  ('late_notice', 'attendance', 'Late Notice Email', 'Send email when employee is late multiple times', true, true, false, 3, 7, 'immediate', true),
  ('absent_no_leave', 'attendance', 'Absent Without Leave Notice', 'Send email if employee is absent without approved leave', true, true, false, null, null, 'immediate', true),
  ('leave_approved', 'leave', 'Leave Approved Notification', 'Notify when leave request is approved', true, true, false, null, null, 'immediate', true),
  ('leave_rejected', 'leave', 'Leave Rejected Notification', 'Notify when leave request is rejected', true, true, true, null, null, 'immediate', true),
  ('overtime_approved', 'overtime', 'Overtime Approved Notification', 'Notify when overtime request is approved', true, true, false, null, null, 'immediate', true),
  ('overtime_rejected', 'overtime', 'Overtime Rejected Notification', 'Notify when overtime request is rejected', true, true, false, null, null, 'immediate', true),
  ('man_hour_approved', 'man_hours', 'Man Hour Approved Notification', 'Notify when man hour report is approved', true, true, false, null, null, 'immediate', true),
  ('man_hour_rejected', 'man_hours', 'Man Hour Rejected Notification', 'Notify when man hour report is rejected', true, true, false, null, null, 'immediate', true),
  ('payroll_marked_paid', 'payroll', 'Payroll Marked Paid Notification', 'Notify employee when payroll is marked as paid', true, true, false, null, null, 'immediate', true);
-- Anomaly/scheduler rules
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('anomaly_late', 'attendance', 'Repeated Late Anomaly', 'Detect employees with repeated late attendance', true, true, false, 3, 7, 'immediate', true),
  ('anomaly_missing_checkout', 'attendance', 'Missing Checkout Anomaly', 'Detect employees missing checkout repeatedly', true, true, false, 3, 7, 'immediate', true),
  ('anomaly_undertime', 'attendance', 'Undertime Anomaly', 'Detect employees with frequent undertime', true, true, false, 3, 7, 'immediate', true),
  ('anomaly_excessive_daily_ot', 'attendance', 'Excessive Daily Overtime', 'Detect excessive daily overtime hours', true, true, false, null, null, 'immediate', true),
  ('anomaly_excessive_weekly_ot', 'attendance', 'Excessive Weekly Overtime', 'Detect excessive weekly overtime hours', true, true, false, null, null, 'immediate', true);
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('anomaly_rejected_ot', 'overtime', 'Repeated Rejected Overtime', 'Detect employees with repeatedly rejected overtime', true, true, false, 3, 30, 'immediate', true);
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_percent, frequency, is_system) VALUES
  ('anomaly_salary_change', 'payroll', 'Salary Change Anomaly', 'Detect significant net salary changes', true, true, false, 0.30, 'immediate', true),
  ('anomaly_deduction_change', 'payroll', 'Deduction Change Anomaly', 'Detect significant deduction changes', true, true, false, 0.50, 'immediate', true);
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('anomaly_frequent_leave', 'leave', 'Frequent Leave Anomaly', 'Detect employees taking leave too frequently', true, true, false, 3, 30, 'immediate', true),
  ('anomaly_leave_around_absence', 'leave', 'Leave Around Absence Anomaly', 'Detect leave patterns around absences', true, true, false, 2, 3, 'immediate', true);
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('anomaly_time_mod', 'attendance', 'Time Modification Anomaly', 'Detect excessive time modification edits', true, true, false, 3, 30, 'immediate', true),
  ('anomaly_rejected_time_mod', 'attendance', 'Rejected Time Modification Anomaly', 'Detect repeatedly rejected time modifications', true, true, false, 3, 30, 'immediate', true);
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, threshold_hours, frequency, is_system) VALUES
  ('anomaly_man_hour_excessive', 'man_hours', 'Excessive Man Hours Anomaly', 'Detect excessive man hour reports', true, true, false, null, null, 12, 'immediate', true),
  ('anomaly_man_hour_edits', 'man_hours', 'Repeated Man Hour Edits Anomaly', 'Detect repeated man hour report edits', true, true, false, 3, 7, null, 'immediate', true);
-- Set threshold_hours for excessive OT rules
UPDATE notification_rules SET threshold_hours = 4 WHERE rule_key = 'anomaly_excessive_daily_ot';
UPDATE notification_rules SET threshold_hours = 12 WHERE rule_key = 'anomaly_excessive_weekly_ot';
-- Statistical anomaly rules (migration 049)
INSERT INTO notification_rules (rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, frequency, is_system) VALUES
  ('stat_anomaly_moving_average', 'attendance', 'Moving Average Window', 'Minimum data points / window size for attendance trend calculations', true, true, false, null, 7, 'daily', true),
  ('stat_anomaly_attendance_rate', 'attendance', 'Attendance Rate Period', 'Analysis period in days for daily attendance rate monitoring', true, true, false, null, 30, 'daily', true),
  ('stat_anomaly_absenteeism_spike', 'attendance', 'Absenteeism Spike Detection', 'Detect sudden increase in absences', true, true, false, 2, 7, 'daily', true),
  ('stat_anomaly_overtime_history', 'overtime', 'Overtime History Period', 'Historical period in days for weekly overtime statistical analysis', true, true, false, null, 60, 'daily', true),
  ('stat_anomaly_leave_frequency', 'leave', 'Leave Frequency Period', 'Leave frequency comparison', true, true, false, 90, 30, 'daily', true);

-- ==============================================================================
-- PHASE 7: CREATE ADMIN EMPLOYEE AND ADMIN USER
-- ==============================================================================

-- 7a. Create admin employee (id=1)
INSERT INTO employees (id, employee_code, first_name, last_name, department, status)
VALUES (1, 'ADMIN001', 'System', 'Administrator', 'Administration', 'ACTIVE');

-- 7b. Create admin user (id=1, linked to employee_id=1)
-- Password: admin123 (bcrypt hash with cost factor 10)
-- Login username: admin
INSERT INTO users (id, username, password_hash, role, employee_id)
VALUES (1, 'admin', '$2b$10$zr8nbdvrp9E6g41v0iZwmOZdiKTIEpdPV1fYhRNfStwyUiUwLUpMq', 'ADMIN', 1);

-- 7c. Grant ALL permissions to admin user
INSERT INTO user_permissions (user_id, permission_key, is_allowed)
SELECT 1, unnest(ARRAY[
  'dashboard.view',
  'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
  'attendance.view', 'attendance.view_own', 'attendance.manage', 'attendance.time_requests.approve', 'attendance.clock_in',
  'leave.view', 'leave.view_own', 'leave.create', 'leave.create_for_others', 'leave.manage', 'leave.approve', 'leave.credits.view', 'leave.credits.manage', 'leave.conversion.view', 'leave.conversion.manage',
  'overtime.view', 'overtime.view_own', 'overtime.create', 'overtime.manage', 'overtime.approve',
  'manhours.view', 'manhours.view_own', 'manhours.manage', 'manhours.approve',
  'payroll.view', 'payroll.generate', 'payroll.mark_paid', 'payroll.settings', 'payroll.salary.manage', 'payroll.deductions.manage',
  'finalpay.view', 'finalpay.manage',
  'recruitment.view', 'recruitment.jobs.manage', 'recruitment.applicants.manage', 'recruitment.applicants.delete', 'recruitment.interviews.manage', 'recruitment.approvals.manage', 'recruitment.workflows.manage', 'recruitment.convert_employee',
  'performance.view', 'my_performance.view', 'performance.templates.manage', 'performance.evaluations.manage',
  'forms.view', 'forms.view_own', 'forms.builder.manage', 'forms.assignments.manage', 'forms.submissions.view',
  'reports.view', 'reports.employee', 'reports.attendance', 'reports.leave', 'reports.payroll', 'reports.benefits', 'reports.performance',
  'settings.view', 'settings.system', 'settings.attendance_rules', 'settings.approvals', 'settings.notifications', 'settings.smtp', 'settings.email_templates', 'settings.branding',
  'users.view', 'users.manage',
  'branches.view', 'branches.manage',
  'devices.view', 'devices.manage', 'device_logs.view', 'device_logs.manage',
  'audit_logs.view', 'anomalies.view', 'drilldown.view', 'analytics.view', 'forecasting.view',
  'calendar.view', 'calendar.manage',
  'hr_policies.view', 'hr_policies.manage',
  'notifications.view',
  'profile.view', 'profile.edit_own', 'change_password',
  'benefits.view_own', 'policies.view', 'self_service.view'
]), true;

-- ==============================================================================
-- PHASE 8: RESET SEQUENCES FOR ADMIN (admin records start at id=1)
-- ==============================================================================
SELECT setval('employees_id_seq', 1);
SELECT setval('users_id_seq', 1);
SELECT setval('user_permissions_id_seq', (SELECT COUNT(*) FROM user_permissions));

-- ==============================================================================
-- COMMIT TRANSACTION
-- ==============================================================================
COMMIT;

-- ==============================================================================
-- VERIFICATION QUERIES (Run these after the transaction completes)
-- ==============================================================================
-- SELECT '=== ADMIN USER ===' as info;
-- SELECT id, username, role, employee_id FROM users;
-- SELECT '=== ADMIN EMPLOYEE ===' as info;
-- SELECT id, employee_code, first_name, last_name, status FROM employees;
-- SELECT '=== ADMIN PERMISSIONS COUNT ===' as info;
-- SELECT COUNT(*) as admin_permissions FROM user_permissions WHERE user_id = 1;
-- SELECT '=== ONLY ONE USER ===' as info;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT '=== ONLY ONE EMPLOYEE ===' as info;
-- SELECT COUNT(*) as employee_count FROM employees;
-- SELECT '=== SYSTEM SETTINGS ===' as info;
-- SELECT COUNT(*) as settings_count FROM system_settings;
-- SELECT '=== ATTENDANCE RULES ===' as info;
-- SELECT COUNT(*) as rules_count FROM attendance_rules;
-- SELECT '=== PAY RULES ===' as info;
-- SELECT COUNT(*) as pay_rules_count FROM pay_rules;
-- SELECT '=== PAYROLL RULES ===' as info;
-- SELECT COUNT(*) as payroll_rules_count FROM payroll_rules;
-- SELECT '=== LEAVE TYPES ===' as info;
-- SELECT COUNT(*) as leave_types_count FROM leave_types;
-- SELECT '=== NOTIFICATION RULES ===' as info;
-- SELECT COUNT(*) as notification_rules_count FROM notification_rules;
-- SELECT '=== TRANSACTIONAL TABLES (should be 0) ===' as info;
-- SELECT 'attendance' as tbl, COUNT(*) FROM attendance
-- UNION ALL SELECT 'payroll', COUNT(*) FROM payroll
-- UNION ALL SELECT 'leaves', COUNT(*) FROM leaves
-- UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
-- UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
-- UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
-- UNION ALL SELECT 'applicants', COUNT(*) FROM applicants
-- UNION ALL SELECT 'attendance_logs', COUNT(*) FROM attendance_logs
-- UNION ALL SELECT 'overtime_requests', COUNT(*) FROM overtime_requests
-- UNION ALL SELECT 'employee_salary', COUNT(*) FROM employee_salary;
-- SELECT '=== SEQUENCES ===' as info;
-- SELECT 'users_id_seq' as seq, last_value FROM users_id_seq
-- UNION ALL SELECT 'employees_id_seq', last_value FROM employees_id_seq
-- UNION ALL SELECT 'user_permissions_id_seq', last_value FROM user_permissions_id_seq;
-- SELECT '=== ORPHAN CHECK (should all be 0) ===' as info;
-- SELECT 'user_permissions without user' as check, COUNT(*) FROM user_permissions up WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = up.user_id)
-- UNION ALL SELECT 'users without employee', COUNT(*) FROM users u WHERE u.employee_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.id = u.employee_id);
