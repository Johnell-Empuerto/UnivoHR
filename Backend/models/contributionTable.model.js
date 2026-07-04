const pool = require("../config/db");

const getSssTable = async () => {
  const result = await pool.query("SELECT * FROM sss_contributions ORDER BY salary_from");
  return result.rows;
};

const getPhilHealthTable = async () => {
  const result = await pool.query("SELECT * FROM philhealth_contributions ORDER BY salary_from");
  return result.rows;
};

const getPagIbigTable = async () => {
  const result = await pool.query("SELECT * FROM pagibig_contributions ORDER BY salary_from");
  return result.rows;
};

const getWithholdingTaxTable = async () => {
  const result = await pool.query("SELECT * FROM withholding_tax_brackets ORDER BY salary_from");
  return result.rows;
};

module.exports = {
  getSssTable,
  getPhilHealthTable,
  getPagIbigTable,
  getWithholdingTaxTable,
};
