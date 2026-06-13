const pool = require("../config/db");

const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_forms (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_form_fields (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES hr_forms(id) ON DELETE CASCADE,
      label VARCHAR(255) NOT NULL,
      field_type VARCHAR(50) NOT NULL,
      field_order INTEGER DEFAULT 0,
      required BOOLEAN DEFAULT FALSE,
      options TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_form_assignments (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES hr_forms(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      assigned_by INTEGER REFERENCES users(id),
      due_date DATE,
      status VARCHAR(30) DEFAULT 'Pending',
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_form_answers (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER NOT NULL REFERENCES hr_form_assignments(id) ON DELETE CASCADE,
      field_id INTEGER NOT NULL REFERENCES hr_form_fields(id) ON DELETE CASCADE,
      answer TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hr_form_answers_assignment_field_unique
    ON hr_form_answers (assignment_id, field_id)
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_form_submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER NOT NULL REFERENCES hr_form_assignments(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      form_id INTEGER NOT NULL REFERENCES hr_forms(id) ON DELETE CASCADE,
      status VARCHAR(30) DEFAULT 'Submitted',
      submitted_at TIMESTAMP DEFAULT NOW(),
      reviewed_at TIMESTAMP,
      reviewed_by INTEGER REFERENCES users(id),
      remarks TEXT
    )
  `);
};

const getAllForms = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const q = `%${search}%`;
  const data = await pool.query(
    `SELECT hf.*, COALESCE(e.first_name || ' ' || e.last_name, u.username, 'System') AS created_by_name,
            (SELECT COUNT(*) FROM hr_form_fields WHERE form_id = hf.id) AS field_count,
            (SELECT COUNT(*) FROM hr_form_assignments WHERE form_id = hf.id) AS assignment_count,
            (SELECT COUNT(*) FROM hr_form_submissions WHERE form_id = hf.id) AS submission_count
     FROM hr_forms hf LEFT JOIN users u ON u.id = hf.created_by LEFT JOIN employees e ON e.id = u.employee_id
     WHERE $1 = '' OR hf.title ILIKE $1
     ORDER BY hf.created_at DESC LIMIT $2 OFFSET $3`,
    [q, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*) FROM hr_forms WHERE $1 = '' OR title ILIKE $1`,
    [q],
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getFormById = async (id) => {
  const result = await pool.query(
    `SELECT hf.*, COALESCE(e.first_name || ' ' || e.last_name, u.username, 'System') AS created_by_name
     FROM hr_forms hf LEFT JOIN users u ON u.id = hf.created_by LEFT JOIN employees e ON e.id = u.employee_id
     WHERE hf.id = $1`,
    [id],
  );
  return result.rows[0];
};

const createForm = async (data) => {
  const result = await pool.query(
    `INSERT INTO hr_forms (title, description, created_by) VALUES ($1,$2,$3) RETURNING *`,
    [data.title, data.description || null, data.created_by || null],
  );
  return result.rows[0];
};

const updateForm = async (id, data) => {
  const result = await pool.query(
    `UPDATE hr_forms SET title=$1, description=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
    [data.title, data.description || null, id],
  );
  return result.rows[0];
};

const hasAssignments = async (formId) => {
  const result = await pool.query(`SELECT COUNT(*) FROM hr_form_assignments WHERE form_id=$1`, [formId]);
  return parseInt(result.rows[0].count) > 0;
};

const deleteForm = async (id) => {
  await pool.query(`DELETE FROM hr_forms WHERE id=$1`, [id]);
};

const getFieldsByFormId = async (formId) => {
  const result = await pool.query(
    `SELECT * FROM hr_form_fields WHERE form_id=$1 ORDER BY field_order, id`,
    [formId],
  );
  return result.rows;
};

const createField = async (data) => {
  const result = await pool.query(
    `INSERT INTO hr_form_fields (form_id, label, field_type, field_order, required, options)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [data.form_id, data.label, data.field_type, data.field_order || 0, data.required || false, data.options || null],
  );
  return result.rows[0];
};

const updateField = async (id, data) => {
  const result = await pool.query(
    `UPDATE hr_form_fields SET label=$1, field_type=$2, field_order=$3, required=$4, options=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
    [data.label, data.field_type, data.field_order || 0, data.required || false, data.options || null, id],
  );
  return result.rows[0];
};

const hasFieldAnswers = async (fieldId) => {
  const result = await pool.query(`SELECT COUNT(*) FROM hr_form_answers WHERE field_id=$1`, [fieldId]);
  return parseInt(result.rows[0].count) > 0;
};

const deleteField = async (id) => {
  await pool.query(`DELETE FROM hr_form_fields WHERE id=$1`, [id]);
};

const createAssignment = async (data) => {
  const result = await pool.query(
    `INSERT INTO hr_form_assignments (form_id, employee_id, assigned_by, due_date) VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.form_id, data.employee_id, data.assigned_by || null, data.due_date || null],
  );
  return result.rows[0];
};

const bulkCreateAssignments = async (assignments, assignedBy) => {
  if (assignments.length === 0) return { created_count: 0, skipped_employee_ids: [] };
  const formId = assignments[0].form_id;
  const employeeIds = assignments.map(a => a.employee_id);
  const dueDate = assignments[0].due_date || null;
  const result = await pool.query(
    `INSERT INTO hr_form_assignments (form_id, employee_id, assigned_by, due_date)
     SELECT $1, t.employee_id, $3, $4::DATE
     FROM unnest($2::int[]) AS t(employee_id)
     WHERE NOT EXISTS (
       SELECT 1 FROM hr_form_assignments a
       WHERE a.form_id = $1 AND a.employee_id = t.employee_id AND a.status = 'Pending'
     )
     RETURNING employee_id`,
    [formId, employeeIds, assignedBy, dueDate],
  );
  const createdIds = result.rows.map(r => r.employee_id);
  const skippedEmployeeIds = employeeIds.filter(id => !createdIds.includes(id));
  return { created_count: createdIds.length, created_employee_ids: createdIds, skipped_employee_ids: skippedEmployeeIds };
};

const bulkAssignAllMatching = async ({ form_id, search, due_date, assigned_by }) => {
  const searchValue = `%${search}%`;
  const result = await pool.query(
    `WITH matched AS (
       SELECT e.id FROM employees e
       WHERE e.status = 'ACTIVE'
         AND ($2 = '' OR e.first_name ILIKE $3 OR e.last_name ILIKE $3 OR e.employee_code ILIKE $3 OR e.department ILIKE $3)
     ), inserted AS (
       INSERT INTO hr_form_assignments (form_id, employee_id, assigned_by, due_date)
       SELECT $1, m.id, $4, $5::DATE
       FROM matched m
       WHERE NOT EXISTS (
         SELECT 1 FROM hr_form_assignments a
         WHERE a.form_id = $1 AND a.employee_id = m.id AND a.status = 'Pending'
       )
       RETURNING employee_id
     )
     SELECT (SELECT COUNT(*) FROM matched) AS total_matching,
            COALESCE((SELECT array_agg(employee_id) FROM inserted), '{}') AS created_employee_ids`,
    [form_id, search, searchValue, assigned_by, due_date],
  );
  const { total_matching, created_employee_ids } = result.rows[0];
  const createdIds = created_employee_ids || [];
  return { created_count: createdIds.length, created_employee_ids: createdIds, total_matching: Number(total_matching) };
};

const getAllAssignments = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const q = `%${search}%`;
  const data = await pool.query(
    `SELECT a.*, f.title AS form_title,
            e.first_name || ' ' || e.last_name AS employee_name, e.employee_code, e.department,
            COALESCE(ue.first_name || ' ' || ue.last_name, u.username, 'System') AS assigned_by_name
     FROM hr_form_assignments a
     JOIN hr_forms f ON f.id = a.form_id
     JOIN employees e ON e.id = a.employee_id
     LEFT JOIN users u ON u.id = a.assigned_by LEFT JOIN employees ue ON ue.id = u.employee_id
     WHERE $1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.employee_code ILIKE $1
     ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
    [q, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)
     FROM hr_form_assignments a
     JOIN employees e ON e.id = a.employee_id
     WHERE $1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.employee_code ILIKE $1`,
    [q],
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getMyAssignments = async (employeeId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const data = await pool.query(
    `SELECT a.*, f.title AS form_title, f.description AS form_description
     FROM hr_form_assignments a
     JOIN hr_forms f ON f.id = a.form_id
     WHERE a.employee_id = $1
     ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
    [employeeId, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*) FROM hr_form_assignments WHERE employee_id = $1`,
    [employeeId],
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getAssignmentById = async (assignmentId) => {
  const result = await pool.query(
    `SELECT a.*, f.title AS form_title, f.description AS form_description
     FROM hr_form_assignments a
     JOIN hr_forms f ON f.id = a.form_id
     WHERE a.id = $1`,
    [assignmentId],
  );
  return result.rows[0];
};

const updateAssignmentStatus = async (id, status, submittedAt) => {
  const result = await pool.query(
    `UPDATE hr_form_assignments SET status=$1, submitted_at=$2 WHERE id=$3 RETURNING *`,
    [status, submittedAt || null, id],
  );
  return result.rows[0];
};

const createSubmission = async (data) => {
  const result = await pool.query(
    `INSERT INTO hr_form_submissions (assignment_id, employee_id, form_id) VALUES ($1,$2,$3) RETURNING *`,
    [data.assignment_id, data.employee_id, data.form_id],
  );
  return result.rows[0];
};

const upsertAnswer = async (assignmentId, fieldId, answer) => {
  const result = await pool.query(
    `INSERT INTO hr_form_answers (assignment_id, field_id, answer) VALUES ($1,$2,$3)
     ON CONFLICT (assignment_id, field_id) DO UPDATE SET answer=$3, updated_at=NOW() RETURNING *`,
    [assignmentId, fieldId, answer],
  );
  return result.rows[0];
};

const getAnswersByAssignmentId = async (assignmentId) => {
  const result = await pool.query(
    `SELECT * FROM hr_form_answers WHERE assignment_id=$1`,
    [assignmentId],
  );
  return result.rows;
};

const getSubmissions = async (search = "", page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const q = `%${search}%`;
  const data = await pool.query(
    `SELECT s.*, f.title AS form_title,
            e.first_name || ' ' || e.last_name AS employee_name, e.employee_code, e.department
     FROM hr_form_submissions s
     JOIN hr_forms f ON f.id = s.form_id
     JOIN employees e ON e.id = s.employee_id
     WHERE $1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.employee_code ILIKE $1 OR f.title ILIKE $1
     ORDER BY s.submitted_at DESC LIMIT $2 OFFSET $3`,
    [q, limit, offset],
  );
  const count = await pool.query(
    `SELECT COUNT(*)
     FROM hr_form_submissions s
     JOIN hr_forms f ON f.id = s.form_id
     JOIN employees e ON e.id = s.employee_id
     WHERE $1 = '' OR e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.employee_code ILIKE $1 OR f.title ILIKE $1`,
    [q],
  );
  const total = parseInt(count.rows[0].count);
  return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
};

const getSubmissionById = async (submissionId) => {
  const result = await pool.query(
    `SELECT s.*, f.title AS form_title,
            e.first_name || ' ' || e.last_name AS employee_name, e.employee_code
     FROM hr_form_submissions s
     JOIN hr_forms f ON f.id = s.form_id
     JOIN employees e ON e.id = s.employee_id
     WHERE s.id = $1`,
    [submissionId],
  );
  return result.rows[0];
};

const updateSubmissionReview = async (id, reviewedBy, remarks) => {
  const result = await pool.query(
    `UPDATE hr_form_submissions SET status='Reviewed', reviewed_by=$1, reviewed_at=NOW(), remarks=$2 WHERE id=$3 RETURNING *`,
    [reviewedBy, remarks || null, id],
  );
  return result.rows[0];
};

const getSubmissionByAssignmentId = async (assignmentId) => {
  const result = await pool.query(
    `SELECT * FROM hr_form_submissions WHERE assignment_id=$1 ORDER BY submitted_at DESC LIMIT 1`,
    [assignmentId],
  );
  return result.rows[0];
};

const getUserIdsByEmployeeIds = async (employeeIds) => {
  if (employeeIds.length === 0) return [];
  const result = await pool.query(
    `SELECT id, employee_id FROM users WHERE employee_id = ANY($1::int[])`,
    [employeeIds],
  );
  return result.rows;
};

const getActiveHRUserIds = async () => {
  const result = await pool.query(
    `SELECT id FROM users WHERE role = 'ADMIN' OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = users.id AND up.permission_key = 'employees.manage' AND up.is_allowed = true)`,
  );
  return result.rows.map(r => r.id);
};

module.exports = {
  init,
  getAllForms, getFormById, createForm, updateForm, deleteForm, hasAssignments,
  getFieldsByFormId, createField, updateField, deleteField, hasFieldAnswers,
  createAssignment, bulkCreateAssignments, bulkAssignAllMatching,
  getAllAssignments, getMyAssignments, getAssignmentById,
  updateAssignmentStatus,
  createSubmission, upsertAnswer, getAnswersByAssignmentId,
  getSubmissions, getSubmissionById, updateSubmissionReview,
  getSubmissionByAssignmentId,
  getUserIdsByEmployeeIds, getActiveHRUserIds,
};
