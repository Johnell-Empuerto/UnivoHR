-- ============================================
-- UNIVOHR – Statistical Anomaly Rollback v10
-- Date: 2026-05-26
-- ============================================

BEGIN;

DROP INDEX IF EXISTS idx_anomaly_anomaly_score;
DROP INDEX IF EXISTS idx_anomaly_confidence;
DROP INDEX IF EXISTS idx_anomaly_statistical_method;

ALTER TABLE anomaly_logs
  DROP COLUMN IF EXISTS anomaly_score,
  DROP COLUMN IF EXISTS confidence,
  DROP COLUMN IF EXISTS baseline_value,
  DROP COLUMN IF EXISTS statistical_method;

COMMIT;
