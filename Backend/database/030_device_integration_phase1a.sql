-- ============================================
-- Phase 1A: Device Integrations — Database Foundation
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

-- ============================================
-- 1. EXTEND devices TABLE
-- ============================================
-- Existing columns: id, name, ip_address, location, created_at
-- Adding: type, status, updated_at

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS type      VARCHAR(50)  DEFAULT 'BIOMETRIC',
  ADD COLUMN IF NOT EXISTS status    VARCHAR(20)  DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- ============================================
-- 2. CREATE device_log_mappings TABLE
-- ============================================
-- Maps fields in a device's raw payload to system fields
-- so different device vendors can be supported without code changes.

CREATE TABLE IF NOT EXISTS device_log_mappings (
  id                  SERIAL PRIMARY KEY,
  device_id           INTEGER NOT NULL,
  employee_code_field VARCHAR(100) NOT NULL,
  timestamp_field     VARCHAR(100) NOT NULL,
  event_type_field    VARCHAR(100),
  active              BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_device_log_mappings_device
    FOREIGN KEY (device_id)
    REFERENCES devices(id)
    ON DELETE CASCADE
);

-- ============================================
-- 3. EXTEND raw_logs TABLE
-- ============================================
-- Existing columns: id, device_id, employee_code, timestamp, created_at
-- Adding: raw_payload, source, status, error_message, processed_at

ALTER TABLE raw_logs
  ADD COLUMN IF NOT EXISTS raw_payload   TEXT,
  ADD COLUMN IF NOT EXISTS source        VARCHAR(20) NOT NULL DEFAULT 'API',
  ADD COLUMN IF NOT EXISTS status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS processed_at  TIMESTAMP;

-- ============================================
-- 4. CREATE employee_device_users TABLE
-- ============================================
-- Maps biometric/enrollment identifiers from devices to HRMS employees.
-- Example: device_user_id = '1001' → employee_code = 'EMP-0001'

CREATE TABLE IF NOT EXISTS employee_device_users (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  device_id      INTEGER NOT NULL,
  device_user_id VARCHAR(100) NOT NULL,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_employee_device_users_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_employee_device_users_device
    FOREIGN KEY (device_id)
    REFERENCES devices(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_employee_device_users
    UNIQUE (device_id, device_user_id)
);

-- ============================================
-- 5. INDEXES
-- ============================================

-- device_log_mappings
CREATE INDEX IF NOT EXISTS idx_device_log_mappings_device
  ON device_log_mappings(device_id);

-- raw_logs — status and source filtering
CREATE INDEX IF NOT EXISTS idx_raw_logs_status
  ON raw_logs(status);

CREATE INDEX IF NOT EXISTS idx_raw_logs_source
  ON raw_logs(source);

CREATE INDEX IF NOT EXISTS idx_raw_logs_device_status
  ON raw_logs(device_id, status);

-- raw_logs — timestamp range queries (date filtering)
CREATE INDEX IF NOT EXISTS idx_raw_logs_timestamp
  ON raw_logs("timestamp");

-- employee_device_users
CREATE INDEX IF NOT EXISTS idx_employee_device_users_employee
  ON employee_device_users(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_device_users_device
  ON employee_device_users(device_id);

-- Lookup index: find employee by device + device_user_id
CREATE INDEX IF NOT EXISTS idx_employee_device_users_lookup
  ON employee_device_users(device_id, device_user_id);

COMMIT;
