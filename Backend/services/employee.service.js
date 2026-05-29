const employeeModel = require("../models/employee.model");
const pool = require("../config/db");

const getEmployees = async (page, limit, search, status, allowedBranchIds) => {
  return await employeeModel.getEmployees(page, limit, search, status, allowedBranchIds);
};

const createEmployee = async (data) => {
  return await employeeModel.createEmployee(data);
};

const updateEmployee = async (id, data) => {
  const currentEmployee = await employeeModel.getEmployeeById(id);

  const isBranchChanging =
    data.branch_id !== undefined &&
    data.branch_id !== null &&
    currentEmployee &&
    Number(currentEmployee.branch_id) !== Number(data.branch_id);

  if (!isBranchChanging) {
    return await employeeModel.updateEmployee(id, data);
  }

  const newBranchId = Number(data.branch_id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await employeeModel.updateEmployee(id, data, client);

    const userResult = await client.query(
      `SELECT id, role FROM users WHERE employee_id = $1`,
      [id],
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      if (user.role === "HR_USER") {
        const existing = await client.query(
          `SELECT id FROM user_branch_access WHERE user_id = $1 AND branch_id = $2`,
          [user.id, currentEmployee.branch_id],
        );

        if (existing.rows.length > 0) {
          await client.query(
            `UPDATE user_branch_access SET branch_id = $1 WHERE user_id = $2 AND branch_id = $3`,
            [newBranchId, user.id, currentEmployee.branch_id],
          );
        } else {
          await client.query(
            `INSERT INTO user_branch_access (user_id, branch_id) VALUES ($1, $2)`,
            [user.id, newBranchId],
          );
        }
      }
    }

    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
};
