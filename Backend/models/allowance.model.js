const pool = require("../config/db");

const getAllowanceTypes = async () => {
  const result = await pool.query("SELECT * FROM allowance_types ORDER BY name");
  return result.rows;
};

const createAllowanceType = async (name, description, default_amount, is_taxable, is_recurring, frequency) => {
  const result = await pool.query(
    `INSERT INTO allowance_types (name, description, default_amount, is_taxable, is_recurring, frequency)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, description, default_amount, is_taxable, is_recurring, frequency]
  );
  return result.rows[0];
};

const updateAllowanceType = async (id, fields) => {
  const sets = [];
  const params = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${idx}`);
    params.push(value);
    idx++;
  }
  params.push(id);
  const result = await pool.query(
    `UPDATE allowance_types SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0];
};

const deleteAllowanceType = async (id) => {
  await pool.query("DELETE FROM allowance_types WHERE id = $1", [id]);
};

const getEmployeeAllowances = async (employeeId) => {
  const result = await pool.query(
    `SELECT ea.*, at.name as allowance_name, at.is_taxable, at.frequency
     FROM employee_allowances ea
     JOIN allowance_types at ON at.id = ea.allowance_type_id
     WHERE ea.employee_id = $1
     ORDER BY at.name`,
    [employeeId]
  );
  return result.rows;
};

const createEmployeeAllowance = async (employeeId, allowanceTypeId, amount, effectiveDate, endDate) => {
  const result = await pool.query(
    `INSERT INTO employee_allowances (employee_id, allowance_type_id, amount, effective_date, end_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [employeeId, allowanceTypeId, amount, effectiveDate, endDate]
  );
  return result.rows[0];
};

const updateEmployeeAllowance = async (id, amount, endDate) => {
  const result = await pool.query(
    `UPDATE employee_allowances SET amount = $1, end_date = $2 WHERE id = $3 RETURNING *`,
    [amount, endDate, id]
  );
  return result.rows[0];
};

const deleteEmployeeAllowance = async (id) => {
  await pool.query("DELETE FROM employee_allowances WHERE id = $1", [id]);
};

const getEmployeeAllowancesTotal = async (employeeId, cutoffStart, cutoffEnd) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(ea.amount), 0) as total
     FROM employee_allowances ea
     JOIN allowance_types at ON at.id = ea.allowance_type_id
     WHERE ea.employee_id = $1
       AND (ea.effective_date IS NULL OR ea.effective_date <= $3::date)
       AND (ea.end_date IS NULL OR ea.end_date >= $2::date)`,
    [employeeId, cutoffStart, cutoffEnd]
  );
  return parseFloat(result.rows[0].total);
};

const bulkGetEmployeeAllowancesTotals = async (employeeIds, cutoffStart, cutoffEnd) => {
  if (employeeIds.length === 0) return new Map();
  const result = await pool.query(
    `SELECT ea.employee_id, COALESCE(SUM(ea.amount), 0) as total
     FROM employee_allowances ea
     JOIN allowance_types at ON at.id = ea.allowance_type_id
     WHERE ea.employee_id = ANY($1::int[])
       AND at.is_recurring = true
       AND (ea.effective_date IS NULL OR ea.effective_date <= $3::date)
       AND (ea.end_date IS NULL OR ea.end_date >= $2::date)
     GROUP BY ea.employee_id`,
    [employeeIds, cutoffStart, cutoffEnd]
  );
  const map = new Map();
  result.rows.forEach((row) => map.set(row.employee_id, parseFloat(row.total)));
  return map;
};

module.exports = {
  getAllowanceTypes,
  createAllowanceType,
  updateAllowanceType,
  deleteAllowanceType,
  getEmployeeAllowances,
  createEmployeeAllowance,
  updateEmployeeAllowance,
  deleteEmployeeAllowance,
  getEmployeeAllowancesTotal,
  bulkGetEmployeeAllowancesTotals,
};
