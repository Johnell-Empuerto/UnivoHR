-- ===================================================================
-- DATABASE CLEANUP SCRIPT
-- smart_hrms_attendance
-- 
-- What this does:
-- 1. Deletes ALL transactional/seed data (43 tables)
-- 2. Preserves system configuration (16 tables)
-- 3. Creates 5 starter accounts (one per role)
-- 4. Resets all sequences
--
-- Order matters! Children deleted before parents due to FK constraints.
-- ===================================================================

BEGIN;

-- ===================================================================
-- STEP 0: Backup confirmation
-- ===================================================================
-- Ensure a backup exists before running this.
-- Current backup: backup_pre_cleanup_20260529_155453.sql
-- ===================================================================

-- ===================================================================
-- STEP 1: Clear notification/anomaly/forecast/email/raw/approval logs
-- ===================================================================
DELETE FROM raw_logs;
DELETE FROM email_logs;
DELETE FROM anomaly_logs;
DELETE FROM forecast_logs;
DELETE FROM approval_logs;
DELETE FROM conversion_logs;

-- ===================================================================
-- STEP 2: Clear time modification requests
--   FK → attendance, employees (both cleared)
-- ===================================================================
DELETE FROM time_modification_requests;

-- ===================================================================
-- STEP 3: Clear employee-level financial/leave data
-- ===================================================================
DELETE FROM employee_deductions;
DELETE FROM employee_salary;
DELETE FROM final_pay;
DELETE FROM leave_conversions;
DELETE FROM leave_credits;
DELETE FROM payroll;

-- ===================================================================
-- STEP 4: Clear attendance & leaves
-- ===================================================================
DELETE FROM attendance;
DELETE FROM leaves;

-- ===================================================================
-- STEP 5: Clear overtime & man-hour reports
-- ===================================================================
DELETE FROM overtime_requests;
DELETE FROM man_hour_report_details;
DELETE FROM man_hour_reports;

-- ===================================================================
-- STEP 6: Clear HR forms & recruitment data
-- ===================================================================
DELETE FROM hr_form_answers;
DELETE FROM hr_form_submissions;
DELETE FROM hr_form_assignments;
DELETE FROM hr_form_fields;
DELETE FROM hr_forms;

DELETE FROM applicant_approvals;
DELETE FROM applicant_documents;
DELETE FROM applicant_interviews;
DELETE FROM applicant_requirements;
DELETE FROM employee_onboarding;
DELETE FROM employee_requirements;
DELETE FROM applicants;

-- ===================================================================
-- STEP 7: Clear KPI evaluations
--   Keeps kpi_templates and kpi_template_items (system config)
-- ===================================================================
DELETE FROM employee_kpi_scores;
DELETE FROM employee_kpi_evaluations;

-- ===================================================================
-- STEP 8: Clear employee approvers
-- ===================================================================
DELETE FROM employee_approvers;

-- ===================================================================
-- STEP 9: Clear user-facing data
-- ===================================================================
DELETE FROM notifications;

-- Disable immutable trigger temporarily to clear audit logs
ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_immutable;
DELETE FROM audit_logs;
ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_immutable;

DELETE FROM user_sessions;
DELETE FROM user_branch_access;

-- ===================================================================
-- STEP 10: Clear main entity tables
-- ===================================================================
DELETE FROM users;
DELETE FROM employees;

-- ===================================================================
-- STEP 11: Reset sequences for all cleared tables
-- ===================================================================
ALTER SEQUENCE anomaly_logs_id_seq         RESTART WITH 1;
ALTER SEQUENCE approval_logs_id_seq        RESTART WITH 1;
ALTER SEQUENCE conversion_logs_id_seq      RESTART WITH 1;
ALTER SEQUENCE email_logs_id_seq           RESTART WITH 1;
ALTER SEQUENCE forecast_logs_id_seq        RESTART WITH 1;
ALTER SEQUENCE raw_logs_id_seq             RESTART WITH 1;

ALTER SEQUENCE time_modification_requests_id_seq RESTART WITH 1;

ALTER SEQUENCE employee_deductions_id_seq   RESTART WITH 1;
ALTER SEQUENCE employee_salary_id_seq       RESTART WITH 1;
ALTER SEQUENCE final_pay_id_seq             RESTART WITH 1;
ALTER SEQUENCE leave_conversions_id_seq     RESTART WITH 1;
ALTER SEQUENCE leave_credits_id_seq         RESTART WITH 1;
ALTER SEQUENCE payroll_id_seq               RESTART WITH 1;

ALTER SEQUENCE attendance_id_seq            RESTART WITH 1;
ALTER SEQUENCE leaves_id_seq                RESTART WITH 1;

ALTER SEQUENCE overtime_requests_id_seq     RESTART WITH 1;
ALTER SEQUENCE man_hour_report_details_id_seq RESTART WITH 1;
ALTER SEQUENCE man_hour_reports_id_seq      RESTART WITH 1;

ALTER SEQUENCE hr_form_answers_id_seq       RESTART WITH 1;
ALTER SEQUENCE hr_form_submissions_id_seq   RESTART WITH 1;
ALTER SEQUENCE hr_form_assignments_id_seq   RESTART WITH 1;
ALTER SEQUENCE hr_form_fields_id_seq        RESTART WITH 1;
ALTER SEQUENCE hr_forms_id_seq              RESTART WITH 1;

ALTER SEQUENCE applicant_approvals_id_seq   RESTART WITH 1;
ALTER SEQUENCE applicant_documents_id_seq   RESTART WITH 1;
ALTER SEQUENCE applicant_interviews_id_seq  RESTART WITH 1;
ALTER SEQUENCE applicant_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE employee_onboarding_id_seq   RESTART WITH 1;
ALTER SEQUENCE employee_requirements_id_seq RESTART WITH 1;
ALTER SEQUENCE applicants_id_seq            RESTART WITH 1;

ALTER SEQUENCE employee_kpi_scores_id_seq   RESTART WITH 1;
ALTER SEQUENCE employee_kpi_evaluations_id_seq RESTART WITH 1;

ALTER SEQUENCE employee_approvers_id_seq    RESTART WITH 1;

ALTER SEQUENCE notifications_id_seq         RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq            RESTART WITH 1;
ALTER SEQUENCE user_sessions_id_seq         RESTART WITH 1;
ALTER SEQUENCE user_branch_access_id_seq    RESTART WITH 1;

ALTER SEQUENCE employees_id_seq             RESTART WITH 1;
ALTER SEQUENCE users_id_seq                 RESTART WITH 1;

-- ===================================================================
-- STEP 12: Create 5 starter employees (one per role)
-- ===================================================================
-- All assigned to branch_id = 1 (Main Branch)

INSERT INTO employees (id, employee_code, first_name, last_name, department, position, branch_id, status, email, hired_date)
VALUES
  (1, 'ADMIN001', 'System',  'Admin',   'IT',         'System Administrator', 1, 'ACTIVE', 'admin@company.com',       CURRENT_DATE),
  (2, 'ADMIN002', 'Maria',   'Santos',  'HR',         'HR Manager',           1, 'ACTIVE', 'hr@company.com',          CURRENT_DATE),
  (3, 'HR001',    'HR',      'Staff',   'HR',         'HR Staff',             1, 'ACTIVE', 'hrstaff@company.com',     CURRENT_DATE),
  (4, 'PAY001',   'Payroll', 'Staff',   'Finance',    'Payroll Staff',        1, 'ACTIVE', 'payroll@company.com',     CURRENT_DATE),
  (5, 'EMP001',   'Employee', 'User',   'Engineering', 'Employee',            1, 'ACTIVE', 'employee@company.com',    CURRENT_DATE);

-- Reset employee sequence to continue after our 5 manual inserts
ALTER SEQUENCE employees_id_seq RESTART WITH 6;

-- ===================================================================
-- STEP 13: Create 5 starter users (one per role)
-- ===================================================================
-- All use the same bcrypt hash (same password as the original admin account).
-- CHANGE PASSWORDS after first login!

INSERT INTO users (id, username, password_hash, role, employee_id)
VALUES
  (1, 'admin',     '$2b$10$BrKJI9E37C.wR6.mZYX.yerPsXfYjs9OOWrfaOIbtPv4YzBuH.idq', 'SYSTEM_ADMIN', 1),
  (2, 'hrmanager', '$2b$10$BrKJI9E37C.wR6.mZYX.yerPsXfYjs9OOWrfaOIbtPv4YzBuH.idq', 'ADMIN',         2),
  (3, 'hrstaff',   '$2b$10$BrKJI9E37C.wR6.mZYX.yerPsXfYjs9OOWrfaOIbtPv4YzBuH.idq', 'HR_USER',       3),
  (4, 'payroll',   '$2b$10$BrKJI9E37C.wR6.mZYX.yerPsXfYjs9OOWrfaOIbtPv4YzBuH.idq', 'PAYROLL_USER',  4),
  (5, 'employee',  '$2b$10$BrKJI9E37C.wR6.mZYX.yerPsXfYjs9OOWrfaOIbtPv4YzBuH.idq', 'EMPLOYEE',      5);

-- Reset user sequence to continue after our 5 manual inserts
ALTER SEQUENCE users_id_seq RESTART WITH 6;

-- ===================================================================
-- STEP 14: Grant branch access
-- ===================================================================
-- SYSTEM_ADMIN and ADMIN get access to both branches.
-- HR_USER, PAYROLL_USER, EMPLOYEE get access to Main Branch only.

INSERT INTO user_branch_access (user_id, branch_id) VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 2),
  (3, 1),
  (4, 1),
  (5, 1);

ALTER SEQUENCE user_branch_access_id_seq RESTART WITH 7;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Run these after the script to confirm success:

-- SELECT 'employees' AS tbl, COUNT(*) FROM employees
-- UNION ALL SELECT 'users', COUNT(*) FROM users
-- UNION ALL SELECT 'user_branch_access', COUNT(*) FROM user_branch_access
-- ORDER BY tbl;

-- SELECT 'branches' AS tbl, COUNT(*) FROM branches
-- UNION ALL SELECT 'attendance_rules', COUNT(*) FROM attendance_rules
-- UNION ALL SELECT 'pay_rules', COUNT(*) FROM pay_rules
-- UNION ALL SELECT 'leave_types', COUNT(*) FROM leave_types
-- UNION ALL SELECT 'calendar_days', COUNT(*) FROM calendar_days
-- UNION ALL SELECT 'system_settings', COUNT(*) FROM system_settings
-- ORDER BY tbl;

-- SELECT u.id, u.username, u.role, e.employee_code, e.first_name, e.last_name
-- FROM users u JOIN employees e ON e.id = u.employee_id
-- ORDER BY u.id;

COMMIT;
