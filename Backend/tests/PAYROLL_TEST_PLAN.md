# Payroll Formula Test Plan

## Status: Test Plan Only

Payroll calculation logic is embedded inside `Backend/models/payroll.model.js` (1660 lines)
as inline SQL queries within the `generatePayroll` function. There are no pure helper functions
to unit test directly without either:
- Extracting calculation logic into separate pure functions
- Creating a test database with fixtures

Both options are outside the scope of Phase 5. This plan documents the test cases
that should be covered when a testable payroll module is available.

---

## Test Cases Documented

| ID | Test | Expected Behavior |
|----|------|-------------------|
| P01 | Regular day pay | Daily rate = (monthly_salary × 12) / 313 × 1.0 |
| P02 | Rest day multiplier | Daily rate × 1.3 (or configured rest day multiplier) |
| P03 | Special non-working day | Daily rate × 1.3 |
| P04 | Special holiday | Daily rate × 1.3 |
| P05 | Regular holiday | Daily rate × 2.0 |
| P06 | Holiday on rest day | Regular holiday multiplier × rest day multiplier |
| P07 | Late deduction with grace period | Deduction = (monthly_salary × 12 / 313 / 8) × late_hours, with grace window |
| P08 | Absent deduction (display) | Deduction = daily_rate, display-only if credits available |
| P09 | Absent deduction cannot go negative | Deduction should floor at 0 |
| P10 | Paid leave counts as paid work unit | Leave with pay = same as regular work day |
| P11 | Unpaid leave counts as zero work unit | Leave without pay = 0 |
| P12 | Overtime pay | Overtime_hours × hourly_rate × OT_multiplier |
| P13 | Night differential hours/pay | Hours between 10pm-6am × hourly_rate × 1.1 |
| P14 | Night differential on rest day/holiday | Night diff hours × applicable day rate × 1.1 |

## Multiplier Reference (from pay_rules table)

| day_type | multiplier |
|----------|-----------|
| regular_workday | 1.0 |
| rest_day | 1.3 |
| special_non_working_holiday | 1.3 |
| special_holiday | 1.3 |
| regular_holiday | 2.0 |
| regular_holiday_rest_day | 2.6 |

## Formula Reference

- Hourly rate = (monthly_salary × 12) / 313 / 8
- Daily rate = hourly_rate × 8
- Day pay = daily_rate × multiplier
- Late deduction = hourly_rate × late_hours (after grace period)
- OT pay = OT_hours × hourly_rate × OT_multiplier
- Night diff = ND_hours × hourly_rate × 0.1

## Prerequisites for Automation

- [ ] Extract pay calculation into pure functions in a separate helper
- [ ] Create test database fixtures or mock data
- [ ] Add Jest test file (`payroll.test.js`)
- [ ] Add CI pipeline to run tests
