-- 042_recruitment_interview_enterprise.sql
-- Phase 12.4.3.1: Enterprise recruitment interview assignment, scoring, and notification
-- All changes are additive (ALTER TABLE ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS)
-- and safe for existing data.

BEGIN;

-- 1. Add interviewer_user_id (FK -> users) for linking interview to an assigned user
ALTER TABLE applicant_interviews
  ADD COLUMN IF NOT EXISTS interviewer_user_id INTEGER REFERENCES users(id);

-- 2. Add recommendation column for enterprise scoring result
ALTER TABLE applicant_interviews
  ADD COLUMN IF NOT EXISTS recommendation VARCHAR(20)
    CHECK (recommendation IS NULL OR recommendation IN ('PASSED', 'FAILED', 'FOR_REVIEW'));

-- 3. Add index for querying interviews by assigned interviewer
CREATE INDEX IF NOT EXISTS idx_applicant_interviews_interviewer_user
  ON applicant_interviews(interviewer_user_id);

COMMIT;
