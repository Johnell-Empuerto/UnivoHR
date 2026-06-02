-- ============================================
-- Phase 2F.1: Holiday Payroll Corrections
-- ADDITIVE ONLY — safe for existing data
-- ============================================

BEGIN;

INSERT INTO payroll_rules (rule_key, rule_value, description) VALUES
  ('holiday_rest_day_method', 1,
   'Holiday-on-rest-day composite: 1=MULTIPLICATIVE, 2=ADDITIVE, 3=MAX_ONLY'),
  ('unworked_regular_holiday_policy', 2,
   'Unworked REGULAR_HOLIDAY policy: 1=NO_PAY, 2=DAILY_RATE, 3=HOLIDAY_RATE'),
  ('unworked_special_holiday_policy', 1,
   'Unworked SPECIAL_HOLIDAY policy: 1=NO_PAY, 2=DAILY_RATE, 3=HOLIDAY_RATE'),
  ('unworked_special_non_working_policy', 1,
   'Unworked SPECIAL_NON_WORKING policy: 1=NO_PAY, 2=DAILY_RATE, 3=HOLIDAY_RATE')
ON CONFLICT (rule_key) DO NOTHING;

COMMIT;
