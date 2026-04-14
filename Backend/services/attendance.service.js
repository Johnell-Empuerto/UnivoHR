const attendanceModel = require("../models/attendance.model");
const rulesModel = require("../models/attendance.model");
const STATUS = require("../constants/status");

//check duplication
const isDuplicateScan = (lastTime, currentTime, minutes = 2) => {
  const diff = (new Date(currentTime) - new Date(lastTime)) / 1000 / 60;
  return diff < minutes;
};

// Core logic: check-in / check-out
const createAttendance = async ({ employee_id, timestamp }) => {
  console.log("SERVICE INPUT:", { employee_id, timestamp });

  const todayRecord = await attendanceModel.getTodayRecord(
    employee_id,
    timestamp,
  );

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
    const shiftStart = new Date(timestamp);
    shiftStart.setHours(8, 0, 0);

    const lateMinutes = (new Date(timestamp) - shiftStart) / 1000 / 60;

    if (lateMinutes > rules.late_threshold) {
      status = STATUS.LATE;
    }
  }

  // CASE 1: No record → CHECK-IN
  if (!todayRecord) {
    return await attendanceModel.checkIn(employee_id, timestamp, status);
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
const getAttendance = async (page, limit, search, status, date) => {
  return await attendanceModel.getAttendance(page, limit, search, status, date);
};

// Get by employee
const getByEmployee = async (employeeId) => {
  return await attendanceModel.getByEmployee(employeeId);
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
