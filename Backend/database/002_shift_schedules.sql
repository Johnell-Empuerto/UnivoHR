-- ============================================
-- UNIVOHR – Shift Management Tables
-- Date: 2026-06-01
-- ADDITIVE only — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 1. SHIFT SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS shift_schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('MORNING', 'NIGHT')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. EMPLOYEE SHIFT ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id INTEGER NOT NULL REFERENCES shift_schedules(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_shift_assignments_employee
  ON employee_shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_shift_assignments_dates
  ON employee_shift_assignments(employee_id, effective_date, end_date);

-- ============================================
-- 3. SEED DEFAULT SHIFTS
-- ============================================
INSERT INTO shift_schedules (name, type, start_time, end_time, description)
VALUES
  ('Morning Shift', 'MORNING', '08:00', '17:00', 'Default morning shift (8AM-5PM)'),
  ('Night Shift', 'NIGHT', '22:00', '06:00', 'Default night shift (10PM-6AM)')
ON CONFLICT DO NOTHING;

COMMIT;
