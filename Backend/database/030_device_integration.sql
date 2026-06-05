-- ============================================
-- Phase 1: Device Integrations Module
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- 1. Extend devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'BIOMETRIC';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS port INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMP;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Extend raw_logs table
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS raw_payload TEXT;
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(50);
ALTER TABLE raw_logs ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'API';

-- 3. Create device_log_mappings table
CREATE TABLE IF NOT EXISTS device_log_mappings (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    field_source VARCHAR(100) NOT NULL,
    field_target VARCHAR(100) NOT NULL,
    transform_expression TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create attendance_logs staging table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    raw_log_id INTEGER REFERENCES raw_logs(id) ON DELETE SET NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    employee_code VARCHAR(50),
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    log_timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
