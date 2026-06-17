-- Migration 051: Add status audit fields to payroll table
-- Tracks when and by whom payroll records are paid, locked, voided

-- Add columns safely
ALTER TABLE payroll
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS paid_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS locked_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS voided_by INTEGER NULL;

-- Add foreign key constraints safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_paid_by_fkey'
  ) THEN
    ALTER TABLE payroll
    ADD CONSTRAINT payroll_paid_by_fkey
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_locked_by_fkey'
  ) THEN
    ALTER TABLE payroll
    ADD CONSTRAINT payroll_locked_by_fkey
    FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_voided_by_fkey'
  ) THEN
    ALTER TABLE payroll
    ADD CONSTRAINT payroll_voided_by_fkey
    FOREIGN KEY (voided_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
