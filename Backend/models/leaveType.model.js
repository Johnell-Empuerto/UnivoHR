const pool = require("../config/db");

// GET ALL
const getAll = async () => {
  const result = await pool.query(`
    SELECT * FROM leave_types ORDER BY id ASC
  `);
  return result.rows;
};

// UPDATE
const update = async (id, data) => {
  const { is_convertible, max_convertible_days } = data;

  const result = await pool.query(
    `
    UPDATE leave_types
    SET 
      is_convertible = COALESCE($1, is_convertible),
      max_convertible_days = $2
    WHERE id = $3
    RETURNING *
    `,
    [is_convertible, max_convertible_days, id],
  );

  return result.rows[0];
};

module.exports = {
  getAll,
  update,
};
