-- ============================================
-- Phase 2G.1: Shift Rotation Groups
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- 1. ROTATION GROUPS (production lines / teams)
CREATE TABLE IF NOT EXISTS rotation_groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(20) UNIQUE,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. ROTATION PATTERNS (the shift sequence template)
CREATE TABLE IF NOT EXISTS rotation_patterns (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  cycle_days  INT NOT NULL CHECK (cycle_days > 0),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 3. PATTERN STEPS (which shift on which day of the cycle)
CREATE TABLE IF NOT EXISTS rotation_pattern_steps (
  id              SERIAL PRIMARY KEY,
  pattern_id      INT NOT NULL REFERENCES rotation_patterns(id) ON DELETE CASCADE,
  day_offset      INT NOT NULL CHECK (day_offset >= 0),
  shift_id        INT REFERENCES shift_schedules(id),
  is_rest_day     BOOLEAN DEFAULT false,
  UNIQUE (pattern_id, day_offset)
);

CREATE INDEX IF NOT EXISTS idx_rotation_pattern_steps_pattern
  ON rotation_pattern_steps(pattern_id);

-- 4. GROUP ASSIGNMENTS (links a group to a pattern with effective date)
CREATE TABLE IF NOT EXISTS rotation_group_assignments (
  id              SERIAL PRIMARY KEY,
  group_id        INT NOT NULL REFERENCES rotation_groups(id) ON DELETE CASCADE,
  pattern_id      INT NOT NULL REFERENCES rotation_patterns(id),
  effective_date  DATE NOT NULL,
  end_date        DATE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotation_group_assignments_group
  ON rotation_group_assignments(group_id, effective_date, end_date);

-- 5. EMPLOYEE-TO-GROUP ASSIGNMENTS (date-range, matches employee_shift_assignments pattern)
CREATE TABLE IF NOT EXISTS employee_rotation_group_assignments (
  id                SERIAL PRIMARY KEY,
  employee_id       INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rotation_group_id INT NOT NULL REFERENCES rotation_groups(id),
  effective_date    DATE NOT NULL,
  end_date          DATE,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_rotation_group_assignments_lookup
  ON employee_rotation_group_assignments(employee_id, effective_date, end_date);

COMMIT;
