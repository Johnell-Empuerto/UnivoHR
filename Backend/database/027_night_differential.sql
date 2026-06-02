-- ============================================
-- Phase 2E: Night Differential Pay
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- 1. payroll_rules table: key-value for all payroll rate configs
CREATE TABLE IF NOT EXISTS payroll_rules (
  id          SERIAL PRIMARY KEY,
  rule_key    VARCHAR(50) NOT NULL UNIQUE,
  rule_value  NUMERIC(6,4) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Phase 2E seed data
INSERT INTO payroll_rules (rule_key, rule_value, description) VALUES
  ('night_differential_rate', 0.10, 'ND premium: 10% of hourly rate for hours between 10PM-6AM'),
  ('night_differential_enabled', 1, 'Global toggle for night differential calculation')
ON CONFLICT (rule_key) DO NOTHING;

-- 3. Payroll table: additive columns, DEFAULT 0 (no backfill needed)
ALTER TABLE payroll
  ADD COLUMN IF NOT EXISTS night_differential_hours numeric(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS night_differential_pay numeric(10,2) DEFAULT 0;

COMMIT;
