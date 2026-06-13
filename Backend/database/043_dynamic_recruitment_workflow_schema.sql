-- 043_dynamic_recruitment_workflow_schema.sql
-- Phase 12.4.3.9.1: Dynamic recruitment workflow schema
-- All changes are additive (CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS)
-- and safe for existing data.
-- Does NOT modify existing applicant, interview, or approval logic.

BEGIN;

-- ============================================================
-- 1. recruitment_workflows
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_workflows (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  description     TEXT NULL,
  branch_id       INTEGER NULL REFERENCES branches(id) ON DELETE SET NULL,
  job_position_id INTEGER NULL REFERENCES job_positions(id) ON DELETE SET NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  version         INTEGER DEFAULT 1,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. recruitment_workflow_stages
-- ============================================================
CREATE TABLE IF NOT EXISTS recruitment_workflow_stages (
  id                  SERIAL PRIMARY KEY,
  workflow_id         INTEGER NOT NULL REFERENCES recruitment_workflows(id) ON DELETE CASCADE,
  stage_name          VARCHAR(150) NOT NULL,
  stage_type          VARCHAR(50) NOT NULL,
  stage_category      VARCHAR(50) NULL,
  sequence_order      INTEGER NOT NULL,
  is_required         BOOLEAN DEFAULT TRUE,
  requires_assignment BOOLEAN DEFAULT FALSE,
  requires_score      BOOLEAN DEFAULT FALSE,
  requires_approval   BOOLEAN DEFAULT FALSE,
  passing_score       NUMERIC(5,2) NULL,
  next_stage_on_pass  INTEGER NULL,
  next_stage_on_fail  INTEGER NULL,
  allow_skip          BOOLEAN DEFAULT FALSE,
  auto_proceed_on_pass BOOLEAN DEFAULT FALSE,
  days_to_complete    INTEGER NULL,
  is_terminal         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),

  CONSTRAINT uq_workflow_stage_sequence UNIQUE (workflow_id, sequence_order),
  CONSTRAINT chk_stage_type CHECK (
    stage_type IN (
      'INTERVIEW', 'EXAM', 'APPROVAL', 'DOCUMENT_CHECK',
      'MEDICAL', 'BACKGROUND_CHECK', 'OFFER', 'ONBOARDING',
      'CONVERT_TO_EMPLOYEE', 'CUSTOM'
    )
  )
);

-- ============================================================
-- 3. applicant_workflow_instances
-- ============================================================
CREATE TABLE IF NOT EXISTS applicant_workflow_instances (
  id               SERIAL PRIMARY KEY,
  applicant_id     INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  workflow_id      INTEGER NOT NULL REFERENCES recruitment_workflows(id),
  current_stage_id INTEGER NULL REFERENCES recruitment_workflow_stages(id),
  status           VARCHAR(50) DEFAULT 'ACTIVE',
  workflow_snapshot JSONB NULL,
  started_at       TIMESTAMP DEFAULT NOW(),
  completed_at     TIMESTAMP NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),

  CONSTRAINT uq_applicant_workflow_instance UNIQUE (applicant_id)
);

-- ============================================================
-- 4. applicant_stage_records
-- ============================================================
CREATE TABLE IF NOT EXISTS applicant_stage_records (
  id                  SERIAL PRIMARY KEY,
  applicant_id        INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  workflow_instance_id INTEGER NOT NULL REFERENCES applicant_workflow_instances(id) ON DELETE CASCADE,
  workflow_stage_id   INTEGER NOT NULL REFERENCES recruitment_workflow_stages(id),
  stage_name          VARCHAR(150) NOT NULL,
  stage_type          VARCHAR(50) NOT NULL,
  assigned_user_id    INTEGER NULL REFERENCES users(id),
  assigned_employee_id INTEGER NULL REFERENCES employees(id),
  status              VARCHAR(50) DEFAULT 'PENDING',
  score               NUMERIC(5,2) NULL,
  recommendation      VARCHAR(50) NULL,
  comments            TEXT NULL,
  scheduled_at        TIMESTAMP NULL,
  completed_at        TIMESTAMP NULL,
  attempt_number      INTEGER DEFAULT 1,
  is_current          BOOLEAN DEFAULT FALSE,
  result_data         JSONB NULL,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_stage_record_status CHECK (
    status IN ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED', 'CANCELLED', 'RESCHEDULED')
  ),
  CONSTRAINT chk_stage_record_recommendation CHECK (
    recommendation IS NULL OR recommendation IN ('PASSED', 'FAILED', 'FOR_REVIEW')
  )
);

-- ============================================================
-- 5. applicant_stage_approvals
-- ============================================================
CREATE TABLE IF NOT EXISTS applicant_stage_approvals (
  id                   SERIAL PRIMARY KEY,
  applicant_id         INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  stage_record_id      INTEGER NOT NULL REFERENCES applicant_stage_records(id) ON DELETE CASCADE,
  workflow_stage_id    INTEGER NOT NULL REFERENCES recruitment_workflow_stages(id),
  approver_employee_id INTEGER NULL REFERENCES employees(id),
  approval_level       INTEGER DEFAULT 1,
  decision             VARCHAR(50) DEFAULT 'PENDING',
  comments             TEXT NULL,
  decided_at           TIMESTAMP NULL,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_stage_approval_decision CHECK (
    decision IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')
  )
);

-- ============================================================
-- 6. Add FK columns to existing tables
-- ============================================================
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS workflow_instance_id INTEGER NULL
    REFERENCES applicant_workflow_instances(id);

ALTER TABLE job_positions
  ADD COLUMN IF NOT EXISTS workflow_id INTEGER NULL
    REFERENCES recruitment_workflows(id);

-- ============================================================
-- 7. Indexes
-- ============================================================

-- recruitment_workflows
CREATE INDEX IF NOT EXISTS idx_recruitment_workflows_branch_id
  ON recruitment_workflows(branch_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_workflows_job_position_id
  ON recruitment_workflows(job_position_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_workflows_default
  ON recruitment_workflows(is_default);

-- recruitment_workflow_stages
CREATE INDEX IF NOT EXISTS idx_recruitment_workflow_stages_workflow_id
  ON recruitment_workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_workflow_stages_sequence
  ON recruitment_workflow_stages(workflow_id, sequence_order);

-- applicant_workflow_instances
CREATE INDEX IF NOT EXISTS idx_applicant_workflow_instances_applicant_id
  ON applicant_workflow_instances(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_workflow_instances_workflow_id
  ON applicant_workflow_instances(workflow_id);

-- applicant_stage_records
CREATE INDEX IF NOT EXISTS idx_applicant_stage_records_applicant_id
  ON applicant_stage_records(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_records_instance_id
  ON applicant_stage_records(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_records_stage_id
  ON applicant_stage_records(workflow_stage_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_records_assigned_user
  ON applicant_stage_records(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_records_status
  ON applicant_stage_records(status);

-- applicant_stage_approvals
CREATE INDEX IF NOT EXISTS idx_applicant_stage_approvals_applicant_id
  ON applicant_stage_approvals(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_approvals_stage_record_id
  ON applicant_stage_approvals(stage_record_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage_approvals_decision
  ON applicant_stage_approvals(decision);

-- ============================================================
-- 8. Seed: Legacy Recruitment Workflow
-- ============================================================
INSERT INTO recruitment_workflows (name, description, is_default, is_active, version)
SELECT 'Legacy Recruitment Workflow',
       'Default workflow mirroring the original fixed pipeline: Applied → Initial Interview → Exam Interview → Final Interview → Approval → Employee',
       TRUE, FALSE, 1
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_workflows WHERE name = 'Legacy Recruitment Workflow'
);

DO $$
DECLARE
  v_workflow_id INTEGER;
BEGIN
  SELECT id INTO v_workflow_id FROM recruitment_workflows WHERE name = 'Legacy Recruitment Workflow';

  -- Stage 1: Initial Interview
  IF NOT EXISTS (SELECT 1 FROM recruitment_workflow_stages WHERE workflow_id = v_workflow_id AND sequence_order = 1) THEN
    INSERT INTO recruitment_workflow_stages
      (workflow_id, stage_name, stage_type, sequence_order, requires_assignment, requires_score)
    VALUES (v_workflow_id, 'Initial Interview', 'INTERVIEW', 1, TRUE, TRUE);
  END IF;

  -- Stage 2: Exam Interview
  IF NOT EXISTS (SELECT 1 FROM recruitment_workflow_stages WHERE workflow_id = v_workflow_id AND sequence_order = 2) THEN
    INSERT INTO recruitment_workflow_stages
      (workflow_id, stage_name, stage_type, sequence_order, requires_assignment, requires_score)
    VALUES (v_workflow_id, 'Exam Interview', 'EXAM', 2, TRUE, TRUE);
  END IF;

  -- Stage 3: Final Interview
  IF NOT EXISTS (SELECT 1 FROM recruitment_workflow_stages WHERE workflow_id = v_workflow_id AND sequence_order = 3) THEN
    INSERT INTO recruitment_workflow_stages
      (workflow_id, stage_name, stage_type, sequence_order, requires_assignment, requires_score)
    VALUES (v_workflow_id, 'Final Interview', 'INTERVIEW', 3, TRUE, TRUE);
  END IF;

  -- Stage 4: Hiring Approval
  IF NOT EXISTS (SELECT 1 FROM recruitment_workflow_stages WHERE workflow_id = v_workflow_id AND sequence_order = 4) THEN
    INSERT INTO recruitment_workflow_stages
      (workflow_id, stage_name, stage_type, sequence_order, requires_approval)
    VALUES (v_workflow_id, 'Hiring Approval', 'APPROVAL', 4, TRUE);
  END IF;

  -- Stage 5: Convert to Employee
  IF NOT EXISTS (SELECT 1 FROM recruitment_workflow_stages WHERE workflow_id = v_workflow_id AND sequence_order = 5) THEN
    INSERT INTO recruitment_workflow_stages
      (workflow_id, stage_name, stage_type, sequence_order, is_terminal)
    VALUES (v_workflow_id, 'Convert to Employee', 'CONVERT_TO_EMPLOYEE', 5, TRUE);
  END IF;
END $$;

COMMIT;
