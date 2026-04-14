const pool = require("../config/db");

// GET ALL (range optional)
const getCalendar = async (start, end) => {
  let query = `SELECT * FROM calendar_days ORDER BY date`;

  let values = [];

  if (start && end) {
    query = `
      SELECT * FROM calendar_days
      WHERE date BETWEEN $1 AND $2
      ORDER BY date
    `;
    values = [start, end];
  }

  const result = await pool.query(query, values);
  return result.rows;
};

// GET ONE
const getByDate = async (date) => {
  const result = await pool.query(
    `SELECT * FROM calendar_days WHERE date = $1`,
    [date],
  );
  return result.rows[0];
};

//  CREATE
const create = async (data) => {
  const { date, day_type, is_paid, description } = data;

  const result = await pool.query(
    `
    INSERT INTO calendar_days (date, day_type, is_paid, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    [date, day_type, is_paid, description],
  );

  return result.rows[0];
};

// UPDATE
const update = async (id, data) => {
  const { day_type, is_paid, description } = data;

  const result = await pool.query(
    `
    UPDATE calendar_days
    SET day_type = $1,
        is_paid = $2,
        description = $3
    WHERE id = $4
    RETURNING *
  `,
    [day_type, is_paid, description, id],
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

module.exports = {
  getCalendar,
  getByDate,
  create,
  update,
  remove,
};
