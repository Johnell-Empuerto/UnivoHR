const attendanceModel = require("../models/attendance.model");
const rulesModel = require("../models/attendance.model");
const shiftService = require("./shift.service");
const rotationService = require("./rotation.service");
const STATUS = require("../constants/status");
const { getLocalDate } = require("../utils/date");

//check duplication
const isDuplicateScan = (lastTime, currentTime, minutes = 2) => {
  const diff = (new Date(currentTime) - new Date(lastTime)) / 1000 / 60;
  return diff < minutes;
};

// Core logic: check-in / check-out
const createAttendance = async ({ employee_id, timestamp }) => {
  console.log("SERVICE INPUT:", { employee_id, timestamp });

  const localDate = getLocalDate(timestamp);

  // Look up employee's assigned shift for today
  const shift = await rotationService.resolveEmployeeShift(employee_id, localDate);

  const isNightShift = shift && shift.is_night_shift;
  const isFlexitime = shift && shift.is_flexitime;

  let todayRecord;

  if (isNightShift) {
    // Night shift: find open record (check-in without check-out) for checkout
    todayRecord = await attendanceModel.getOpenAttendanceRecord(employee_id);
  } else {
    // Regular shifts & fallback: look up by calendar date
    todayRecord = await attendanceModel.getTodayRecord(employee_id, timestamp);
  }

  console.log("TODAY RECORD:", todayRecord);

  const rules = await rulesModel.getRules();

  // DUPLICATE CHECK (use last scan, not only check-in)
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
      // No shift assigned: fallback to 8AM
      referenceTime = new Date(timestamp);
      referenceTime.setHours(8, 0, 0, 0);
    }

    const lateMinutes = (scanTime - referenceTime) / 1000 / 60;

    // Priority 1: Assigned Shift Grace
    // Priority 2: Attendance Rule Grace Period
    // Priority 3: Attendance Rule Late Threshold
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
    );
  }

  // CASE 2: Has check-in only → CHECK-OUT
  if (todayRecord.check_in_time && !todayRecord.check_out_time) {
    return await attendanceModel.checkOut(todayRecord.id, timestamp);
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
};
