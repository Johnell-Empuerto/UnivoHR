const pool = require("../config/db");

// GET ALL — all events, no branch filter
const getCalendar = async (start, end) => {
  let query;
  let values;

  if (start && end) {
    query = `
      SELECT cd.*, b.name AS branch_name
      FROM calendar_days cd
      LEFT JOIN branches b ON b.id = cd.branch_id
      WHERE cd.date BETWEEN $1 AND $2
      ORDER BY cd.date
    `;
    values = [start, end];
  } else {
    query = `
      SELECT cd.*, b.name AS branch_name
      FROM calendar_days cd
      LEFT JOIN branches b ON b.id = cd.branch_id
      WHERE 1=1
      ORDER BY cd.date
    `;
    values = [];
  }

  const result = await pool.query(query, values);
  return result.rows;
};

// GET ONE — all events for date, no branch filter
const getByDate = async (date) => {
  const result = await pool.query(
    `
    SELECT cd.*, b.name AS branch_name
    FROM calendar_days cd
    LEFT JOIN branches b ON b.id = cd.branch_id
    WHERE cd.date = $1
    ORDER BY cd.branch_id NULLS LAST
    LIMIT 1
    `,
    [date],
  );
  return result.rows[0];
};

// CREATE
const create = async (data) => {
  const { date, day_type, is_paid, description, branch_id } = data;

  const result = await pool.query(
    `
    INSERT INTO calendar_days (date, day_type, is_paid, description, branch_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [date, day_type, is_paid, description, branch_id || null],
  );

  return result.rows[0];
};

// UPDATE
const update = async (id, data) => {
  const { day_type, is_paid, description, branch_id } = data;

  const result = await pool.query(
    `
    UPDATE calendar_days
    SET day_type = $1,
        is_paid = $2,
        description = $3,
        branch_id = $5
    WHERE id = $4
    RETURNING *
  `,
    [day_type, is_paid, description, id, branch_id === undefined ? null : branch_id],
  );

  return result.rows[0];
};

// DELETE
const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM calendar_days WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};

// GET ONE by ID
const getById = async (id) => {
  const result = await pool.query(
    `SELECT cd.*, b.name AS branch_name
     FROM calendar_days cd
     LEFT JOIN branches b ON b.id = cd.branch_id
     WHERE cd.id = $1`,
    [id],
  );
  return result.rows[0];
};

// GET ONE by date + branch_id (null = global) — for duplicate checking
const getByDateAndBranch = async (date, branch_id) => {
  const result = await pool.query(
    `
    SELECT id, day_type, is_paid, description, branch_id
    FROM calendar_days
    WHERE date = $1 AND branch_id IS NOT DISTINCT FROM $2
    LIMIT 1
  `,
    [date, branch_id],
  );
  return result.rows[0];
};

module.exports = {
  getCalendar,
  getByDate,
  getByDateAndBranch,
  getById,
  create,
  update,
  remove,
};
