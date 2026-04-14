const pool = require("../config/db");

// GET ALL PAY RULES
const getAllPayRules = async () => {
  const result = await pool.query(`
    SELECT 
      id,
      day_type,
      multiplier
    FROM pay_rules
    ORDER BY 
      CASE day_type
        WHEN 'REGULAR' THEN 1
        WHEN 'SPECIAL_NON_WORKING' THEN 2
        WHEN 'SPECIAL_HOLIDAY' THEN 3
        WHEN 'REGULAR_HOLIDAY' THEN 4
        ELSE 5
      END
  `);
  return result.rows;
};

// GET SINGLE PAY RULE
const getPayRuleById = async (id) => {
  const result = await pool.query(
    `SELECT id, day_type, multiplier FROM pay_rules WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

// CREATE PAY RULE
const createPayRule = async (data) => {
  const { day_type, multiplier } = data;

  const result = await pool.query(
    `INSERT INTO pay_rules (day_type, multiplier)
     VALUES ($1, $2)
     RETURNING *`,
    [day_type, multiplier],
  );
  return result.rows[0];
};

// UPDATE PAY RULE
const updatePayRule = async (id, data) => {
  const { day_type, multiplier } = data;

  const result = await pool.query(
    `UPDATE pay_rules 
     SET day_type = $1, multiplier = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [day_type, multiplier, id],
  );
  return result.rows[0];
};

// DELETE PAY RULE
const deletePayRule = async (id) => {
  const result = await pool.query(
    `DELETE FROM pay_rules WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0];
};

// GET CALENDAR DAYS (for specific date range)
const getCalendarDays = async (startDate, endDate) => {
  const result = await pool.query(
    `
    SELECT date, day_type, notes
    FROM calendar_days
    WHERE date BETWEEN $1 AND $2
    ORDER BY date
    `,
    [startDate, endDate],
  );
  return result.rows;
};

// ADD/UPDATE CALENDAR DAY
const upsertCalendarDay = async (data) => {
  const { date, day_type, notes } = data;

  const result = await pool.query(
    `
    INSERT INTO calendar_days (date, day_type, notes)
    VALUES ($1, $2, $3)
    ON CONFLICT (date) 
    DO UPDATE SET 
      day_type = EXCLUDED.day_type,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [date, day_type, notes],
  );
  return result.rows[0];
};

// DELETE CALENDAR DAY
const deleteCalendarDay = async (date) => {
  const result = await pool.query(
    `DELETE FROM calendar_days WHERE date = $1 RETURNING *`,
    [date],
  );
  return result.rows[0];
};

module.exports = {
  getAllPayRules,
  getPayRuleById,
  createPayRule,
  updatePayRule,
  deletePayRule,
  getCalendarDays,
  upsertCalendarDay,
  deleteCalendarDay,
};
