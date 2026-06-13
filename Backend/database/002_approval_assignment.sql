-- ============================================
-- UNIVOHR – Dynamic Approval Assignment v2
-- Phase 12.4.3.9.8
-- Date: 2026-06-09
-- Safe additive migration for production
-- ============================================

BEGIN;

-- Add assignment columns to applicant_stage_approvals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicant_stage_approvals' AND column_name='assigned_user_id') THEN
    ALTER TABLE applicant_stage_approvals ADD COLUMN assigned_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicant_stage_approvals' AND column_name='assigned_employee_id') THEN
    ALTER TABLE applicant_stage_approvals ADD COLUMN assigned_employee_id INTEGER NULL REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicant_stage_approvals' AND column_name='scheduled_at') THEN
    ALTER TABLE applicant_stage_approvals ADD COLUMN scheduled_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicant_stage_approvals' AND column_name='assigned_at') THEN
    ALTER TABLE applicant_stage_approvals ADD COLUMN assigned_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicant_stage_approvals' AND column_name='assigned_by') THEN
    ALTER TABLE applicant_stage_approvals ADD COLUMN assigned_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
