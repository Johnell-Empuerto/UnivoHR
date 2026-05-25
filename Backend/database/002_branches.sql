-- ============================================
-- UNIVOHR – Multi-Branch Migration v2
-- Date: 2026-05-25
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE BRANCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(20)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  province    VARCHAR(100),
  phone       VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on code (safe, IF NOT EXISTS for index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_code
  ON branches(code);

-- ============================================
-- 2. ADD branch_id TO employees
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN branch_id INTEGER REFERENCES branches(id);
  END IF;
END $$;

-- ============================================
-- 3. BACKFILL: Create default branch + assign all employees
-- ============================================
INSERT INTO branches (code, name)
VALUES ('MAIN', 'Main Branch')
ON CONFLICT (code) DO NOTHING;

UPDATE employees
SET branch_id = (SELECT id FROM branches WHERE code = 'MAIN')
WHERE branch_id IS NULL;

-- ============================================
-- 4. ADD INDEX ON employees.branch_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_branch_id
  ON employees(branch_id);

-- ============================================
-- COMMIT
-- ============================================

COMMIT;
