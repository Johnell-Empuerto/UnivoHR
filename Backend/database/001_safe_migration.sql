-- ============================================
-- UNIVOHR – Safe Enterprise Migration v1
-- Date: 2026-05-25
-- WARNING: ALWAYS backup before running
-- This migration is ADDITIVE only — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD MISSING FOREIGN KEYS (SAFE - NOT VALID)
-- ============================================

-- payroll → employees
ALTER TABLE payroll
  DROP CONSTRAINT IF EXISTS fk_payroll_employee;
ALTER TABLE payroll
  ADD CONSTRAINT fk_payroll_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;  -- Skip validation of existing rows (safe for production)

-- attendance → employees
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS fk_attendance_employee;
ALTER TABLE attendance
  ADD CONSTRAINT fk_attendance_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;

-- leaves → employees
ALTER TABLE leaves
  DROP CONSTRAINT IF EXISTS fk_leaves_employee;
ALTER TABLE leaves
  ADD CONSTRAINT fk_leaves_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;

-- employee_salary → employees
ALTER TABLE employee_salary
  DROP CONSTRAINT IF EXISTS fk_employee_salary_employee;
ALTER TABLE employee_salary
  ADD CONSTRAINT fk_employee_salary_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;

-- employee_deductions → employees
ALTER TABLE employee_deductions
  DROP CONSTRAINT IF EXISTS fk_employee_deductions_employee;
ALTER TABLE employee_deductions
  ADD CONSTRAINT fk_employee_deductions_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;

-- overtime_requests → employees
ALTER TABLE overtime_requests
  DROP CONSTRAINT IF EXISTS fk_overtime_employee;
ALTER TABLE overtime_requests
  ADD CONSTRAINT fk_overtime_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  NOT VALID;

-- notifications → users
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_user;
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  NOT VALID;

-- ============================================
-- 2. VALIDATE FOREIGN KEYS (Background safe)
-- ============================================
-- Run the following AFTER migration to fully enforce FKs:
-- ALTER TABLE payroll VALIDATE CONSTRAINT fk_payroll_employee;
-- ALTER TABLE attendance VALIDATE CONSTRAINT fk_attendance_employee;
-- ALTER TABLE leaves VALIDATE CONSTRAINT fk_leaves_employee;

-- ============================================
-- 3. ADD PERFORMANCE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON attendance(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance(date);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_cutoff
  ON payroll(employee_id, cutoff_start, cutoff_end);

CREATE INDEX IF NOT EXISTS idx_payroll_status
  ON payroll(status);

CREATE INDEX IF NOT EXISTS idx_payroll_cutoff
  ON payroll(cutoff_start, cutoff_end);

CREATE INDEX IF NOT EXISTS idx_leaves_employee_status
  ON leaves(employee_id, status);

CREATE INDEX IF NOT EXISTS idx_overtime_employee_status
  ON overtime_requests(employee_id, status, is_paid);

CREATE INDEX IF NOT EXISTS idx_employee_status
  ON employees(status);

CREATE INDEX IF NOT EXISTS idx_employee_code
  ON employees(employee_code);

CREATE INDEX IF NOT EXISTS idx_employee_department
  ON employees(department);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_user_role
  ON users(role);

CREATE INDEX IF NOT EXISTS idx_employee_salary_employee
  ON employee_salary(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_deductions_employee
  ON employee_deductions(employee_id, is_active);

-- ============================================
-- 4. ADD UNIQUE CONSTRAINTS (SAFE)
-- ============================================

-- Prevent duplicate attendance per employee per day
DROP INDEX IF EXISTS idx_attendance_employee_date_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date_unique
  ON attendance(employee_id, date);

-- Prevent duplicate employee_salary
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_salary_unique
  ON employee_salary(employee_id);

-- Prevent duplicate payroll per employee per cutoff
DROP INDEX IF EXISTS idx_payroll_employee_cutoff_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_employee_cutoff_unique
  ON payroll(employee_id, cutoff_start, cutoff_end);

-- ============================================
-- 5. ADD AUDIT TIMESTAMPS (SAFE DEFAULTS)
-- ============================================

-- Add created_at/updated_at to tables that might be missing them
-- These use safe DO blocks to avoid errors if columns already exist

DO $$
BEGIN
  -- payroll
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll' AND column_name='created_at') THEN
    ALTER TABLE payroll ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payroll' AND column_name='updated_at') THEN
    ALTER TABLE payroll ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- attendance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='created_at') THEN
    ALTER TABLE attendance ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- leaves
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='updated_at') THEN
    ALTER TABLE leaves ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- employee_salary
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employee_salary' AND column_name='created_at') THEN
    ALTER TABLE employee_salary ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employee_salary' AND column_name='updated_at') THEN
    ALTER TABLE employee_salary ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- overtime_requests
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='overtime_requests' AND column_name='created_at') THEN
    ALTER TABLE overtime_requests ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- employee_deductions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employee_deductions' AND column_name='created_at') THEN
    ALTER TABLE employee_deductions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- 6. PAYROLL INTEGRITY ENHANCEMENTS
-- ============================================

-- Add payroll status check constraint (safe additive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'payroll' AND ccu.column_name = 'status'
  ) THEN
    ALTER TABLE payroll ADD CONSTRAINT chk_payroll_status
      CHECK (status IN ('UNPAID', 'PAID', 'LOCKED', 'VOID'));
  END IF;
END $$;

-- ============================================
-- 7. AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  actor_id      INTEGER REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     INTEGER,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_actor
  ON audit_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_time
  ON audit_logs(created_at);

-- Create an immutable trigger to prevent modification of audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_logs;
CREATE TRIGGER trg_audit_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  EXECUTE FUNCTION prevent_audit_modification();

-- ============================================
-- 8. PAYROLL VERSIONING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payroll_versions (
  id              BIGSERIAL PRIMARY KEY,
  payroll_id      INTEGER REFERENCES payroll(id),
  employee_id     INTEGER NOT NULL REFERENCES employees(id),
  cutoff_start    DATE NOT NULL,
  cutoff_end      DATE NOT NULL,
  pay_date        DATE,
  basic_salary    NUMERIC(12,2),
  overtime_pay    NUMERIC(12,2),
  deductions      NUMERIC(12,2),
  net_salary      NUMERIC(12,2),
  late_deduction  NUMERIC(12,2),
  government_deduction NUMERIC(12,2),
  leave_conversion NUMERIC(12,2),
  rule_snapshot   JSONB,
  status          VARCHAR(20) DEFAULT 'UNPAID',
  created_by      INTEGER REFERENCES users(id),
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_versions_payroll
  ON payroll_versions(payroll_id);

CREATE INDEX IF NOT EXISTS idx_payroll_versions_employee
  ON payroll_versions(employee_id, cutoff_start, cutoff_end);

-- ============================================
-- 9. AUTO-UPDATE updated_at TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payroll_updated_at ON payroll;
CREATE TRIGGER trg_payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_salary_updated_at ON employee_salary;
CREATE TRIGGER trg_employee_salary_updated_at
  BEFORE UPDATE ON employee_salary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMIT
-- ============================================

COMMIT;

-- ============================================
-- POST-MIGRATION VALIDATION (run separately)
-- ============================================
-- SELECT COUNT(*) FROM payroll WHERE employee_id NOT IN (SELECT id FROM employees);
-- SELECT COUNT(*) FROM attendance WHERE employee_id NOT IN (SELECT id FROM employees);
