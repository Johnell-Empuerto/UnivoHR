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
    `UPDATE payroll_rules
     SET rule_value = $1, updated_at = NOW()
     WHERE rule_key = $2
     RETURNING *`,
    [ruleValue, ruleKey]
  );
  return mapRow(result.rows[0]);
};

module.exports = { getAll, getByKey, update };
