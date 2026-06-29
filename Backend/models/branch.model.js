const pool = require("../config/db");

const BRANCH_USAGE_CHECKS = [
  { table: "employees", column: "branch_id", label: "employees" },
  { table: "attendance", column: "branch_id", label: "attendance records" },
  { table: "calendar_days", column: "branch_id", label: "calendar days" },
  { table: "devices", column: "branch_id", label: "devices" },
  { table: "branch_rest_days", column: "branch_id", label: "branch rest days" },
  { table: "user_branch_access", column: "branch_id", label: "user branch access" },
  { table: "payroll", column: "branch_id", label: "payroll records" },
  { table: "job_positions", column: "branch_id", label: "job positions" },
  { table: "recruitment_workflows", column: "branch_id", label: "recruitment workflows" },
  { table: "anomaly_logs", column: "branch_id", label: "anomaly logs" },
  { table: "forecast_logs", column: "branch_id", label: "forecast logs" },
  { table: "employee_import_rows", column: "branch_id", label: "employee import rows" },
];

const getAll = async () => {
  const result = await pool.query(
    `SELECT * FROM branches ORDER BY is_active DESC, name ASC`,
  );
  return result.rows;
};

const getActive = async () => {
  const result = await pool.query(
    `SELECT * FROM branches WHERE is_active = true ORDER BY name ASC`,
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM branches WHERE id = $1`, [id]);
  return result.rows[0];
};

const getByCode = async (code) => {
  const result = await pool.query(`SELECT * FROM branches WHERE code = $1`, [
    code,
  ]);
  return result.rows[0];
};

const create = async (data) => {
  const { code, name, address, city, province, phone, timezone } = data;
  const result = await pool.query(
    `INSERT INTO branches (code, name, address, city, province, phone, timezone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [code, name, address || null, city || null, province || null, phone || null, timezone || 'Asia/Manila'],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { code, name, address, city, province, phone, timezone } = data;
  const result = await pool.query(
    `UPDATE branches
     SET code = $1, name = $2, address = $3, city = $4, province = $5, phone = $6, timezone = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [code, name, address || null, city || null, province || null, phone || null, timezone || 'Asia/Manila', id],
  );
  return result.rows[0];
};

const setActive = async (id, is_active) => {
  const result = await pool.query(
    `UPDATE branches SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [is_active, id],
  );
  return result.rows[0];
};

const countEmployees = async (branch_id) => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM employees WHERE branch_id = $1`,
    [branch_id],
  );
  return result.rows[0].count;
};

const hasColumn = async (db, table, column) => {
  const result = await db.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists`,
    [table, column],
  );
  return result.rows[0].exists;
};

const getUsageCounts = async (branch_id, db = pool) => {
  const usage = [];

  for (const check of BRANCH_USAGE_CHECKS) {
    const exists = await hasColumn(db, check.table, check.column);
    if (!exists) {
      usage.push({ table: check.table, label: check.label, count: 0 });
      continue;
    }

    const result = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM ${check.table}
       WHERE ${check.column} = $1 ${check.extraWhere || ""}`,
      [branch_id],
    );

    usage.push({
      table: check.table,
      label: check.label,
      count: result.rows[0].count,
    });
  }

  return usage;
};

const removeIfUnused = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const branchResult = await client.query(
      `SELECT * FROM branches WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const branch = branchResult.rows[0];

    if (!branch) {
      await client.query("ROLLBACK");
      return null;
    }

    const usage = await getUsageCounts(id, client);
    const inUse = usage.filter((item) => item.count > 0);

    if (inUse.length > 0) {
      const error = new Error(
        "Branch cannot be deleted because it contains historical business records.",
      );
      error.code = "BRANCH_IN_USE";
      error.statusCode = 409;
      error.usage = inUse;
      throw error;
    }

    const result = await client.query(
      `DELETE FROM branches WHERE id = $1 RETURNING *`,
      [id],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  getByCode,
  create,
  update,
  setActive,
  countEmployees,
  getUsageCounts,
  removeIfUnused,
};
