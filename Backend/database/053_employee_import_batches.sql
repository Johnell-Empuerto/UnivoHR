-- ============================================
-- UNIVOHR – Employee Import Batches
-- Tracks bulk import validation and commit flow
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS employee_import_batches (
  id              SERIAL PRIMARY KEY,
  filename        VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  total_rows      INTEGER NOT NULL DEFAULT 0,
  valid_rows      INTEGER NOT NULL DEFAULT 0,
  invalid_rows    INTEGER NOT NULL DEFAULT 0,
  duplicate_rows  INTEGER NOT NULL DEFAULT 0,
  imported_count  INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  status          VARCHAR(30) NOT NULL DEFAULT 'validated'
                  CHECK (status IN ('validated', 'importing', 'completed', 'failed', 'cancelled')),
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at    TIMESTAMP,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS employee_import_rows (
  id                  SERIAL PRIMARY KEY,
  batch_id            INTEGER NOT NULL REFERENCES employee_import_batches(id) ON DELETE CASCADE,
  row_number          INTEGER NOT NULL,
  status              VARCHAR(20) NOT NULL
                      CHECK (status IN ('valid', 'invalid', 'imported', 'failed')),
  employee_code       VARCHAR(50),
  email               VARCHAR(255),
  first_name          VARCHAR(100),
  last_name           VARCHAR(100),
  branch_name         VARCHAR(255),
  branch_id           INTEGER,
  normalized_data     JSONB,
  raw_data            JSONB,
  errors              JSONB,
  created_employee_id INTEGER REFERENCES employees(id),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_rows_batch_id ON employee_import_rows(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON employee_import_rows(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON employee_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON employee_import_batches(created_by);

COMMIT;