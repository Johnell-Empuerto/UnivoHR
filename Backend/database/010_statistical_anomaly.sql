-- ============================================
-- UNIVOHR – Statistical Anomaly Detection v10
-- Date: 2026-05-26
-- ADDS: statistical columns to anomaly_logs
-- SAFE: additive only
-- ============================================

BEGIN;

ALTER TABLE anomaly_logs
  ADD COLUMN IF NOT EXISTS anomaly_score    DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS confidence       DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS baseline_value   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS statistical_method VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_anomaly_anomaly_score
    ON anomaly_logs(anomaly_score DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_confidence
    ON anomaly_logs(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_statistical_method
    ON anomaly_logs(statistical_method);

COMMIT;
