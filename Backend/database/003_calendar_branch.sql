-- ============================================
-- UNIVOHR – Branch Calendar Support Migration v3
-- Date: 2026-05-25
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 1. ADD branch_id TO calendar_days
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_days' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE calendar_days ADD COLUMN branch_id INTEGER REFERENCES branches(id);
  END IF;
END $$;

-- ============================================
-- 2. DROP OLD UNIQUE(date) CONSTRAINT
--    to allow branch-specific rows on same date
-- ============================================
ALTER TABLE calendar_days DROP CONSTRAINT IF EXISTS calendar_days_date_key;

-- ============================================
-- 3. DROP REDUNDANT date INDEX (covered by new indexes)
-- ============================================
DROP INDEX IF EXISTS idx_calendar_days_date;

-- ============================================
-- 4. CREATE PARTIAL UNIQUE INDEXES
--    One global row per date
--    One row per date per branch
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_days_global_date
  ON calendar_days(date)
  WHERE branch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_days_branch_date
  ON calendar_days(date, branch_id)
  WHERE branch_id IS NOT NULL;

-- ============================================
-- 5. ADD INDEX ON branch_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_calendar_days_branch_id
  ON calendar_days(branch_id);

-- ============================================
-- COMMIT
-- ============================================

COMMIT;
