-- Migration: Fix rating column type to support values up to 99.99
-- Issue: Rating 10 was stored as 9.99 due to numeric(3,2) (max 9.99)
-- Fix: Widen to numeric(5,2) (max 99.99) to support 0-10 scale

ALTER TABLE applicants
ALTER COLUMN rating TYPE numeric(5,2);

ALTER TABLE applicant_interviews
ALTER COLUMN rating TYPE numeric(5,2);

-- Note: numeric(5,2) allows up to 999.99 which safely covers
-- the 1-10 rating scale. Existing data (max 9.99) fits without changes.
