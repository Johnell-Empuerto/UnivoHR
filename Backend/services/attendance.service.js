const attendanceModel = require("../models/attendance.model");
const rulesModel = require("../models/attendance.model");
const shiftService = require("./shift.service");
const rotationService = require("./rotation.service");
const STATUS = require("../constants/status");
const { getLocalDate } = require("../utils/date");
const { resolveEmployeeTimezone, resolveBranchId, resolveDeviceBranchId } = require("../utils/timezone");

//check duplication
const isDuplicateScan = (lastTime, currentTime, minutes = 2) => {
  const diff = (new Date(currentTime) - new Date(lastTime)) / 1000 / 60;
  return diff < minutes;
};

// Core logic: check-in / check-out
const createAttendance = async ({ employee_id, timestamp, source = 'BIOMETRIC', device_id = null }) => {
  console.log("SERVICE INPUT:", { employee_id, timestamp, source, device_id });

  const localDate = getLocalDate(timestamp);

  // Resolve branch and timezone from device or employee
  let branchId = device_id ? await resolveDeviceBranchId(device_id) : null;
  if (!branchId) branchId = await resolveBranchId(employee_id);
  const timezone = await resolveEmployeeTimezone(employee_id, device_id);

  // Look up employee's assigned shift for today
  const shift = await rotationService.resolveEmployeeShift(employee_id, localDate);

  const isNightShift = shift && shift.is_night_shift;
  const isFlexitime = shift && shift.is_flexitime;

  let todayRecord;

  if (isNightShift) {
    todayRecord = await attendanceModel.getOpenAttendanceRecord(employee_id);
  } else {
    todayRecord = await attendanceModel.getTodayRecord(employee_id, timestamp);
  }

  console.log("TODAY RECORD:", todayRecord);

  const rules = await rulesModel.getRules();

  // DUPLICATE CHECK
  if (todayRecord) {
    const lastTime = todayRecord.check_out_time || todayRecord.check_in_time;

    if (lastTime) {
      const diff = (new Date(timestamp) - new Date(lastTime)) / 1000 / 60;

      if (diff < 2) {
        return { message: "Duplicate scan ignored" };
      }
    }
  }

  // LATE DETECTION
  let status = STATUS.PRESENT;

  if (rules) {
    const scanTime = new Date(timestamp);
    let referenceTime;

    if (shift) {
      const refTimeStr = isFlexitime && shift.flex_end_window
        ? shift.flex_end_window
        : shift.start_time;
      const [h, m] = refTimeStr.split(':').map(Number);
      referenceTime = new Date(timestamp);
      referenceTime.setHours(h, m, 0, 0);
    } else {
      referenceTime = new Date(timestamp);
      referenceTime.setHours(8, 0, 0, 0);
    }

    const lateMinutes = (scanTime - referenceTime) / 1000 / 60;

    let allowedLateMinutes;

    if (shift) {
      allowedLateMinutes = shift.grace_minutes ?? 0;
    } else {
      allowedLateMinutes = (rules.grace_period != null && rules.grace_period > 0)
        ? rules.grace_period
        : (rules.late_threshold ?? 0);
    }

    if (lateMinutes > allowedLateMinutes) {
      status = STATUS.LATE;
    }
  }

  // CASE 1: No record → CHECK-IN
  if (!todayRecord) {
    return await attendanceModel.checkIn(
      employee_id,
      timestamp,
      status,
      shift ? shift.id : null,
      localDate,
      source,
      branchId,
      timezone,
      device_id,
    );
  }

  // CASE 2: Has check-in only → CHECK-OUT
  if (todayRecord.check_in_time && !todayRecord.check_out_time) {
    const checkoutBranchId = todayRecord.branch_id || branchId;
    const checkoutTimezone = todayRecord.timezone_used || timezone;
    return await attendanceModel.checkOut(todayRecord.id, timestamp, checkoutBranchId, checkoutTimezone);
  }

  //  CASE 3: Has check-out only (no check-in)
  if (!todayRecord.check_in_time && todayRecord.check_out_time) {
    return {
      message: "Check-out exists without check-in (needs review)",
      anomaly: true,
      data: todayRecord,
    };
  }

  //  CASE 4: Both exist
  return {
    message: "Already completed attendance",
    data: todayRecord,
  };
};

// Get all
const getAttendance = async (page, limit, search, status, date, branch_id, allowedBranchIds) => {
  return await attendanceModel.getAttendance(page, limit, search, status, date, branch_id, allowedBranchIds);
};

// Get by employee
const getByEmployee = async (employeeId, date = "") => {
  return await attendanceModel.getByEmployee(employeeId, date);
};

// GET RULES
const getRules = async () => {
  return await rulesModel.getRules();
};

// UPDATE RULES
const updateRules = async (data) => {
  return await rulesModel.updateRules(data);
};

const getAllRules = async () => {
  return await rulesModel.getAllRules();
};

const createRule = async (data) => {
  return await rulesModel.createRule(data);
};

const setActiveRule = async (id) => {
  return await rulesModel.setActiveRule(id);
};

const deleteRule = async (id) => {
  return await rulesModel.deleteRule(id);
};

const updateRule = async (id, data) => {
  return await rulesModel.updateRule(id, data);
};

// Web clock-in: employee self-service check-in
// First valid scan wins — never overwrites existing check_in_time
const webClockIn = async (employeeId, timestamp) => {
  const localDate = getLocalDate(timestamp);

  const shift = await rotationService.resolveEmployeeShift(employeeId, localDate);
  const isNightShift = shift && shift.is_night_shift;

  let todayRecord;
  if (isNightShift) {
    todayRecord = await attendanceModel.getOpenAttendanceRecord(employeeId);
  } else {
    todayRecord = await attendanceModel.getTodayRecord(employeeId, timestamp);
  }

  // If attendance exists with check_in_time → reject (first valid scan wins)
  if (todayRecord && todayRecord.check_in_time) {
    const err = new Error("Already clocked in");
    err.status = 409;
    throw err;
  }

  // If attendance exists with check_out only → anomaly (should not happen for web)
  if (todayRecord && !todayRecord.check_in_time && todayRecord.check_out_time) {
    const err = new Error("Check-out exists without check-in (needs review)");
    err.status = 409;
    throw err;
  }

  // Determine late status
  const rules = await attendanceModel.getRules();
  let status = STATUS.PRESENT;

  if (rules) {
    const scanTime = new Date(timestamp);
    let referenceTime;

    if (shift) {
      const isFlexitime = shift.is_flexitime;
      const refTimeStr = isFlexitime && shift.flex_end_window
        ? shift.flex_end_window
        : shift.start_time;
      const [h, m] = refTimeStr.split(':').map(Number);
      referenceTime = new Date(timestamp);
      referenceTime.setHours(h, m, 0, 0);
    } else {
      referenceTime = new Date(timestamp);
      referenceTime.setHours(8, 0, 0, 0);
    }

    const lateMinutes = (scanTime - referenceTime) / 1000 / 60;
    let allowedLateMinutes;

    if (shift) {
      allowedLateMinutes = shift.grace_minutes ?? 0;
    } else {
      allowedLateMinutes = (rules.grace_period != null && rules.grace_period > 0)
        ? rules.grace_period
        : (rules.late_threshold ?? 0);
    }

    if (lateMinutes > allowedLateMinutes) {
      status = STATUS.LATE;
    }
  }

  const timezone = await resolveEmployeeTimezone(employeeId);
  const branchId = await resolveBranchId(employeeId);

  return await attendanceModel.checkIn(
    employeeId,
    timestamp,
    status,
    shift ? shift.id : null,
    localDate,
    "WEB",
    branchId,
    timezone,
    null,
  );
};

// Web clock-out: employee self-service check-out
// Latest valid scan wins — only overwrites if new timestamp is later
const webClockOut = async (employeeId, timestamp) => {
  const localDate = getLocalDate(timestamp);

  const shift = await rotationService.resolveEmployeeShift(employeeId, localDate);
  const isNightShift = shift && shift.is_night_shift;

  let todayRecord;
  if (isNightShift) {
    todayRecord = await attendanceModel.getOpenAttendanceRecord(employeeId);
  } else {
    todayRecord = await attendanceModel.getTodayRecord(employeeId, timestamp);
  }

  if (!todayRecord) {
    const err = new Error("Must clock in first");
    err.status = 400;
    throw err;
  }

  if (!todayRecord.check_in_time) {
    const err = new Error("Must clock in first");
    err.status = 400;
    throw err;
  }

  if (todayRecord.check_out_time) {
    const err = new Error("Already clocked out");
    err.status = 409;
    throw err;
  }

  const branchId = todayRecord.branch_id || await resolveBranchId(employeeId);
  const timezone = todayRecord.timezone_used || await resolveEmployeeTimezone(employeeId);

  return await attendanceModel.checkOut(todayRecord.id, timestamp, branchId, timezone);
};

module.exports = {
  createAttendance,
  getAttendance,
  getByEmployee,
  isDuplicateScan,
  getRules,
  updateRules,
  getAllRules,
  createRule,
  setActiveRule,
  deleteRule,
  updateRule,
  webClockIn,
  webClockOut,
};
