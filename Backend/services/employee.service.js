const employeeModel = require("../models/employee.model");
const pool = require("../config/db");
const { generateEmployeeCode } = require("./applicant.service");
const { initializeNewEmployee } = require("./employeeInit.service");
const notificationHelper = require("./notificationHelper.service");
const { EMPLOYMENT_STATUS, COMPANY_DEFAULT_PROBATION_MONTHS } = require("../constants/employmentStatus");

const getEmployees = async (page, limit, search, status, allowedBranchIds, department, position) => {
  return await employeeModel.getEmployees(page, limit, search, status, allowedBranchIds, department, position);
};

const getFilterOptions = async () => {
  const [departments, positions] = await Promise.all([
    employeeModel.getDepartments(),
    employeeModel.getPositions(),
  ]);
  return { departments, positions };
};

const createEmployee = async (data) => {
  let generatedCode = null;
  if (!data.employee_code?.trim()) {
    const gen = await generateEmployeeCode();
    data.employee_code = gen.code;
    generatedCode = gen.number;
  }

  const employmentStatus = data.employment_status?.toUpperCase() || EMPLOYMENT_STATUS.REGULAR;

  if (employmentStatus === EMPLOYMENT_STATUS.REGULAR) {
    data.probation_period_months = null;
    data.regularization_date = null;
  } else if (employmentStatus === EMPLOYMENT_STATUS.PROBATIONARY) {
    const probationMonths = data.probation_period_months != null
      ? Number(data.probation_period_months)
      : COMPANY_DEFAULT_PROBATION_MONTHS;

    if (probationMonths <= 0) {
      throw new Error("Probation period must be greater than 0 months for PROBATIONARY employees");
    }

    data.probation_period_months = probationMonths;

    if (data.hired_date && !data.regularization_date) {
      const hireDate = new Date(data.hired_date);
      hireDate.setMonth(hireDate.getMonth() + probationMonths);
      data.regularization_date = hireDate.toISOString().split("T")[0];
    }
  }

  if (data.regularization_date && data.hired_date) {
    if (new Date(data.regularization_date) < new Date(data.hired_date)) {
      throw new Error("Regularization date cannot be before hire date");
    }
  }

  data.employment_status = employmentStatus;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await employeeModel.createEmployee(data, client);

    await initializeNewEmployee(result.id, client);

    await client.query("COMMIT");

    if (generatedCode !== null) {
      await pool.query(
        `UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = 'employee_code_counter'`,
        [String(generatedCode)],
      );
    }

    notificationHelper.notifyUsersWithPermission("employees.view", {
      type: "EMPLOYEE",
      title: "New Employee Created",
      message: `${result.first_name} ${result.last_name} (${result.employee_code}) has been added to the system.`,
      reference_id: result.id,
      meta: { employee_id: result.id },
    }).catch(err => console.error("[employee] Welcome notification error:", err.message));

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateEmployee = async (id, data) => {
  const currentEmployee = await employeeModel.getEmployeeById(id);

  if (data.employment_status) {
    const employmentStatus = data.employment_status.toUpperCase();

    if (employmentStatus === EMPLOYMENT_STATUS.REGULAR) {
      data.probation_period_months = null;
      data.regularization_date = null;
    } else if (employmentStatus === EMPLOYMENT_STATUS.PROBATIONARY) {
      if (data.probation_period_months != null && Number(data.probation_period_months) <= 0) {
        throw new Error("Probation period must be greater than 0 months for PROBATIONARY employees");
      }
    }

    data.employment_status = employmentStatus;
  }

  if (data.regularization_date && (data.hired_date || currentEmployee?.hired_date)) {
    const hireDate = data.hired_date || currentEmployee?.hired_date;
    if (new Date(data.regularization_date) < new Date(hireDate)) {
      throw new Error("Regularization date cannot be before hire date");
    }
  }

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
      if (user.role !== "ADMIN") {
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

const getProbationaryEmployeesDueForRegularization = async (allowedBranchIds) => {
  return await employeeModel.getProbationaryEmployeesDueForRegularization(allowedBranchIds);
};

const approveRegularization = async (id) => {
  const employee = await employeeModel.getEmployeeById(id);
  if (!employee) throw new Error("Employee not found");
  if (employee.employment_status !== EMPLOYMENT_STATUS.PROBATIONARY) {
    throw new Error("Employee is not on probationary status");
  }

  return await employeeModel.regularizeEmployee(id);
};

const getEmploymentStats = async (allowedBranchIds) => {
  return await employeeModel.getEmploymentStats(allowedBranchIds);
};

const searchEmployees = async (params) => {
  return await employeeModel.searchEmployees(params);
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  getProbationaryEmployeesDueForRegularization,
  approveRegularization,
  getEmploymentStats,
  getFilterOptions,
  searchEmployees,
};
