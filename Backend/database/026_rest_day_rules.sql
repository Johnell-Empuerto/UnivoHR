-- ============================================
-- Phase 2D.1: Rest Day / Day-Off Rules
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- 1. EMPLOYEE REST DAY OVERRIDES
CREATE TABLE IF NOT EXISTS employee_rest_days (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  effective_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON COLUMN employee_rest_days.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

CREATE INDEX IF NOT EXISTS idx_emp_rest_days_employee
  ON employee_rest_days(employee_id);

CREATE INDEX IF NOT EXISTS idx_emp_rest_days_lookup
  ON employee_rest_days(employee_id, day_of_week, effective_date, end_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_emp_rest_day_active
  ON employee_rest_days(employee_id, day_of_week)
  WHERE end_date IS NULL;

-- 2. BRANCH DEFAULT REST DAYS
CREATE TABLE IF NOT EXISTS branch_rest_days (
  id          SERIAL PRIMARY KEY,
  branch_id   INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(branch_id, day_of_week)
);

COMMENT ON COLUMN branch_rest_days.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

CREATE INDEX IF NOT EXISTS idx_branch_rest_days_branch
  ON branch_rest_days(branch_id);

COMMIT;
