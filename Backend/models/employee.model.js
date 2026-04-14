const pool = require("../config/db");

const getEmployees = async (page = 1, limit = 10, search = "", status = "") => {
  const offset = (page - 1) * limit;

  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `
    SELECT *
    FROM employees
    WHERE 
      (
        first_name ILIKE $3 OR 
        last_name ILIKE $3 OR 
        employee_code ILIKE $3 OR
        CONCAT_WS(' ', first_name, middle_name, last_name, suffix) ILIKE $3
      )
      AND ($4 = '' OR status = $4)
    ORDER BY id DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchValue, status],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM employees
    WHERE 
      (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        employee_code ILIKE $1 OR
        CONCAT_WS(' ', first_name, middle_name, last_name, suffix) ILIKE $1
      )
      AND ($2 = '' OR status = $2)
    `,
    [searchValue, status],
  );

  const total = parseInt(countQuery.rows[0].count);

  return {
    data: dataQuery.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createEmployee = async (data) => {
  const query = `
    INSERT INTO employees (
      first_name, middle_name, last_name, suffix,
      employee_code, department, position,
      birthday, gender, contact_number, address,
      emergency_contact_name, emergency_contact_number,
      emergency_contact_address, emergency_contact_relation,
      marital_status, rfid_tag, fingerprint_id, status,
      sss_number, philhealth_number, hdmf_number, tin_number,
      hired_date, resignation_date, termination_date, last_working_date
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
      $12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28
    )
    RETURNING *;
  `;

  const values = [
    data.first_name || null,
    data.middle_name || null,
    data.last_name || null,
    data.suffix || null,
    data.employee_code,
    data.department || null,
    data.position || null,
    data.birthday || null,
    data.gender || null,
    data.contact_number || null,
    data.address || null,
    data.emergency_contact_name || null,
    data.emergency_contact_number || null,
    data.emergency_contact_address || null,
    data.emergency_contact_relation || null,
    data.marital_status || null,
    data.rfid_tag || null,
    data.fingerprint_id || null,
    data.status || "ACTIVE",
    data.sss_number || null,
    data.philhealth_number || null,
    data.hdmf_number || null,
    data.tin_number || null,
    data.hired_date || null,
    data.resignation_date || null,
    data.termination_date || null,
    data.last_working_date || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateEmployee = async (id, data) => {
  const query = `
    UPDATE employees SET
      first_name = $1,
      middle_name = $2,
      last_name = $3,
      suffix = $4,
      employee_code = $5,
      department = $6,
      position = $7,
      birthday = $8,
      gender = $9,
      contact_number = $10,
      address = $11,
      emergency_contact_name = $12,
      emergency_contact_number = $13,
      emergency_contact_address = $14,
      emergency_contact_relation = $15,
      marital_status = $16,
      rfid_tag = $17,
      fingerprint_id = $18,
      status = $19,
      sss_number = $20,
      philhealth_number = $21,
      hdmf_number = $22,
      tin_number = $23,
      hired_date = $24,
      resignation_date = $25,
      termination_date = $26,
      last_working_date = $27
    WHERE id = $28
    RETURNING *;
  `;

  const values = [
    data.first_name || null,
    data.middle_name || null,
    data.last_name || null,
    data.suffix || null,
    data.employee_code,
    data.department || null,
    data.position || null,
    data.birthday || null,
    data.gender || null,
    data.contact_number || null,
    data.address || null,
    data.emergency_contact_name || null,
    data.emergency_contact_number || null,
    data.emergency_contact_address || null,
    data.emergency_contact_relation || null,
    data.marital_status || null,
    data.rfid_tag || null,
    data.fingerprint_id || null,
    data.status,
    data.sss_number || null,
    data.philhealth_number || null,
    data.hdmf_number || null,
    data.tin_number || null,
    data.hired_date || null,
    data.resignation_date || null,
    data.termination_date || null,
    data.last_working_date || null,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Helper to get employee by ID
const getEmployeeById = async (id) => {
  const query = `
    SELECT * FROM employees WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeById,
};
