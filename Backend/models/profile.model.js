const pool = require("../config/db");

// Get full employee profile by employee_id (from user token)
const getProfileByEmployeeId = async (employeeId) => {
  const query = `
    SELECT
      e.id,
      e.first_name,
      e.middle_name,
      e.last_name,
      e.suffix,
      e.employee_code,
      e.department,
      e.position,
      e.birthday,
      e.gender,
      e.contact_number,
      e.address,
      e.emergency_contact_name,
      e.emergency_contact_number,
      e.emergency_contact_address,
      e.emergency_contact_relation,
      e.marital_status,
      e.rfid_tag,
      e.fingerprint_id,
      e.status,
      e.sss_number,
      e.philhealth_number,
      e.hdmf_number,
      e.tin_number,
      e.hired_date,
      e.resignation_date,
      e.termination_date,
      e.last_working_date,
      e.created_at,
      u.username,
      e.email,
      u.role
    FROM employees e
    LEFT JOIN users u ON u.employee_id = e.id
    WHERE e.id = $1
  `;
  const result = await pool.query(query, [employeeId]);
  return result.rows[0];
};

// Update employee profile (limited fields for self-service)
const updateProfile = async (employeeId, data) => {
  const query = `
    UPDATE employees SET
      contact_number = $1,
      address = $2,
      emergency_contact_name = $3,
      emergency_contact_number = $4,
      emergency_contact_address = $5,
      emergency_contact_relation = $6
    WHERE id = $7
    RETURNING *
  `;
  const values = [
    data.contact_number || null,
    data.address || null,
    data.emergency_contact_name || null,
    data.emergency_contact_number || null,
    data.emergency_contact_address || null,
    data.emergency_contact_relation || null,
    employeeId,
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getProfileByEmployeeId,
  updateProfile,
};
