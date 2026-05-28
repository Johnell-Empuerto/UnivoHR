-- ============================================
-- UNIVOHR – Recruitment & Onboarding v16
-- Date: 2026-05-26
-- ADDS: job_positions, applicants, applicant_documents,
--       applicant_interviews, applicant_approvals,
--       employee_onboarding, employee_requirements
-- SAFE: IF NOT EXISTS, additive only
-- ============================================

BEGIN;

-- 1. JOB POSITIONS
CREATE TABLE IF NOT EXISTS job_positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    description TEXT,
    requirements TEXT,
    salary_range VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED','ON_HOLD')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_positions_status ON job_positions(status);
CREATE INDEX IF NOT EXISTS idx_job_positions_department ON job_positions(department);

-- 2. APPLICANTS
CREATE TABLE IF NOT EXISTS applicants (
    id SERIAL PRIMARY KEY,
    job_position_id INT REFERENCES job_positions(id) ON DELETE SET NULL,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    suffix VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    resume_url TEXT,
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW','SCREENING','SHORTLISTED','FOR_INTERVIEW','FOR_APPROVAL','APPROVED','REJECTED','HIRED','WITHDRAWN')),
    rating DECIMAL(3,2),
    source VARCHAR(100),
    notes TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_job_position ON applicants(job_position_id);

-- 3. APPLICANT DOCUMENTS
CREATE TABLE IF NOT EXISTS applicant_documents (
    id SERIAL PRIMARY KEY,
    applicant_id INT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_documents_applicant ON applicant_documents(applicant_id);

-- 4. APPLICANT INTERVIEWS
CREATE TABLE IF NOT EXISTS applicant_interviews (
    id SERIAL PRIMARY KEY,
    applicant_id INT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    interview_date TIMESTAMP NOT NULL,
    interviewer VARCHAR(255),
    interview_type VARCHAR(100),
    notes TEXT,
    rating DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_interviews_applicant ON applicant_interviews(applicant_id);

-- 5. APPLICANT APPROVALS
CREATE TABLE IF NOT EXISTS applicant_approvals (
    id SERIAL PRIMARY KEY,
    applicant_id INT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    approved_by INT REFERENCES employees(id),
    approval_type VARCHAR(100) NOT NULL,
    decision VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (decision IN ('APPROVED','REJECTED','PENDING')),
    comments TEXT,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applicant_approvals_applicant ON applicant_approvals(applicant_id);

-- 6. EMPLOYEE ONBOARDING
CREATE TABLE IF NOT EXISTS employee_onboarding (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    applicant_id INT REFERENCES applicants(id),
    onboarding_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_onboarding_employee ON employee_onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_status ON employee_onboarding(status);

-- 7. EMPLOYEE REQUIREMENTS
CREATE TABLE IF NOT EXISTS employee_requirements (
    id SERIAL PRIMARY KEY,
    onboarding_id INT NOT NULL REFERENCES employee_onboarding(id) ON DELETE CASCADE,
    requirement_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUBMITTED','VERIFIED','REJECTED')),
    submitted_at TIMESTAMP,
    verified_at TIMESTAMP,
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_requirements_onboarding ON employee_requirements(onboarding_id);

COMMIT;
