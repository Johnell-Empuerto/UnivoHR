BEGIN;

-- ============================================
-- Phase 1: Timezone Foundation
-- ADDITIVE ONLY — safe for existing data
-- ============================================

-- 1. Add timezone to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila';

COMMENT ON COLUMN branches.timezone IS 'IANA timezone identifier for the branch (e.g. Asia/Manila, Asia/Kuala_Lumpur)';

-- 2. Add branch_id to devices
ALTER TABLE devices ADD COLUMN IF NOT EXISTS branch_id INTEGER NULL REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_devices_branch_id ON devices(branch_id);

-- 3. Add branch_id to attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS branch_id INTEGER NULL REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_id ON attendance(branch_id);

-- 4. Add timezone_used to attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS timezone_used VARCHAR(50) NULL;

COMMENT ON COLUMN attendance.timezone_used IS 'IANA timezone used when generating check-in/check-out timestamps';

-- 5. Add device_id to attendance (if not existing)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_id INTEGER NULL REFERENCES devices(id);
CREATE INDEX IF NOT EXISTS idx_attendance_device_id ON attendance(device_id);

-- 6. Add company_timezone setting (safe upsert)
INSERT INTO system_settings (key, value, description)
VALUES ('company_timezone', 'Asia/Manila', 'Default IANA timezone for the company')
ON CONFLICT (key) DO NOTHING;

COMMIT;
