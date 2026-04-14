const pool = require("../config/db");

const insertLog = async ({ employee_code, timestamp, device_id }) => {
  const query = `
    INSERT INTO raw_logs (employee_code, timestamp, device_id)
    VALUES ($1, $2, $3)
  `;

  await pool.query(query, [employee_code, timestamp, device_id]);
};

module.exports = { insertLog };
