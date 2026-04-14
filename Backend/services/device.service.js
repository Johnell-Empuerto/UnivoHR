const rawLogsModel = require("../models/rawLogs.model");
const attendanceService = require("./attendance.service");
const pool = require("../config/db");
const { getIO } = require("../config/socket");

const processLogs = async (data) => {
  const { employee_code, timestamp, device_id } = data;

  // Save raw log
  await rawLogsModel.insertLog(data);

  // Find employee
  const empResult = await pool.query(
    "SELECT id FROM employees WHERE employee_code = $1",
    [employee_code],
  );

  const employee = empResult.rows[0];

  if (!employee) throw new Error("Employee not found");

  // Process attendance
  const attendance = await attendanceService.createAttendance({
    employee_id: employee.id,
    timestamp, //IMPORTANT
  });

  // EMIT AFTER PROCESSING
  const io = getIO();

  io.emit("attendance-update", {
    employee_id: employee.id,
    timestamp,
    attendance,
  });

  return {
    message: "Log processed",
    attendance,
  };
};

module.exports = { processLogs };
