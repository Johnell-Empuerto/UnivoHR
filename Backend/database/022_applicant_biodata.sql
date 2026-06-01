-- ============================================
-- UNIVOHR – Applicant Biodata Tables v1
-- Date: 2026-05-31
-- Creates normalized tables for Family, Education, and Work Experience
-- ============================================

BEGIN;

-- ============================================
-- 1. applicant_family_members
-- ============================================
CREATE TABLE IF NOT EXISTS applicant_family_members (
    id                SERIAL PRIMARY KEY,
    applicant_id      INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL CHECK (relationship_type IN ('spouse', 'child', 'father', 'mother', 'parent', 'dependent')),
    full_name         VARCHAR(150) NOT NULL,
    birthdate         DATE,
    occupation        VARCHAR(150),
    contact_number    VARCHAR(30),
    address           TEXT,
    is_dependent      BOOLEAN DEFAULT false,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_family_members_applicant ON applicant_family_members(applicant_id);

-- ============================================
-- 2. applicant_education
-- ============================================
CREATE TABLE IF NOT EXISTS applicant_education (
    id                SERIAL PRIMARY KEY,
    applicant_id      INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    education_level   VARCHAR(30) NOT NULL CHECK (education_level IN ('elementary', 'high_school', 'college', 'masters', 'doctorate', 'vocational', 'other')),
    school_name       VARCHAR(200) NOT NULL,
    course_or_degree  VARCHAR(200),
    year_started      INTEGER,
    year_graduated    INTEGER,
    honors_awards     TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_education_applicant ON applicant_education(applicant_id);

-- ============================================
-- 3. applicant_work_experience
-- ============================================
CREATE TABLE IF NOT EXISTS applicant_work_experience (
    id                 SERIAL PRIMARY KEY,
    applicant_id       INTEGER NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    company_name       VARCHAR(200) NOT NULL,
    position           VARCHAR(150) NOT NULL,
    start_date         DATE,
    end_date           DATE,
    reason_for_leaving TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_work_experience_applicant ON applicant_work_experience(applicant_id);

COMMIT;
