jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/attendance.model", () => ({
  getOpenAttendanceRecord: jest.fn(),
  getTodayRecord: jest.fn(),
  checkIn: jest.fn(),
  checkOut: jest.fn(),
  getAttendance: jest.fn(),
  getByEmployee: jest.fn(),
  getRules: jest.fn(),
  updateRules: jest.fn(),
  getAllRules: jest.fn(),
  createRule: jest.fn(),
  setActiveRule: jest.fn(),
  deleteRule: jest.fn(),
  updateRule: jest.fn(),
}));
jest.mock("../services/shift.service", () => ({}));
jest.mock("../services/rotation.service", () => ({
  resolveEmployeeShift: jest.fn(),
}));
jest.mock("../constants/status", () => ({
  PRESENT: "PRESENT",
  LATE: "LATE",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
  HALFDAY: "HALFDAY",
}));
jest.mock("../utils/date", () => ({
  getLocalDate: jest.fn(),
}));
jest.mock("../utils/timezone", () => ({
  resolveEmployeeTimezone: jest.fn(),
  resolveBranchId: jest.fn(),
  resolveDeviceBranchId: jest.fn(),
}));
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const pool = require("../config/db");
const attendanceModel = require("../models/attendance.model");
const rotationService = require("../services/rotation.service");
const { getLocalDate } = require("../utils/date");
const {
  resolveEmployeeTimezone, resolveBranchId, resolveDeviceBranchId,
} = require("../utils/timezone");
const STATUS = require("../constants/status");
const {
  createAttendance, getAttendance, getByEmployee, isDuplicateScan,
  getRules, updateRules, getAllRules, createRule, setActiveRule,
  deleteRule, updateRule, webClockIn, webClockOut,
} = require("../services/attendance.service");

describe("attendance.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============== isDuplicateScan ==============

  describe("isDuplicateScan", () => {
    it("returns true when diff < minutes", () => {
      expect(isDuplicateScan("2026-07-06T08:00:00", "2026-07-06T08:01:30", 2)).toBe(true);
    });

    it("returns false when diff >= minutes", () => {
      expect(isDuplicateScan("2026-07-06T08:00:00", "2026-07-06T08:02:00", 2)).toBe(false);
    });

    it("defaults minutes to 2", () => {
      expect(isDuplicateScan("2026-07-06T08:00:00", "2026-07-06T08:01:00")).toBe(true);
      expect(isDuplicateScan("2026-07-06T08:00:00", "2026-07-06T08:02:00")).toBe(false);
    });

    it("returns true when currentTime is before lastTime", () => {
      expect(isDuplicateScan("2026-07-06T08:05:00", "2026-07-06T08:03:00", 5)).toBe(true);
    });
  });

  // ============== Simple Delegation Functions ==============

  describe("getAttendance", () => {
    it("delegates to attendanceModel.getAttendance", async () => {
      const expected = [{ id: 1, employee_id: 1 }];
      attendanceModel.getAttendance.mockResolvedValue(expected);
      const result = await getAttendance(1, 10, "search", "PRESENT", "2026-07-06", 2, [1, 2]);
      expect(result).toBe(expected);
      expect(attendanceModel.getAttendance).toHaveBeenCalledWith(1, 10, "search", "PRESENT", "2026-07-06", 2, [1, 2]);
    });
  });

  describe("getByEmployee", () => {
    it("delegates to attendanceModel.getByEmployee", async () => {
      const expected = [{ id: 1 }];
      attendanceModel.getByEmployee.mockResolvedValue(expected);
      const result = await getByEmployee(1, "2026-07-06");
      expect(result).toBe(expected);
      expect(attendanceModel.getByEmployee).toHaveBeenCalledWith(1, "2026-07-06");
    });

    it("defaults date to empty string", async () => {
      attendanceModel.getByEmployee.mockResolvedValue([]);
      await getByEmployee(1);
      expect(attendanceModel.getByEmployee).toHaveBeenCalledWith(1, "");
    });
  });

  describe("getRules", () => {
    it("delegates to rulesModel.getRules", async () => {
      const expected = { grace_period: 15 };
      attendanceModel.getRules.mockResolvedValue(expected);
      const result = await getRules();
      expect(result).toBe(expected);
    });
  });

  describe("updateRules", () => {
    it("delegates to rulesModel.updateRules", async () => {
      const data = { grace_period: 10 };
      attendanceModel.updateRules.mockResolvedValue(data);
      const result = await updateRules(data);
      expect(result).toBe(data);
      expect(attendanceModel.updateRules).toHaveBeenCalledWith(data);
    });
  });

  describe("getAllRules", () => {
    it("delegates to rulesModel.getAllRules", async () => {
      const expected = [{ id: 1, name: "Rule 1" }];
      attendanceModel.getAllRules.mockResolvedValue(expected);
      const result = await getAllRules();
      expect(result).toBe(expected);
    });
  });

  // ============== createRule ==============

  describe("createRule", () => {
    it("creates a rule with valid data", async () => {
      const data = { name: "Test Rule", grace_period: 15 };
      attendanceModel.createRule.mockResolvedValue({ id: 1, ...data });
      const result = await createRule(data);
      expect(result).toEqual({ id: 1, ...data });
      expect(attendanceModel.createRule).toHaveBeenCalledWith(data);
    });

    it("throws when late_threshold is negative", async () => {
      await expect(createRule({ late_threshold: -1 })).rejects.toThrow("late_threshold must be 0 or greater");
    });

    it("throws when grace_period is negative", async () => {
      await expect(createRule({ grace_period: -1 })).rejects.toThrow("grace_period must be 0 or greater");
    });

    it("throws when max_work_hours is <= 0", async () => {
      await expect(createRule({ max_work_hours: 0 })).rejects.toThrow("max_work_hours must be greater than 0");
      await expect(createRule({ max_work_hours: -1 })).rejects.toThrow("max_work_hours must be greater than 0");
    });

    it("throws when late_deduction_value is <= 0", async () => {
      await expect(createRule({ late_deduction_value: 0 })).rejects.toThrow("late_deduction_value must be greater than 0");
      await expect(createRule({ late_deduction_value: -1 })).rejects.toThrow("late_deduction_value must be greater than 0");
    });

    it("throws when late_deduction_type is invalid", async () => {
      await expect(createRule({ late_deduction_type: "INVALID" })).rejects.toThrow("late_deduction_type must be FIXED or PER_MINUTE");
    });

    it("accepts valid late_deduction_type values", async () => {
      attendanceModel.createRule.mockResolvedValue({ id: 1 });
      await expect(createRule({ late_deduction_type: "FIXED" })).resolves.toBeDefined();
      await expect(createRule({ late_deduction_type: "PER_MINUTE" })).resolves.toBeDefined();
    });

    it("allows zero as valid late_threshold and grace_period", async () => {
      attendanceModel.createRule.mockResolvedValue({ id: 1 });
      await expect(createRule({ late_threshold: 0, grace_period: 0 })).resolves.toBeDefined();
    });
  });

  // ============== setActiveRule ==============

  describe("setActiveRule", () => {
    it("delegates to rulesModel.setActiveRule", async () => {
      attendanceModel.setActiveRule.mockResolvedValue({ id: 1, is_active: true });
      const result = await setActiveRule(1);
      expect(result).toEqual({ id: 1, is_active: true });
      expect(attendanceModel.setActiveRule).toHaveBeenCalledWith(1);
    });
  });

  // ============== deleteRule ==============

  describe("deleteRule", () => {
    it("throws 404 when rule not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await expect(deleteRule(999)).rejects.toMatchObject({
        message: "Attendance rule not found",
        statusCode: 404,
      });
    });

    it("throws 409 when rule is active", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, is_active: true }] });
      await expect(deleteRule(1)).rejects.toMatchObject({
        message: expect.stringContaining("active attendance rule"),
        statusCode: 409,
      });
    });

    it("deletes rule when not active and returns model result", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1, is_active: false }] });
      attendanceModel.deleteRule.mockResolvedValue({ id: 1 });
      const result = await deleteRule(1);
      expect(result).toEqual({ id: 1 });
      expect(attendanceModel.deleteRule).toHaveBeenCalledWith(1);
    });
  });

  // ============== updateRule ==============

  describe("updateRule", () => {
    it("updates a rule with valid data", async () => {
      const data = { grace_period: 20 };
      attendanceModel.updateRule.mockResolvedValue({ id: 1, ...data });
      const result = await updateRule(1, data);
      expect(result).toEqual({ id: 1, ...data });
      expect(attendanceModel.updateRule).toHaveBeenCalledWith(1, data);
    });

    it("throws when late_threshold is negative", async () => {
      await expect(updateRule(1, { late_threshold: -5 })).rejects.toThrow("late_threshold must be 0 or greater");
    });

    it("throws when grace_period is negative", async () => {
      await expect(updateRule(1, { grace_period: -1 })).rejects.toThrow("grace_period must be 0 or greater");
    });

    it("throws when max_work_hours is <= 0", async () => {
      await expect(updateRule(1, { max_work_hours: 0 })).rejects.toThrow("max_work_hours must be greater than 0");
    });

    it("throws when late_deduction_value is <= 0", async () => {
      await expect(updateRule(1, { late_deduction_value: 0 })).rejects.toThrow("late_deduction_value must be greater than 0");
    });

    it("throws when late_deduction_type is invalid", async () => {
      await expect(updateRule(1, { late_deduction_type: "FOO" })).rejects.toThrow("late_deduction_type must be FIXED or PER_MINUTE");
    });

    it("passes through data with no validation-triggering fields", async () => {
      attendanceModel.updateRule.mockResolvedValue({ id: 1 });
      await expect(updateRule(1, { name: "Renamed" })).resolves.toBeDefined();
      expect(attendanceModel.updateRule).toHaveBeenCalledWith(1, { name: "Renamed" });
    });
  });

  // ============== createAttendance ==============

  describe("createAttendance", () => {
    const baseInput = { employee_id: 1, timestamp: "2026-07-06T08:00:00", source: "BIOMETRIC", device_id: null };
    const checkoutInput = { employee_id: 1, timestamp: "2026-07-06T17:00:00", source: "BIOMETRIC", device_id: null };
    const lateCheckoutInput = { employee_id: 1, timestamp: "2026-07-06T17:30:00", source: "BIOMETRIC", device_id: null };

    beforeEach(() => {
      resolveEmployeeTimezone.mockResolvedValue("Asia/Manila");
      getLocalDate.mockReturnValue("2026-07-06");
      resolveBranchId.mockResolvedValue(2);
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5,
        start_time: "08:00",
        grace_minutes: 15,
        is_night_shift: false,
        is_flexitime: false,
      });
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.getRules.mockResolvedValue({ grace_period: 15, late_threshold: 30 });
    });

    // --- Check-in flow ---

    it("creates check-in when no existing record", async () => {
      attendanceModel.checkIn.mockResolvedValue({ id: 100, employee_id: 1, status: STATUS.PRESENT });

      const result = await createAttendance(baseInput);

      expect(resolveEmployeeTimezone).toHaveBeenCalledWith(1, null);
      expect(getLocalDate).toHaveBeenCalledWith(baseInput.timestamp, "Asia/Manila");
      expect(resolveBranchId).toHaveBeenCalledWith(1);
      expect(rotationService.resolveEmployeeShift).toHaveBeenCalledWith(1, "2026-07-06");
      expect(attendanceModel.getTodayRecord).toHaveBeenCalledWith(1, baseInput.timestamp, "Asia/Manila");
      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        1, baseInput.timestamp, STATUS.PRESENT, 5, "2026-07-06", "BIOMETRIC", 2, "Asia/Manila", null,
      );
      expect(result).toEqual({ id: 100, employee_id: 1, status: STATUS.PRESENT });
    });

    it("uses resolveDeviceBranchId when device_id is provided", async () => {
      const input = { ...baseInput, device_id: 10 };
      resolveDeviceBranchId.mockResolvedValue(3);
      attendanceModel.checkIn.mockResolvedValue({ id: 101 });

      await createAttendance(input);

      expect(resolveDeviceBranchId).toHaveBeenCalledWith(10);
      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), expect.any(String), expect.any(String),
        expect.any(Number), expect.any(String), expect.any(String),
        3, expect.any(String), 10,
      );
    });

    it("falls back to resolveBranchId when device_id does not resolve a branch", async () => {
      const input = { ...baseInput, device_id: 99 };
      resolveDeviceBranchId.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 102 });

      await createAttendance(input);

      expect(resolveDeviceBranchId).toHaveBeenCalledWith(99);
      expect(resolveBranchId).toHaveBeenCalledWith(1);
    });

    // --- Check-out flow ---

    it("creates check-out when check_in exists but no check_out", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50,
        check_in_time: "2026-07-06T08:00:00",
        check_out_time: null,
        branch_id: null,
        timezone_used: null,
      });
      attendanceModel.checkOut.mockResolvedValue({ id: 50, check_out_time: "2026-07-06T17:00:00" });

      const result = await createAttendance(checkoutInput);

      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, checkoutInput.timestamp, 2, "Asia/Manila");
      expect(result).toEqual({ id: 50, check_out_time: "2026-07-06T17:00:00" });
    });

    it("uses branch_id and timezone_used from the record for checkout if present", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50,
        check_in_time: "2026-07-06T08:00:00",
        check_out_time: null,
        branch_id: 99,
        timezone_used: "America/New_York",
      });
      attendanceModel.checkOut.mockResolvedValue({ id: 50 });

      await createAttendance(checkoutInput);

      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, checkoutInput.timestamp, 99, "America/New_York");
    });

    // --- Duplicate scan ---

    it("returns duplicate scan ignored when check_in is within 2 minutes", async () => {
      const recentTimestamp = "2026-07-06T08:01:30";
      const input = { ...baseInput, timestamp: recentTimestamp };
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: null,
      });

      const result = await createAttendance(input);

      expect(result).toEqual({ message: "Duplicate scan ignored" });
    });

    it("returns duplicate scan ignored when last check_out is within 2 minutes", async () => {
      const recentTimestamp = "2026-07-06T17:01:30";
      const input = { employee_id: 1, timestamp: recentTimestamp, source: "BIOMETRIC", device_id: null };
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: "2026-07-06T17:00:00",
      });

      const result = await createAttendance(input);

      expect(result).toEqual({ message: "Duplicate scan ignored" });
    });

    // --- Night shift ---

    it("uses getOpenAttendanceRecord for night shifts", async () => {
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 6, start_time: "22:00", grace_minutes: 15,
        is_night_shift: true, is_flexitime: false,
      });
      attendanceModel.getOpenAttendanceRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 300 });

      await createAttendance(baseInput);

      expect(attendanceModel.getOpenAttendanceRecord).toHaveBeenCalledWith(1);
      expect(attendanceModel.getTodayRecord).not.toHaveBeenCalled();
    });

    it("uses getOpenAttendanceRecord for checkout on night shift", async () => {
      const nightCheckoutInput = { employee_id: 1, timestamp: "2026-07-07T06:00:00", source: "BIOMETRIC", device_id: null };
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 6, start_time: "22:00", grace_minutes: 15,
        is_night_shift: true, is_flexitime: false,
      });
      attendanceModel.getOpenAttendanceRecord.mockResolvedValue({
        id: 60, check_in_time: "2026-07-06T22:00:00", check_out_time: null, branch_id: null, timezone_used: null,
      });
      attendanceModel.checkOut.mockResolvedValue({ id: 60 });

      await createAttendance(nightCheckoutInput);

      expect(attendanceModel.getOpenAttendanceRecord).toHaveBeenCalledWith(1);
      expect(attendanceModel.getTodayRecord).not.toHaveBeenCalled();
      expect(attendanceModel.checkOut).toHaveBeenCalled();
    });

    // --- Late detection ---

    it("marks as LATE when scan exceeds shift.grace_minutes", async () => {
      const lateTimestamp = "2026-07-06T08:30:00";
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5, start_time: "08:00", grace_minutes: 15,
        is_night_shift: false, is_flexitime: false,
      });
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 400 });

      await createAttendance({ ...baseInput, timestamp: lateTimestamp });

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), lateTimestamp, STATUS.LATE, expect.any(Number),
        expect.any(String), expect.any(String), expect.any(Number),
        expect.any(String), null,
      );
    });

    it("marks as PRESENT when within grace period", async () => {
      const onTimeTimestamp = "2026-07-06T08:05:00";
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5, start_time: "08:00", grace_minutes: 15,
        is_night_shift: false, is_flexitime: false,
      });
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 401 });

      await createAttendance({ ...baseInput, timestamp: onTimeTimestamp });

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), onTimeTimestamp, STATUS.PRESENT, expect.any(Number),
        expect.any(String), expect.any(String), expect.any(Number),
        expect.any(String), null,
      );
    });

    it("marks as LATE using rules.grace_period when no shift is assigned", async () => {
      const lateTimestamp = "2026-07-06T08:30:00";
      rotationService.resolveEmployeeShift.mockResolvedValue(null);
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.getRules.mockResolvedValue({ grace_period: 15, late_threshold: 30 });
      attendanceModel.checkIn.mockResolvedValue({ id: 402 });

      await createAttendance({ ...baseInput, timestamp: lateTimestamp });

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), lateTimestamp, STATUS.LATE, null,
        expect.any(String), expect.any(String), expect.any(Number),
        expect.any(String), null,
      );
    });

    it("marks LATE based on rules.late_threshold when grace_period is 0 and no shift", async () => {
      const lateTimestamp = "2026-07-06T08:20:00";
      rotationService.resolveEmployeeShift.mockResolvedValue(null);
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.getRules.mockResolvedValue({ grace_period: 0, late_threshold: 15 });
      attendanceModel.checkIn.mockResolvedValue({ id: 403 });

      await createAttendance({ ...baseInput, timestamp: lateTimestamp });

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), lateTimestamp, STATUS.LATE, null,
        expect.any(String), expect.any(String), expect.any(Number),
        expect.any(String), null,
      );
    });

    it("uses flex_end_window as reference time for flexitime", async () => {
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 7, start_time: "08:00", flex_end_window: "10:00", grace_minutes: 15,
        is_night_shift: false, is_flexitime: true,
      });
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 404 });

      const timestamp = "2026-07-06T10:15:00";
      await createAttendance({ ...baseInput, timestamp });

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), timestamp, STATUS.PRESENT, 7,
        expect.any(String), expect.any(String), expect.any(Number),
        expect.any(String), null,
      );
    });

    // --- Completed attendance / edge cases ---

    it("returns already completed when both check_in and check_out exist", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: "2026-07-06T17:00:00",
      });

      const result = await createAttendance(lateCheckoutInput);

      expect(result).toEqual({
        message: "Already completed attendance",
        data: { id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: "2026-07-06T17:00:00" },
      });
    });

    it("returns already completed when both check_in and check_out are null", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: null, check_out_time: null,
      });

      const result = await createAttendance(lateCheckoutInput);

      expect(result).toEqual({
        message: "Already completed attendance",
        data: { id: 50, check_in_time: null, check_out_time: null },
      });
    });

    it("returns anomaly when check_out exists without check_in", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: null, check_out_time: "2026-07-06T17:00:00",
      });

      const result = await createAttendance(lateCheckoutInput);

      expect(result).toEqual({
        message: "Check-out exists without check-in (needs review)",
        anomaly: true,
        data: { id: 50, check_in_time: null, check_out_time: "2026-07-06T17:00:00" },
      });
    });

    it("defaults to PRESENT when rules is null", async () => {
      attendanceModel.getRules.mockResolvedValue(null);
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 405 });

      const result = await createAttendance(baseInput);

      expect(result).toEqual({ id: 405 });
      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), expect.any(String), STATUS.PRESENT,
        expect.any(Number), expect.any(String), expect.any(String),
        expect.any(Number), expect.any(String), null,
      );
    });

    it("logs the service input", async () => {
      const logger = require("../utils/logger");
      attendanceModel.checkIn.mockResolvedValue({ id: 500 });

      await createAttendance(baseInput);

      expect(logger.info).toHaveBeenCalledWith(
        { employee_id: 1, timestamp: "2026-07-06T08:00:00", source: "BIOMETRIC", device_id: null },
        "SERVICE INPUT",
      );
    });
  });

  // ============== webClockIn ==============

  describe("webClockIn", () => {
    beforeEach(() => {
      resolveEmployeeTimezone.mockResolvedValue("Asia/Manila");
      getLocalDate.mockReturnValue("2026-07-06");
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5, start_time: "08:00", grace_minutes: 15,
        is_night_shift: false, is_flexitime: false,
      });
      resolveBranchId.mockResolvedValue(2);
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.getRules.mockResolvedValue({ grace_period: 15 });
      attendanceModel.checkIn.mockResolvedValue({ id: 100, status: STATUS.PRESENT });
    });

    it("creates check-in when no existing record", async () => {
      const result = await webClockIn(1, "2026-07-06T08:00:00");

      expect(resolveEmployeeTimezone).toHaveBeenCalledWith(1);
      expect(getLocalDate).toHaveBeenCalledWith("2026-07-06T08:00:00", "Asia/Manila");
      expect(rotationService.resolveEmployeeShift).toHaveBeenCalledWith(1, "2026-07-06");
      expect(attendanceModel.getTodayRecord).toHaveBeenCalledWith(1, "2026-07-06T08:00:00", "Asia/Manila");
      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        1, "2026-07-06T08:00:00", STATUS.PRESENT, 5, "2026-07-06",
        "WEB", 2, "Asia/Manila", null,
      );
      expect(result).toEqual({ id: 100, status: STATUS.PRESENT });
    });

    it("throws 409 when already clocked in", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: null,
      });

      await expect(webClockIn(1, "2026-07-06T09:00:00")).rejects.toMatchObject({
        message: "Already clocked in",
        status: 409,
      });
    });

    it("throws 409 when check-out exists without check-in (anomaly)", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: null, check_out_time: "2026-07-06T17:00:00",
      });

      await expect(webClockIn(1, "2026-07-06T09:00:00")).rejects.toMatchObject({
        message: "Check-out exists without check-in (needs review)",
        status: 409,
      });
    });

    it("uses getOpenAttendanceRecord for night shifts", async () => {
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 6, start_time: "22:00", grace_minutes: 15,
        is_night_shift: true, is_flexitime: false,
      });
      attendanceModel.getOpenAttendanceRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 200 });

      await webClockIn(1, "2026-07-06T22:00:00");

      expect(attendanceModel.getOpenAttendanceRecord).toHaveBeenCalledWith(1);
      expect(attendanceModel.getTodayRecord).not.toHaveBeenCalled();
    });

    it("determines LATE status like createAttendance", async () => {
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5, start_time: "08:00", grace_minutes: 15,
        is_night_shift: false, is_flexitime: false,
      });
      attendanceModel.getTodayRecord.mockResolvedValue(null);
      attendanceModel.checkIn.mockResolvedValue({ id: 201 });

      await webClockIn(1, "2026-07-06T08:30:00");

      expect(attendanceModel.checkIn).toHaveBeenCalledWith(
        expect.any(Number), "2026-07-06T08:30:00", STATUS.LATE,
        expect.any(Number), expect.any(String), "WEB",
        expect.any(Number), expect.any(String), null,
      );
    });
  });

  // ============== webClockOut ==============

  describe("webClockOut", () => {
    const baseRecord = {
      id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: null,
      branch_id: null, timezone_used: null,
    };

    beforeEach(() => {
      resolveEmployeeTimezone.mockResolvedValue("Asia/Manila");
      getLocalDate.mockReturnValue("2026-07-06");
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 5, is_night_shift: false,
      });
      resolveBranchId.mockResolvedValue(2);
      attendanceModel.getTodayRecord.mockResolvedValue(baseRecord);
      attendanceModel.checkOut.mockResolvedValue({ id: 50, check_out_time: "2026-07-06T17:00:00" });
    });

    it("creates check-out when check_in exists", async () => {
      const result = await webClockOut(1, "2026-07-06T17:00:00");

      expect(resolveEmployeeTimezone).toHaveBeenCalledWith(1);
      expect(attendanceModel.getTodayRecord).toHaveBeenCalledWith(1, "2026-07-06T17:00:00", "Asia/Manila");
      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, "2026-07-06T17:00:00", 2, "Asia/Manila");
      expect(result).toEqual({ id: 50, check_out_time: "2026-07-06T17:00:00" });
    });

    it("uses branch_id and timezone_used from the record if present", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        ...baseRecord, branch_id: 99, timezone_used: "America/New_York",
      });

      await webClockOut(1, "2026-07-06T17:00:00");

      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, "2026-07-06T17:00:00", 99, "America/New_York");
    });

    it("throws 400 when no record exists", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue(null);

      await expect(webClockOut(1, "2026-07-06T17:00:00")).rejects.toMatchObject({
        message: "Must clock in first",
        status: 400,
      });
    });

    it("throws 400 when check_in_time is missing", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: null, check_out_time: null,
      });

      await expect(webClockOut(1, "2026-07-06T17:00:00")).rejects.toMatchObject({
        message: "Must clock in first",
        status: 400,
      });
    });

    it("throws 409 when already clocked out", async () => {
      attendanceModel.getTodayRecord.mockResolvedValue({
        id: 50, check_in_time: "2026-07-06T08:00:00", check_out_time: "2026-07-06T17:00:00",
      });

      await expect(webClockOut(1, "2026-07-06T18:00:00")).rejects.toMatchObject({
        message: "Already clocked out",
        status: 409,
      });
    });

    it("uses getOpenAttendanceRecord for night shifts", async () => {
      rotationService.resolveEmployeeShift.mockResolvedValue({
        id: 6, is_night_shift: true,
      });
      attendanceModel.getOpenAttendanceRecord.mockResolvedValue(baseRecord);

      await webClockOut(1, "2026-07-07T06:00:00");

      expect(attendanceModel.getOpenAttendanceRecord).toHaveBeenCalledWith(1);
      expect(attendanceModel.getTodayRecord).not.toHaveBeenCalled();
    });

    it("falls back to resolveBranchId when record has no branch_id", async () => {
      resolveBranchId.mockResolvedValue(7);

      await webClockOut(1, "2026-07-06T17:00:00");

      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, "2026-07-06T17:00:00", 7, expect.any(String));
    });

    it("falls back to initial timezone when record has no timezone_used", async () => {
      resolveEmployeeTimezone.mockResolvedValue("America/Chicago");

      await webClockOut(1, "2026-07-06T17:00:00");

      expect(attendanceModel.checkOut).toHaveBeenCalledWith(50, "2026-07-06T17:00:00", expect.any(Number), "America/Chicago");
    });
  });
});
