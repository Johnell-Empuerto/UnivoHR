const leaveCreditModel = require("../models/leaveCredit.model");
const pool = require("../config/db");

const initializeNewEmployee = async (employeeId, client) => {
  const db = client || pool;

  await db.query(
    `INSERT INTO employee_salary (employee_id, basic_salary, overtime_rate)
     VALUES ($1, 0, 1.25)
     ON CONFLICT (employee_id) DO NOTHING`,
    [employeeId]
  );

  await leaveCreditModel.createDefault(employeeId, db);

  return employeeId;
};

module.exports = { initializeNewEmployee };
