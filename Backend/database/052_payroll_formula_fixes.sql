-- Phase 2B: Payroll Formula and Config Fixes
-- Adds missing REST_DAY pay rule and holiday_rest_day_method config

-- 1. Add REST_DAY default multiplier (1.30 = 130% of daily rate)
INSERT INTO pay_rules (day_type, multiplier)
SELECT 'REST_DAY', 1.30
WHERE NOT EXISTS (
  SELECT 1 FROM pay_rules WHERE day_type = 'REST_DAY'
);

-- 2. Add holiday_rest_day_method default (1 = multiply)
INSERT INTO payroll_rules (rule_key, rule_value, description)
SELECT 'holiday_rest_day_method', 1, 'Holiday on rest day calculation method: 1=multiply, 2=additive minus 1, 3=max'
WHERE NOT EXISTS (
  SELECT 1 FROM payroll_rules WHERE rule_key = 'holiday_rest_day_method'
);
