const {
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
} = require("../utils/payrollFormula.helper");

// ──────────────────────────────────────────────
// calcDailyRate
// ──────────────────────────────────────────────
describe("calcDailyRate", () => {
  it("computes daily rate from monthly salary and 26 working days", () => {
    expect(calcDailyRate(13000, 26)).toBe(500);
  });
  it("defaults to 26 working days", () => {
    expect(calcDailyRate(26000)).toBe(1000);
  });
  it("handles zero salary", () => {
    expect(calcDailyRate(0, 26)).toBe(0);
  });
  it("handles fractional results", () => {
    expect(calcDailyRate(1000, 3)).toBeCloseTo(333.333);
  });
});

// ──────────────────────────────────────────────
// calcOvertimePay
// ──────────────────────────────────────────────
describe("calcOvertimePay", () => {
  it("computes overtime pay", () => {
    expect(calcOvertimePay(10, 50)).toBe(500);
  });
  it("returns zero for zero hours", () => {
    expect(calcOvertimePay(0, 50)).toBe(0);
  });
  it("returns zero for zero rate", () => {
    expect(calcOvertimePay(10, 0)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// calcNightDifferentialHours
// ──────────────────────────────────────────────
describe("calcNightDifferentialHours", () => {
  it("returns 0 for null checkIn", () => {
    expect(calcNightDifferentialHours(null, new Date("2025-01-15T23:00:00"))).toBe(0);
  });
  it("returns 0 for null checkOut", () => {
    expect(calcNightDifferentialHours(new Date("2025-01-15T23:00:00"), null)).toBe(0);
  });
  it("returns 0 for both null", () => {
    expect(calcNightDifferentialHours(null, null)).toBe(0);
  });

  it("counts full 8-hour night shift (10pm-6am)", () => {
    const checkIn = new Date("2025-01-15T22:00:00");
    const checkOut = new Date("2025-01-16T06:00:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(8);
  });

  it("counts partial night window (midnight-4am = 4 hours)", () => {
    const checkIn = new Date("2025-01-16T00:00:00");
    const checkOut = new Date("2025-01-16T04:00:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(4);
  });

  it("counts pre-6am work (window 2)", () => {
    const checkIn = new Date("2025-01-16T03:00:00");
    const checkOut = new Date("2025-01-16T07:00:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(3);
  });

  it("counts post-10pm work (window 1)", () => {
    const checkIn = new Date("2025-01-15T20:00:00");
    const checkOut = new Date("2025-01-15T23:30:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(1.5);
  });

  it("counts overlap across both windows (day shift straddling midnight)", () => {
    const checkIn = new Date("2025-01-15T21:00:00");
    const checkOut = new Date("2025-01-16T07:00:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(8);
  });

  it("returns zero when clock-in and out are fully outside ND window", () => {
    const checkIn = new Date("2025-01-15T08:00:00");
    const checkOut = new Date("2025-01-15T17:00:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const checkIn = new Date("2025-01-15T22:00:00");
    const checkOut = new Date("2025-01-15T22:45:00");
    expect(calcNightDifferentialHours(checkIn, checkOut)).toBe(0.75);
  });
});

// ──────────────────────────────────────────────
// calcNightDifferentialPay
// ──────────────────────────────────────────────
describe("calcNightDifferentialPay", () => {
  it("computes ND pay rounded to 2 decimals", () => {
    const pay = calcNightDifferentialPay(8, 62.5, 0.10);
    expect(pay).toBe(50);
  });
  it("returns 0 for zero hours", () => {
    expect(calcNightDifferentialPay(0, 62.5, 0.10)).toBe(0);
  });
  it("handles fractional rate", () => {
    const pay = calcNightDifferentialPay(7.5, 100, 0.15);
    expect(pay).toBeCloseTo(112.5);
  });
});

// ──────────────────────────────────────────────
// calcLatePenaltyMinutes
// ──────────────────────────────────────────────
describe("calcLatePenaltyMinutes", () => {
  it("returns 0 when within threshold", () => {
    expect(calcLatePenaltyMinutes(5, 10)).toBe(0);
  });
  it("returns penalty minutes above threshold", () => {
    expect(calcLatePenaltyMinutes(20, 10)).toBe(10);
  });
  it("capped at 30 minutes by default", () => {
    expect(calcLatePenaltyMinutes(60, 0)).toBe(30);
  });
  it("uses custom penalty cap", () => {
    expect(calcLatePenaltyMinutes(60, 0, 45)).toBe(45);
  });
  it("returns 0 when raw is equal to threshold", () => {
    expect(calcLatePenaltyMinutes(10, 10)).toBe(0);
  });
  it("returns 0 for negative late minutes (early arrival)", () => {
    expect(calcLatePenaltyMinutes(-5, 0)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// calcLateDeduction
// ──────────────────────────────────────────────
describe("calcLateDeduction", () => {
  const baseParams = {
    lateCount: 0,
    effectiveLateMinutes: 0,
    deductionType: "FIXED",
    deductionValue: 0,
    lateDeductionEnabled: true,
    monthlySalary: 13000,
    workingDaysPerMonth: 26,
    maxWorkHours: 8,
  };

  it("returns 0 when late deduction is disabled", () => {
    expect(calcLateDeduction({ ...baseParams, lateDeductionEnabled: false })).toBe(0);
  });

  describe("FIXED type", () => {
    it("multiplies late count by fixed amount", () => {
      const result = calcLateDeduction({ ...baseParams, deductionType: "FIXED", deductionValue: 50, lateCount: 3 });
      expect(result).toBe(150);
    });
    it("returns 0 for zero late count", () => {
      const result = calcLateDeduction({ ...baseParams, deductionType: "FIXED", deductionValue: 50, lateCount: 0 });
      expect(result).toBe(0);
    });
  });

  describe("PER_MINUTE type", () => {
    it("multiplies effective minutes by per-minute amount", () => {
      const result = calcLateDeduction({ ...baseParams, deductionType: "PER_MINUTE", deductionValue: 5, effectiveLateMinutes: 30 });
      expect(result).toBe(150);
    });
    it("returns 0 for zero minutes", () => {
      const result = calcLateDeduction({ ...baseParams, deductionType: "PER_MINUTE", deductionValue: 5, effectiveLateMinutes: 0 });
      expect(result).toBe(0);
    });
  });

  describe("SALARY_BASED type", () => {
    it("deducts proportionally from salary", () => {
      const result = calcLateDeduction({
        ...baseParams,
        deductionType: "SALARY_BASED",
        monthlySalary: 20800,
        workingDaysPerMonth: 26,
        effectiveLateMinutes: 60,
      });
      // 26 days * 8 hrs * 60 min = 12480 total minutes
      // perMinuteRate = 20800 / 12480 ≈ 1.6667
      // deduction = 60 * 1.6667 = 100
      expect(result).toBeCloseTo(100, 1);
    });
    it("defaults to 26 days when workingDaysPerMonth < 20", () => {
      const result = calcLateDeduction({
        ...baseParams,
        deductionType: "SALARY_BASED",
        monthlySalary: 20800,
        workingDaysPerMonth: 5,
        effectiveLateMinutes: 60,
      });
      // Should default to 26 days
      expect(result).toBeCloseTo(100, 1);
    });
    it("handles NaN workingDaysPerMonth by defaulting to 26", () => {
      const result = calcLateDeduction({
        ...baseParams,
        deductionType: "SALARY_BASED",
        monthlySalary: 20800,
        workingDaysPerMonth: NaN,
        effectiveLateMinutes: 60,
      });
      expect(result).toBeCloseTo(100, 1);
    });
  });
});

// ──────────────────────────────────────────────
// calcNetSalary
// ──────────────────────────────────────────────
describe("calcNetSalary", () => {
  it("subtracts deductions from basic pay", () => {
    expect(calcNetSalary(1000, 200)).toBe(800);
  });
  it("adds leave conversion cash", () => {
    expect(calcNetSalary(1000, 200, 150)).toBe(950);
  });
  it("adds overtime pay", () => {
    expect(calcNetSalary(1000, 200, 0, 300)).toBe(1100);
  });
  it("adds night differential pay", () => {
    expect(calcNetSalary(1000, 200, 0, 0, 50)).toBe(850);
  });
  it("returns 0 when deductions exceed basic pay", () => {
    expect(calcNetSalary(100, 200)).toBe(0);
  });
  it("does not floor extra additions (leaveConversion, OT, ND) when basic pay is negative", () => {
    const result = calcNetSalary(100, 500, 50, 30, 20);
    expect(result).toBe(100);
  });
});

// ──────────────────────────────────────────────
// calcAbsentDays
// ──────────────────────────────────────────────
describe("calcAbsentDays", () => {
  it("subtracts floored work units from working days", () => {
    expect(calcAbsentDays(20, 18.5)).toBe(2);
  });
  it("returns 0 when work units exceed working days", () => {
    expect(calcAbsentDays(20, 22)).toBe(0);
  });
  it("returns 0 when work units equal working days", () => {
    expect(calcAbsentDays(20, 20)).toBe(0);
  });
  it("returns 0 for zero working days", () => {
    expect(calcAbsentDays(0, 0)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// getUnworkedHolidayPolicy
// ──────────────────────────────────────────────
describe("getUnworkedHolidayPolicy", () => {
  it("returns 0 for REGULAR day type (not a holiday)", () => {
    expect(getUnworkedHolidayPolicy("REGULAR", false, false)).toBe(0);
  });
  it("returns 0 when employee attended (hasAttendance = true)", () => {
    expect(getUnworkedHolidayPolicy("REGULAR_HOLIDAY", true, false)).toBe(0);
  });
  it("returns 0 when employee is on leave", () => {
    expect(getUnworkedHolidayPolicy("REGULAR_HOLIDAY", false, true)).toBe(0);
  });
  it("returns DEFAULT 2 for unworked REGULAR_HOLIDAY", () => {
    expect(getUnworkedHolidayPolicy("REGULAR_HOLIDAY", false, false)).toBe(2);
  });
  it("returns DEFAULT 1 for unworked SPECIAL_HOLIDAY", () => {
    expect(getUnworkedHolidayPolicy("SPECIAL_HOLIDAY", false, false)).toBe(1);
  });
  it("returns DEFAULT 1 for unworked SPECIAL_NON_WORKING", () => {
    expect(getUnworkedHolidayPolicy("SPECIAL_NON_WORKING", false, false)).toBe(1);
  });
  it("reads custom policy from payrollRulesMap", () => {
    const rules = new Map([
      ["unworked_regular_holiday_policy", "3"],
    ]);
    expect(getUnworkedHolidayPolicy("REGULAR_HOLIDAY", false, false, rules)).toBe(3);
  });
  it("reads custom SPECIAL_HOLIDAY policy from payrollRulesMap", () => {
    const rules = new Map([
      ["unworked_special_holiday_policy", "2"],
    ]);
    expect(getUnworkedHolidayPolicy("SPECIAL_HOLIDAY", false, false, rules)).toBe(2);
  });
});

// ──────────────────────────────────────────────
// calcHolidayRestDayMultiplier
// ──────────────────────────────────────────────
describe("calcHolidayRestDayMultiplier", () => {
  const empRestDays = new Set([0, 6]); // Sun, Sat
  const baseDate = new Date("2025-01-19"); // Sunday (dow = 0)
  const payRulesMap = { REST_DAY: 1.3 };

  it("returns multiplier unchanged when no attendance", () => {
    expect(calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", false, baseDate, empRestDays, null, 2)).toBe(2);
  });
  it("returns multiplier unchanged when dayType is not a holiday", () => {
    expect(calcHolidayRestDayMultiplier("REGULAR", true, baseDate, empRestDays, null, 1)).toBe(1);
  });
  it("returns multiplier unchanged when day is not a rest day", () => {
    const monday = new Date("2025-01-20");
    expect(calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", true, monday, empRestDays, null, 2)).toBe(2);
  });
  it("uses method 1: multiplicative (default)", () => {
    const result = calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", true, baseDate, empRestDays, null, 2, new Map(), payRulesMap);
    expect(result).toBeCloseTo(2 * 1.3);
  });
  it("uses method 2: additive", () => {
    const rules = new Map([["holiday_rest_day_method", "2"]]);
    const result = calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", true, baseDate, empRestDays, null, 2, rules, payRulesMap);
    expect(result).toBeCloseTo(2 + 1.3 - 1);
  });
  it("uses method 3: max", () => {
    const rules = new Map([["holiday_rest_day_method", "3"]]);
    const result = calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", true, baseDate, empRestDays, null, 1.5, rules, payRulesMap);
    expect(result).toBe(1.5);
  });
  it("uses method 3: max picks rdMult when larger", () => {
    const rules = new Map([["holiday_rest_day_method", "3"]]);
    const result = calcHolidayRestDayMultiplier("REGULAR_HOLIDAY", true, baseDate, empRestDays, null, 1, rules, payRulesMap);
    expect(result).toBe(1.3);
  });
  it("works for SPECIAL_HOLIDAY", () => {
    const rules = new Map([["holiday_rest_day_method", "1"]]);
    const result = calcHolidayRestDayMultiplier("SPECIAL_HOLIDAY", true, baseDate, empRestDays, null, 2, rules, payRulesMap);
    expect(result).toBeCloseTo(2 * 1.3);
  });
});

// ──────────────────────────────────────────────
// calcRawWorkUnits
// ──────────────────────────────────────────────
describe("calcRawWorkUnits", () => {
  it("returns 1 for PRESENT", () => {
    expect(calcRawWorkUnits("PRESENT", {})).toBe(1);
  });
  it("returns 1 for LATE", () => {
    expect(calcRawWorkUnits("LATE", {})).toBe(1);
  });
  it("returns workFraction for HALF_DAY", () => {
    expect(calcRawWorkUnits("HALF_DAY", { workFraction: 0.5 })).toBe(0.5);
  });
  it("defaults to 0.5 for HALF_DAY without workFraction", () => {
    expect(calcRawWorkUnits("HALF_DAY", {})).toBe(0.5);
  });
  it("returns 1 for paid leave", () => {
    expect(calcRawWorkUnits("LEAVE", { isPaidLeave: true })).toBe(1);
  });
  it("returns 0 for unpaid leave", () => {
    expect(calcRawWorkUnits("LEAVE", { isPaidLeave: false })).toBe(0);
  });
  it("returns 1 for absent on holiday with unworkedPolicy >= 2", () => {
    expect(calcRawWorkUnits(null, { isHolidayDay: true, unworkedPolicy: 2 })).toBe(1);
  });
  it("returns 0 for absent on holiday with unworkedPolicy 1 (NO_PAY)", () => {
    expect(calcRawWorkUnits(null, { isHolidayDay: true, unworkedPolicy: 1 })).toBe(0);
  });
  it("returns 0 for absent on regular day", () => {
    expect(calcRawWorkUnits(null, { isHolidayDay: false })).toBe(0);
  });
  it("returns 0 for ABSENT status on non-holiday", () => {
    expect(calcRawWorkUnits("ABSENT", { isHolidayDay: false })).toBe(0);
  });
});

// ──────────────────────────────────────────────
// createEmptyBreakdown
// ──────────────────────────────────────────────
describe("createEmptyBreakdown", () => {
  it("creates breakdown with 5 day types", () => {
    const bd = createEmptyBreakdown();
    expect(Object.keys(bd)).toEqual(["REGULAR", "SPECIAL_NON_WORKING", "SPECIAL_HOLIDAY", "REGULAR_HOLIDAY", "REST_DAY"]);
  });
  it("sets all values to zero defaults", () => {
    const bd = createEmptyBreakdown();
    for (const key of Object.keys(bd)) {
      expect(bd[key]).toEqual({ days: 0, units: 0, multiplier: 1, pay: 0 });
    }
  });
  it("reads multipliers from payRulesMap", () => {
    const prm = { REGULAR: 1, SPECIAL_NON_WORKING: 1.3, REST_DAY: 1.5 };
    const bd = createEmptyBreakdown(prm);
    expect(bd.REGULAR.multiplier).toBe(1);
    expect(bd.SPECIAL_NON_WORKING.multiplier).toBe(1.3);
    expect(bd.REST_DAY.multiplier).toBe(1.5);
  });
});

// ──────────────────────────────────────────────
// accumulateBreakdown
// ──────────────────────────────────────────────
describe("accumulateBreakdown", () => {
  it("increments days, units, pay for a matching dayType", () => {
    const bd = createEmptyBreakdown();
    accumulateBreakdown(bd, "REGULAR", 1, 1, 500);
    expect(bd.REGULAR).toEqual({ days: 1, units: 1, multiplier: 1, pay: 500 });
  });
  it("accumulates multiple entries", () => {
    const bd = createEmptyBreakdown();
    accumulateBreakdown(bd, "REGULAR", 1, 1, 500);
    accumulateBreakdown(bd, "REGULAR", 1, 1.5, 500);
    expect(bd.REGULAR.days).toBe(2);
    expect(bd.REGULAR.units).toBe(2.5);
    expect(bd.REGULAR.pay).toBe(1250);
  });
  it("does not count day when rawWorkUnits is 0", () => {
    const bd = createEmptyBreakdown();
    accumulateBreakdown(bd, "REGULAR", 0, 0, 500);
    expect(bd.REGULAR.days).toBe(0);
  });
  it("ignores unknown dayType", () => {
    const bd = createEmptyBreakdown();
    accumulateBreakdown(bd, "NON_EXISTENT", 1, 1, 500);
    for (const key of Object.keys(bd)) {
      expect(bd[key].days).toBe(0);
    }
  });
});

// ──────────────────────────────────────────────
// DEFAULT_MULTIPLIER constant
// ──────────────────────────────────────────────
describe("DEFAULT_MULTIPLIER", () => {
  it("is 1", () => {
    expect(DEFAULT_MULTIPLIER).toBe(1);
  });
});

// ──────────────────────────────────────────────
// UNWORKED_POLICY_KEYS and DEFAULTS
// ──────────────────────────────────────────────
describe("UNWORKED_POLICY_KEYS", () => {
  it("maps REGULAR_HOLIDAY to unworked_regular_holiday_policy", () => {
    expect(UNWORKED_POLICY_KEYS.REGULAR_HOLIDAY).toBe("unworked_regular_holiday_policy");
  });
  it("maps SPECIAL_HOLIDAY to unworked_special_holiday_policy", () => {
    expect(UNWORKED_POLICY_KEYS.SPECIAL_HOLIDAY).toBe("unworked_special_holiday_policy");
  });
  it("maps SPECIAL_NON_WORKING to unworked_special_non_working_policy", () => {
    expect(UNWORKED_POLICY_KEYS.SPECIAL_NON_WORKING).toBe("unworked_special_non_working_policy");
  });
});

describe("UNWORKED_POLICY_DEFAULTS", () => {
  it("REGULAR_HOLIDAY defaults to 2 (DAILY_RATE)", () => {
    expect(UNWORKED_POLICY_DEFAULTS.REGULAR_HOLIDAY).toBe(2);
  });
  it("SPECIAL_HOLIDAY defaults to 1 (NO_PAY)", () => {
    expect(UNWORKED_POLICY_DEFAULTS.SPECIAL_HOLIDAY).toBe(1);
  });
  it("SPECIAL_NON_WORKING defaults to 1 (NO_PAY)", () => {
    expect(UNWORKED_POLICY_DEFAULTS.SPECIAL_NON_WORKING).toBe(1);
  });
});
