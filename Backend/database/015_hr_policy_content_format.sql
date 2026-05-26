-- ============================================
-- UNIVOHR – HR Policy Content Format v15
-- Date: 2026-05-26
-- ADDS: content_format column to hr_policy_documents
-- SAFE: IF NOT EXISTS, additive only
-- ============================================

BEGIN;

ALTER TABLE hr_policy_documents
ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) DEFAULT 'html';

COMMIT;
