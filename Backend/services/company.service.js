const pool = require("../config/db");

const getCompany = async () => {
  const result = await pool.query(
    "SELECT * FROM company_settings ORDER BY id DESC LIMIT 1",
  );

  return result.rows[0];
};

module.exports = {
  getCompany,
};
