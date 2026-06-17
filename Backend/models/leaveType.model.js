const pool = require("../config/db");

const getAll = async () => {
  const result = await pool.query(`
    SELECT * FROM leave_types ORDER BY sort_order ASC, code ASC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM leave_types WHERE id = $1`, [id]);
  return result.rows[0];
};

const getByCode = async (code) => {
  const result = await pool.query(`SELECT * FROM leave_types WHERE code = $1`, [code]);
  return result.rows[0];
};

const create = async (data) => {
  const {
    code, name, description, is_enabled, is_paid, is_convertible,
    max_convertible_days, requires_balance, default_days, requires_attachment,
    requires_approval, employee_requestable, hr_only, include_in_credits,
    is_unlimited, affects_payroll, deducts_salary, sort_order,
  } = data;
  const result = await pool.query(`
    INSERT INTO leave_types (code, name, description, is_enabled, is_paid, is_convertible, max_convertible_days, requires_balance, default_days, requires_attachment, requires_approval, employee_requestable, hr_only, include_in_credits, is_unlimited, affects_payroll, deducts_salary, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    code, name, description || null, is_enabled ?? false, is_paid ?? true,
    is_convertible ?? false, max_convertible_days ?? null, requires_balance ?? true,
    default_days ?? 0, requires_attachment ?? false, requires_approval ?? true,
    employee_requestable ?? true, hr_only ?? false, include_in_credits ?? true,
    is_unlimited ?? false, affects_payroll ?? true, deducts_salary ?? true,
    sort_order ?? 99,
  ]);
  return result.rows[0];
};

const updatableColumns = new Set([
  'code', 'name', 'description', 'is_enabled', 'is_paid', 'is_convertible',
  'max_convertible_days', 'requires_balance', 'default_days', 'requires_attachment',
  'requires_approval', 'employee_requestable', 'hr_only', 'include_in_credits',
  'is_unlimited', 'affects_payroll', 'deducts_salary', 'sort_order',
]);

const update = async (id, data) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  for (const [key, value] of Object.entries(data)) {
    if (updatableColumns.has(key)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  if (fields.length === 0) return getById(id);
  values.push(id);
  const result = await pool.query(`
    UPDATE leave_types SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);
  return result.rows[0];
};

const toggleEnabled = async (id) => {
  const result = await pool.query(`
    UPDATE leave_types SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `, [id]);
  return result.rows[0];
};

module.exports = {
  getAll,
  getById,
  getByCode,
  create,
  update,
  toggleEnabled,
};
