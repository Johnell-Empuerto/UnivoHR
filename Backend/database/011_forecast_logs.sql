-- ============================================
-- UNIVOHR – Forecasting v11
-- Date: 2026-05-26
-- ADDS: forecast_logs table, indexes
-- SAFE: CREATE IF NOT EXISTS, additive only
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS forecast_logs (
    id               BIGSERIAL PRIMARY KEY,
    metric_name      VARCHAR(100) NOT NULL,
    branch_id        INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    department       VARCHAR(100),
    predicted_value  DECIMAL(15,2) NOT NULL,
    actual_value     DECIMAL(15,2),
    confidence       DECIMAL(5,4),
    forecast_date    DATE NOT NULL,
    period_type      VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',
    method           VARCHAR(50) NOT NULL DEFAULT 'MOVING_AVERAGE',
    metadata         JSONB DEFAULT '{}'::jsonb,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_metric_name
    ON forecast_logs(metric_name);

CREATE INDEX IF NOT EXISTS idx_forecast_branch_id
    ON forecast_logs(branch_id);

CREATE INDEX IF NOT EXISTS idx_forecast_forecast_date
    ON forecast_logs(forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_period_type
    ON forecast_logs(period_type);

CREATE INDEX IF NOT EXISTS idx_forecast_metric_date
    ON forecast_logs(metric_name, forecast_date);

COMMIT;
