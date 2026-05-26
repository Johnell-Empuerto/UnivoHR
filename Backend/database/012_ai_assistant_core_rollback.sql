-- ============================================
-- UNIVOHR – AI Assistant Core Rollback v12
-- Date: 2026-05-26
-- ============================================

BEGIN;

DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS ai_query_templates CASCADE;
DROP TABLE IF EXISTS ai_audit_logs CASCADE;
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_chat_sessions CASCADE;

COMMIT;
