-- ============================================
-- UNIVOHR – Anomaly Detection Rollback v9
-- Date: 2026-05-26
-- DROPS: anomaly_logs table and related objects
-- ============================================

BEGIN;

DROP TRIGGER IF EXISTS trg_anomaly_updated_at ON anomaly_logs;
DROP FUNCTION IF EXISTS update_anomaly_updated_at();

DROP TABLE IF EXISTS anomaly_logs CASCADE;

DROP TYPE IF EXISTS anomaly_status;
DROP TYPE IF EXISTS anomaly_severity;

COMMIT;
