/**
 * Payroll Formula Helpers
 * Pure, deterministic functions for payroll calculations.
 * No database dependencies — fully unit-testable.
 */

// ──────────────────────────────────────────────
// 1. Rate calculations
// ──────────────────────────────────────────────

function calcDailyRate(monthlySalary, workingDaysPerMonth = 26) {
  return monthlySalary / workingDaysPerMonth;
}

function calcOvertimePay(totalHours, overtimeRate) {
  return totalHours * overtimeRate;
}

function calcNightDifferentialPay(ndHours, hourlyRate, ndRate) {
  return Math.round(ndHours * hourlyRate * ndRate * 100) / 100;
}

// ──────────────────────────────────────────────
// 2. Night Differential Hours
// ──────────────────────────────────────────────

function calcNightDifferentialHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  let totalHours = 0;

  // Window 1: checkIn day 22:00 -> checkIn day+1 06:00
  const w1Start = new Date(ci);
  w1Start.setHours(22, 0, 0, 0);
  const w1End = new Date(w1Start);
  w1End.setDate(w1End.getDate() + 1);
  w1End.setHours(6, 0, 0, 0);

  const s1 = Math.max(ci.getTime(), w1Start.getTime());
  const e1 = Math.min(co.getTime(), w1End.getTime());
  if (e1 > s1) totalHours += (e1 - s1) / (1000 * 60 * 60);

  // Window 2: (checkIn day-1) 22:00 -> checkIn day 06:00
  const w2Start = new Date(ci);
  w2Start.setDate(w2Start.getDate() - 1);
  w2Start.setHours(22, 0, 0, 0);
  const w2End = new Date(ci);
  w2End.setHours(6, 0, 0, 0);

  const s2 = Math.max(ci.getTime(), w2Start.getTime());
  const e2 = Math.min(co.getTime(), w2End.getTime());
  if (e2 > s2) totalHours += (e2 - s2) / (1000 * 60 * 60);

  return Math.round(totalHours * 100) / 100;
}

// ──────────────────────────────────────────────
// 3. Late penalty minutes
// ──────────────────────────────────────────────

function calcLatePenaltyMinutes(rawLateMinutes, lateThreshold = 0, penaltyCap = 30) {
  const penaltyMinutes = rawLateMinutes - lateThreshold;
  if (penaltyMinutes > 0) {
    return Math.min(penaltyMinutes, penaltyCap);
  }
  return 0;
}

// ──────────────────────────────────────────────
// 4. Late deduction
// ──────────────────────────────────────────────

function calcLateDeduction({
  lateCount,
  effectiveLateMinutes,
  deductionType,
  deductionValue,
  lateDeductionEnabled,
  monthlySalary,
  workingDaysPerMonth = 26,
  maxWorkHours = 8,
}) {
  if (!lateDeductionEnabled) return 0;

  if (deductionType === "FIXED") {
    return lateCount * deductionValue;
  }
  if (deductionType === "PER_MINUTE") {
    return effectiveLateMinutes * deductionValue;
  }
  if (deductionType === "SALARY_BASED") {
    let days = Number(workingDaysPerMonth);
    if (!days || days < 20) days = 26;
    const totalMinutes = days * maxWorkHours * 60;
    const perMinuteRate = monthlySalary / totalMinutes;
    return effectiveLateMinutes * perMinuteRate;
  }
  return 0;
}

// ──────────────────────────────────────────────
// 5. Net salary
// ──────────────────────────────────────────────

function calcNetSalary(basicPay, totalDeductions, leaveConversionCash = 0, overtimePay = 0, nightDifferentialPay = 0) {
  return Math.max(0, basicPay - totalDeductions) + leaveConversionCash + overtimePay + nightDifferentialPay;
}

// ──────────────────────────────────────────────
// 6. Absent days
// ──────────────────────────────────────────────

function calcAbsentDays(workingDaysInCutoff, totalWorkUnitsRaw) {
  return Math.max(0, workingDaysInCutoff - Math.floor(totalWorkUnitsRaw));
}

// ──────────────────────────────────────────────
// 7. Work unit multiplier resolution
// ──────────────────────────────────────────────

const DEFAULT_MULTIPLIER = 1;

const UNWORKED_POLICY_KEYS = {
  REGULAR_HOLIDAY: "unworked_regular_holiday_policy",
  SPECIAL_HOLIDAY: "unworked_special_holiday_policy",
  SPECIAL_NON_WORKING: "unworked_special_non_working_policy",
};

const UNWORKED_POLICY_DEFAULTS = {
  REGULAR_HOLIDAY: 2,
  SPECIAL_HOLIDAY: 1,
  SPECIAL_NON_WORKING: 1,
};

function getUnworkedHolidayPolicy(dayType, hasAttendance, isLeave, payrollRulesMap = new Map()) {
  const isHolidayDay = dayType === "REGULAR_HOLIDAY" || dayType === "SPECIAL_HOLIDAY" || dayType === "SPECIAL_NON_WORKING";
  const isUnworked = isHolidayDay && !hasAttendance && !isLeave;
  if (!isUnworked) return 0;
  const key = UNWORKED_POLICY_KEYS[dayType];
  if (!key) return 0;
  return Number(payrollRulesMap.get(key) ?? UNWORKED_POLICY_DEFAULTS[dayType] ?? 1);
}

function calcHolidayRestDayMultiplier(dayType, hasAttendance, date, empRestDays, empBranchRestDays, multiplier, payrollRulesMap = new Map(), payRulesMap = {}) {
  if (!hasAttendance) return multiplier;
  if (dayType !== "REGULAR_HOLIDAY" && dayType !== "SPECIAL_HOLIDAY") return multiplier;

  const dow = date.getDay();
  const isRestDay = empRestDays?.has(dow) || empBranchRestDays?.has(dow);
  if (!isRestDay) return multiplier;

  const rdMult = payRulesMap.REST_DAY || 1;
  const method = Number(payrollRulesMap.get("holiday_rest_day_method") || 1);
  if (method === 1) return multiplier * rdMult;
  if (method === 2) return multiplier + rdMult - 1;
  if (method === 3) return Math.max(multiplier, rdMult);
  return multiplier;
}

// ──────────────────────────────────────────────
// 8. Raw work units (per attendance record)
// ──────────────────────────────────────────────

function calcRawWorkUnits(status, { isPaidLeave, isHolidayDay, unworkedPolicy, workFraction }) {
  if (status === "PRESENT") return 1;
  if (status === "LATE") return 1;
  if (status === "HALF_DAY") return workFraction || 0.5;
  if (status === "LEAVE") {
    return isPaidLeave ? 1 : 0;
  }
  if (isHolidayDay && unworkedPolicy >= 2) return 1;
  return 0;
}

// ──────────────────────────────────────────────
// 9. Breakdown helpers
// ──────────────────────────────────────────────

function createEmptyBreakdown(payRulesMap = {}) {
  return {
    REGULAR: { days: 0, units: 0, multiplier: payRulesMap.REGULAR || 1, pay: 0 },
    SPECIAL_NON_WORKING: { days: 0, units: 0, multiplier: payRulesMap.SPECIAL_NON_WORKING || 1, pay: 0 },
    SPECIAL_HOLIDAY: { days: 0, units: 0, multiplier: payRulesMap.SPECIAL_HOLIDAY || 1, pay: 0 },
    REGULAR_HOLIDAY: { days: 0, units: 0, multiplier: payRulesMap.REGULAR_HOLIDAY || 1, pay: 0 },
    REST_DAY: { days: 0, units: 0, multiplier: payRulesMap.REST_DAY || 1, pay: 0 },
  };
}

function accumulateBreakdown(breakdown, dayType, rawWorkUnits, weightedWorkUnits, dailyRate) {
  if (!breakdown[dayType]) return;
  breakdown[dayType].days += rawWorkUnits > 0 ? 1 : 0;
  breakdown[dayType].units += weightedWorkUnits;
  breakdown[dayType].pay += dailyRate * weightedWorkUnits;
}

module.exports = {
  calcDailyRate,
  calcOvertimePay,
  calcNightDifferentialPay,
  calcNightDifferentialHours,
  calcLatePenaltyMinutes,
  calcLateDeduction,
  calcNetSalary,
  calcAbsentDays,
  getUnworkedHolidayPolicy,
  calcHolidayRestDayMultiplier,
  calcRawWorkUnits,
  createEmptyBreakdown,
  accumulateBreakdown,
  DEFAULT_MULTIPLIER,
  UNWORKED_POLICY_KEYS,
  UNWORKED_POLICY_DEFAULTS,
};
