BEGIN;

-- ============================================
-- Seed Leave Types and Conversion Settings
-- Safe upsert — preserves existing data
-- ============================================

-- 1. Seed leave_types
INSERT INTO leave_types (id, code, name, is_paid, is_convertible, max_convertible_days, requires_balance, default_days)
VALUES
  (1, 'VL', 'Vacation Leave',    true,  true,  5,  true, 5),
  (2, 'SL', 'Sick Leave',        true,  false, NULL, true, 15),
  (3, 'EL', 'Emergency Leave',   true,  false, NULL, true, 5),
  (4, 'ML', 'Maternity Leave',   true,  false, NULL, true, 60),
  (5, 'NP', 'No Pay Leave',      true,  false, NULL, true, 0)
ON CONFLICT (id) DO NOTHING;

-- Advance sequence past seeded IDs
SELECT setval('leave_types_id_seq', GREATEST(max, 5)) FROM (SELECT COALESCE(MAX(id), 5) AS max FROM leave_types) s;

-- 2. Seed company_settings row with column defaults
INSERT INTO company_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 1);

-- Advance sequence past seeded ID
SELECT setval('company_settings_id_seq', GREATEST(max, 1)) FROM (SELECT COALESCE(MAX(id), 1) AS max FROM company_settings) s;

COMMIT;
