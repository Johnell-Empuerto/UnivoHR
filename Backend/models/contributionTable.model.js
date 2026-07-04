const pool = require("../config/db");

const getSssTable = async () => {
  const result = await pool.query("SELECT * FROM sss_contributions ORDER BY salary_from");
  return result.rows;
};

const createSssRow = async (salary_from, salary_to, employer_share, employee_share, total_contribution) => {
  const result = await pool.query(
    "INSERT INTO sss_contributions (salary_from, salary_to, employer_share, employee_share, total_contribution) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [salary_from, salary_to, employer_share, employee_share, total_contribution],
  );
  return result.rows[0];
};

const updateSssRow = async (id, fields) => {
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (["salary_from", "salary_to", "employer_share", "employee_share", "total_contribution"].includes(key)) {
      sets.push(`${key} = $${idx++}`);
      vals.push(value);
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const result = await pool.query(`UPDATE sss_contributions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
  return result.rows[0];
};

const deleteSssRow = async (id) => {
  const result = await pool.query("DELETE FROM sss_contributions WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

const getPhilHealthTable = async () => {
  const result = await pool.query("SELECT * FROM philhealth_contributions ORDER BY salary_from");
  return result.rows;
};

const createPhilHealthRow = async (salary_from, salary_to, employee_rate, employer_rate, monthly_premium) => {
  const result = await pool.query(
    "INSERT INTO philhealth_contributions (salary_from, salary_to, employee_rate, employer_rate, monthly_premium) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [salary_from, salary_to, employee_rate, employer_rate, monthly_premium],
  );
  return result.rows[0];
};

const updatePhilHealthRow = async (id, fields) => {
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (["salary_from", "salary_to", "employee_rate", "employer_rate", "monthly_premium"].includes(key)) {
      sets.push(`${key} = $${idx++}`);
      vals.push(value);
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const result = await pool.query(`UPDATE philhealth_contributions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
  return result.rows[0];
};

const deletePhilHealthRow = async (id) => {
  const result = await pool.query("DELETE FROM philhealth_contributions WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

const getPagIbigTable = async () => {
  const result = await pool.query("SELECT * FROM pagibig_contributions ORDER BY salary_from");
  return result.rows;
};

const createPagIbigRow = async (salary_from, salary_to, employee_share, employer_share) => {
  const result = await pool.query(
    "INSERT INTO pagibig_contributions (salary_from, salary_to, employee_share, employer_share) VALUES ($1,$2,$3,$4) RETURNING *",
    [salary_from, salary_to, employee_share, employer_share],
  );
  return result.rows[0];
};

const updatePagIbigRow = async (id, fields) => {
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (["salary_from", "salary_to", "employee_share", "employer_share"].includes(key)) {
      sets.push(`${key} = $${idx++}`);
      vals.push(value);
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const result = await pool.query(`UPDATE pagibig_contributions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
  return result.rows[0];
};

const deletePagIbigRow = async (id) => {
  const result = await pool.query("DELETE FROM pagibig_contributions WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

const getWithholdingTaxTable = async () => {
  const result = await pool.query("SELECT * FROM withholding_tax_brackets ORDER BY salary_from");
  return result.rows;
};

const createTaxRow = async (salary_from, salary_to, tax_base, percentage_over_base, exempt_amount) => {
  const result = await pool.query(
    "INSERT INTO withholding_tax_brackets (salary_from, salary_to, tax_base, percentage_over_base, exempt_amount) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [salary_from, salary_to, tax_base, percentage_over_base, exempt_amount ?? 0],
  );
  return result.rows[0];
};

const updateTaxRow = async (id, fields) => {
  const sets = [];
  const vals = [];
  let idx = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (["salary_from", "salary_to", "tax_base", "percentage_over_base", "exempt_amount"].includes(key)) {
      sets.push(`${key} = $${idx++}`);
      vals.push(value);
    }
  }
  if (sets.length === 0) return null;
  vals.push(id);
  const result = await pool.query(`UPDATE withholding_tax_brackets SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
  return result.rows[0];
};

const deleteTaxRow = async (id) => {
  const result = await pool.query("DELETE FROM withholding_tax_brackets WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getSssTable, createSssRow, updateSssRow, deleteSssRow,
  getPhilHealthTable, createPhilHealthRow, updatePhilHealthRow, deletePhilHealthRow,
  getPagIbigTable, createPagIbigRow, updatePagIbigRow, deletePagIbigRow,
  getWithholdingTaxTable, createTaxRow, updateTaxRow, deleteTaxRow,
};
