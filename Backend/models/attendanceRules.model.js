const pool = require("../config/db");

const getRules = async () => {
  const result = await pool.query(
    "SELECT * FROM attendance_rules ORDER BY id DESC LIMIT 1",
  );
  return result.rows[0];
};

module.exports = { getRules };
