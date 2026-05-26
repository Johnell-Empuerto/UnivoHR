-- ============================================
-- UNIVOHR – HR Policy Documents v14
-- Date: 2026-05-26
-- ADDS: hr_policy_documents table, indexes, seed data
-- SAFE: IF NOT EXISTS, additive only
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS hr_policy_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NULL,
    updated_by INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_policy_documents_category
ON hr_policy_documents(category);

CREATE INDEX IF NOT EXISTS idx_hr_policy_documents_active
ON hr_policy_documents(is_active);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM hr_policy_documents) THEN
    INSERT INTO hr_policy_documents (title, category, content, is_active) VALUES
    ('Attendance Policy', 'attendance', 'Employees are required to clock in before their scheduled shift. Late arrival may be subject to company disciplinary rules.', true),
    ('Leave Policy', 'leave', 'Employees must file leave requests in advance. Approval depends on supervisor validation and available leave credits.', true),
    ('Overtime Policy', 'overtime', 'Overtime work must be approved by an authorized supervisor before it is rendered. Unauthorized overtime may not be credited.', true),
    ('System Security Policy', 'security', 'Users must not share login credentials. All system actions may be audited for security and compliance.', true),
    ('Payroll Viewing Policy', 'payroll', 'Payroll information is confidential. Employees should contact HR for payroll-related concerns.', true),
    ('Data Privacy Policy', 'privacy', 'Employee information must be handled confidentially and used only for authorized HR and business purposes.', true);
  END IF;
END $$;

COMMIT;
