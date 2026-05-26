-- ============================================
-- UNIVOHR – AI Assistant Core v12
-- Date: 2026-05-26
-- ADDS: ai_chat_sessions, ai_chat_messages, ai_audit_logs, ai_query_templates, ai_feedback
-- SAFE: CREATE IF NOT EXISTS, additive only
-- ============================================

BEGIN;

-- ============================================
-- 1. AI CHAT SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id
    ON ai_chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_status
    ON ai_chat_sessions(status);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_last_message
    ON ai_chat_sessions(last_message_at DESC);

-- ============================================
-- 2. AI CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id               BIGSERIAL PRIMARY KEY,
    session_id       INTEGER NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role             VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content          TEXT NOT NULL,
    intent           VARCHAR(50),
    metadata         JSONB DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id
    ON ai_chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id
    ON ai_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_intent
    ON ai_chat_messages(intent);

CREATE INDEX IF NOT EXISTS idx_ai_messages_created
    ON ai_chat_messages(created_at);

-- ============================================
-- 3. AI AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id       INTEGER REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    question         TEXT NOT NULL,
    detected_intent  VARCHAR(50),
    data_scope       VARCHAR(50),
    used_modules     TEXT[],
    response_status  VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (response_status IN ('SUCCESS', 'ERROR', 'REJECTED')),
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_user_id
    ON ai_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_audit_intent
    ON ai_audit_logs(detected_intent);

CREATE INDEX IF NOT EXISTS idx_ai_audit_created
    ON ai_audit_logs(created_at DESC);

-- ============================================
-- 4. AI QUERY TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS ai_query_templates (
    id               BIGSERIAL PRIMARY KEY,
    intent           VARCHAR(50) NOT NULL UNIQUE,
    display_name     VARCHAR(100) NOT NULL,
    description      TEXT,
    sample_questions TEXT[] DEFAULT '{}',
    required_roles   VARCHAR(20)[] DEFAULT '{ADMIN,HR_ADMIN,HR,EMPLOYEE}',
    module_name      VARCHAR(50),
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_templates_intent
    ON ai_query_templates(intent);

CREATE INDEX IF NOT EXISTS idx_ai_templates_active
    ON ai_query_templates(is_active);

-- ============================================
-- 5. AI FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS ai_feedback (
    id               BIGSERIAL PRIMARY KEY,
    message_id       INTEGER NOT NULL REFERENCES ai_chat_messages(id) ON DELETE CASCADE,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_message_id
    ON ai_feedback(message_id);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id
    ON ai_feedback(user_id);

-- ============================================
-- SEED DEFAULT QUERY TEMPLATES
-- ============================================
INSERT INTO ai_query_templates (intent, display_name, description, sample_questions, required_roles, module_name)
VALUES
    ('dashboard_summary', 'Dashboard Overview', 'Get a quick summary of today attendance, anomalies, and key metrics',
     ARRAY['Show dashboard summary', 'What is the overview for today?', 'Give me the company overview'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'dashboard'),

    ('attendance_summary', 'Attendance Summary', 'Summarize attendance for today or a given period',
     ARRAY['Summarize attendance today', 'How is attendance looking?', 'Show attendance for this week'],
     ARRAY['ADMIN','HR_ADMIN','HR','EMPLOYEE'], 'attendance'),

    ('payroll_summary', 'Payroll Summary', 'Show payroll summary for the current or specified cutoff',
     ARRAY['Summarize payroll this cutoff', 'What is the total payroll for last cutoff?', 'Show payroll summary'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'payroll'),

    ('anomaly_summary', 'Anomaly Summary', 'Get a summary of detected anomalies and trends',
     ARRAY['Show anomaly summary', 'Any warnings today?', 'What anomalies were detected?'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'anomaly'),

    ('forecast_summary', 'Forecast Summary', 'Show the latest forecast predictions for attendance, payroll, and more',
     ARRAY['Show forecast summary', 'What is the prediction for next month?', 'Show forecasted attendance'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'forecast'),

    ('late_employees', 'Late Employees', 'List employees who arrived late today or within a date range',
     ARRAY['Who was late today?', 'Show late employees this week', 'List tardy employees'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'attendance'),

    ('absence_summary', 'Absence Summary', 'Show absence overview and trends across the organization',
     ARRAY['Who is absent today?', 'Show absence summary', 'What is the absentee rate?'],
     ARRAY['ADMIN','HR_ADMIN','HR'], 'attendance')

ON CONFLICT (intent) DO NOTHING;

COMMIT;
