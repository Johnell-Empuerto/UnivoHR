const pool = require("../config/db");

const mapRow = (row) =>
  row
    ? { ...row, rule_value: Number(row.rule_value) }
    : null;

const getAll = async () => {
  const result = await pool.query(
    `SELECT rule_key, rule_value, description, created_at, updated_at
     FROM payroll_rules
     ORDER BY rule_key`
  );
  return result.rows.map(mapRow);
};

const getByKey = async (ruleKey) => {
  const result = await pool.query(
    `SELECT rule_key, rule_value, description, created_at, updated_at
     FROM payroll_rules
     WHERE rule_key = $1`,
    [ruleKey]
  );
  return mapRow(result.rows[0]);
};

const update = async (ruleKey, ruleValue) => {
  const result = await pool.query(
    `INSERT INTO payroll_rules (rule_key, rule_value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (rule_key)
     DO UPDATE SET rule_value = $2, updated_at = NOW()
     RETURNING *`,
    [ruleKey, ruleValue]
  );
  return mapRow(result.rows[0]);
};

module.exports = { getAll, getByKey, update };
