-- ============================================
-- UNIVOHR – Employee Biodata Tables v1
-- Date: 2026-05-31
-- Creates normalized tables for Family, Education, and Work Experience
-- ============================================

BEGIN;

-- ============================================
-- 1. employee_family_members
-- ============================================
CREATE TABLE IF NOT EXISTS employee_family_members (
    id                SERIAL PRIMARY KEY,
    employee_id       INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_family_members_employee ON employee_family_members(employee_id);

-- ============================================
-- 2. employee_education
-- ============================================
CREATE TABLE IF NOT EXISTS employee_education (
    id                SERIAL PRIMARY KEY,
    employee_id       INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    education_level   VARCHAR(30) NOT NULL CHECK (education_level IN ('elementary', 'high_school', 'college', 'masters', 'doctorate', 'vocational', 'other')),
    school_name       VARCHAR(200) NOT NULL,
    course_or_degree  VARCHAR(200),
    year_started      INTEGER,
    year_graduated    INTEGER,
    honors_awards     TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_employee ON employee_education(employee_id);

-- ============================================
-- 3. employee_work_experience
-- ============================================
CREATE TABLE IF NOT EXISTS employee_work_experience (
    id                 SERIAL PRIMARY KEY,
    employee_id        INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_name       VARCHAR(200) NOT NULL,
    position           VARCHAR(150) NOT NULL,
    start_date         DATE,
    end_date           DATE,
    reason_for_leaving TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_experience_employee ON employee_work_experience(employee_id);

COMMIT;
