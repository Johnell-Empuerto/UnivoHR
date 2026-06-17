const pool = require("../config/db");

const getEmployeeBalances = async (employeeId, year) => {
  const y = year || new Date().getFullYear();
  const result = await pool.query(`
    SELECT
      elb.employee_id,
      elb.leave_type_id,
      lt.code,
      lt.name,
      lt.is_paid,
      lt.is_convertible,
      lt.max_convertible_days,
      lt.requires_balance,
      lt.is_unlimited,
      lt.include_in_credits,
      lt.affects_payroll,
      lt.deducts_salary,
      lt.sort_order,
      elb.year,
      elb.total_days,
      elb.used_days,
      elb.carried_over_days,
      elb.adjusted_days,
      (elb.total_days + elb.carried_over_days + elb.adjusted_days - elb.used_days) AS remaining_days
    FROM employee_leave_balances elb
    JOIN leave_types lt ON lt.id = elb.leave_type_id
    WHERE elb.employee_id = $1
      AND elb.year = $2
      AND lt.is_enabled = true
    ORDER BY lt.sort_order, lt.code
  `, [employeeId, y]);
  return result.rows;
};

const getEmployeeBalanceMap = async (employeeId, year) => {
  const rows = await getEmployeeBalances(employeeId, year);
  const map = new Map();
  for (const row of rows) {
    map.set(row.code, row);
  }
  return map;
};

const getEmployeesBalances = async (employeeIds, year) => {
  if (!employeeIds || employeeIds.length === 0) return new Map();
  const y = year || new Date().getFullYear();
  const result = await pool.query(`
    SELECT
      elb.employee_id,
      elb.leave_type_id,
      lt.code,
      lt.name,
      lt.is_paid,
      lt.is_convertible,
      lt.max_convertible_days,
      lt.requires_balance,
      lt.is_unlimited,
      lt.include_in_credits,
      lt.affects_payroll,
      lt.deducts_salary,
      lt.sort_order,
      elb.year,
      elb.total_days,
      elb.used_days,
      elb.carried_over_days,
      elb.adjusted_days,
      (elb.total_days + elb.carried_over_days + elb.adjusted_days - elb.used_days) AS remaining_days
    FROM employee_leave_balances elb
    JOIN leave_types lt ON lt.id = elb.leave_type_id
    WHERE elb.employee_id = ANY($1::int[])
      AND elb.year = $2
      AND lt.is_enabled = true
    ORDER BY lt.sort_order, lt.code
  `, [employeeIds, y]);

  const map = new Map();
  for (const row of result.rows) {
    if (!map.has(row.employee_id)) map.set(row.employee_id, []);
    map.get(row.employee_id).push(row);
  }
  return map;
};

const getPayrollRelevantTypes = async () => {
  const result = await pool.query(`
    SELECT code, name, is_paid, affects_payroll, deducts_salary
    FROM leave_types
    WHERE is_enabled = true
    ORDER BY sort_order, code
  `);
  return result.rows;
};

const getConvertibleBalances = async (employeeId, year) => {
  const rows = await getEmployeeBalances(employeeId, year);
  return rows.filter((r) => r.is_convertible === true);
};

const getLeaveTypeByCode = async (code) => {
  const result = await pool.query(`
    SELECT * FROM leave_types WHERE code = $1
  `, [code]);
  return result.rows[0] || null;
};

module.exports = {
  getEmployeeBalances,
  getEmployeeBalanceMap,
  getEmployeesBalances,
  getPayrollRelevantTypes,
  getConvertibleBalances,
  getLeaveTypeByCode,
};
