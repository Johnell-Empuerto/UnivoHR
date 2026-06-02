const pool = require("../config/db");

const getByBranchId = async (branchId) => {
  const result = await pool.query(
    `SELECT * FROM branch_rest_days
     WHERE branch_id = $1 AND is_active = true
     ORDER BY day_of_week`,
    [branchId]
  );
  return result.rows;
};

const getAllByBranchIds = async (branchIds) => {
  if (!branchIds || branchIds.length === 0) return [];
  const result = await pool.query(
    `SELECT * FROM branch_rest_days
     WHERE branch_id = ANY($1::int[]) AND is_active = true
     ORDER BY branch_id, day_of_week`,
    [branchIds]
  );
  return result.rows;
};

const getAll = async () => {
  const result = await pool.query(
    `SELECT br.*, b.name AS branch_name
     FROM branch_rest_days br
     JOIN branches b ON b.id = br.branch_id
     ORDER BY b.name, br.day_of_week`
  );
  return result.rows;
};

const create = async (data) => {
  const { branch_id, day_of_week } = data;
  const result = await pool.query(
    `INSERT INTO branch_rest_days (branch_id, day_of_week)
     VALUES ($1, $2)
     ON CONFLICT (branch_id, day_of_week)
     DO UPDATE SET is_active = true, updated_at = NOW()
     RETURNING *`,
    [branch_id, day_of_week]
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM branch_rest_days WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

const setActive = async (id, isActive) => {
  const result = await pool.query(
    `UPDATE branch_rest_days SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [isActive, id]
  );
  return result.rows[0];
};

const removeByBranchId = async (branchId) => {
  const result = await pool.query(
    `DELETE FROM branch_rest_days WHERE branch_id = $1 RETURNING *`,
    [branchId]
  );
  return result.rows;
};

module.exports = {
  getByBranchId,
  getAllByBranchIds,
  getAll,
  create,
  remove,
  setActive,
  removeByBranchId,
};
