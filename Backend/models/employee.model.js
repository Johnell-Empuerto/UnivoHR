const pool = require("../config/db");

const getEmployees = async (page = 1, limit = 10, search = "", status = "", branch_id = "") => {
  const offset = (page - 1) * limit;

  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `
    SELECT e.*, b.name AS branch_name, b.code AS branch_code
    FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE 
      (
        e.first_name ILIKE $3 OR 
        e.last_name ILIKE $3 OR 
        e.employee_code ILIKE $3 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
      )
      AND ($4 = '' OR e.status = $4)
      AND ($5 = '' OR e.branch_id = $5::int)
    ORDER BY e.id DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchValue, status, branch_id],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM employees e
    WHERE 
      (
        e.first_name ILIKE $1 OR 
        e.last_name ILIKE $1 OR 
        e.employee_code ILIKE $1 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
      )
      AND ($2 = '' OR e.status = $2)
      AND ($3 = '' OR e.branch_id = $3::int)
    `,
    [searchValue, status, branch_id],
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
  const branchId = data.branch_id || (await getDefaultBranchId());

  const query = `
    INSERT INTO employees (
      first_name, middle_name, last_name, suffix,
      employee_code, department, position,
      birthday, gender, contact_number, address,
      emergency_contact_name, emergency_contact_number,
      emergency_contact_address, emergency_contact_relation,
      marital_status, rfid_tag, fingerprint_id, status,
      sss_number, philhealth_number, hdmf_number, tin_number,
      hired_date, resignation_date, termination_date, last_working_date,
      branch_id
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
      $12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29
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
    branchId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateEmployee = async (id, data) => {
  const branchId = data.branch_id || (await getDefaultBranchId());

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
      last_working_date = $27,
      branch_id = $29
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
    branchId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Helper to get employee by ID
const getEmployeeById = async (id) => {
  const query = `
    SELECT e.*, b.name AS branch_name, b.code AS branch_code
    FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE e.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

// Helper to get default branch ID (Main Branch)
const getDefaultBranchId = async () => {
  const result = await pool.query(
    `SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1`,
  );
  return result.rows[0]?.id || null;
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeById,
};
