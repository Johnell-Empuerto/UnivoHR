const pool = require("../config/db");

// CREATE MAN HOUR REPORT
const createManHourReport = async (data) => {
  const { employee_id, work_date, task, hours, remarks } = data;

  // Validate hours
  if (hours <= 0 || hours > 24) {
    throw new Error("Man hours must be between 0.5 and 24 hours");
  }

  // Validate date is not in the future (allow current day and past dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reportDate = new Date(work_date);

  // Set report date to start of day for comparison
  reportDate.setHours(0, 0, 0, 0);

  // Only block if date is strictly greater than today (tomorrow or later)
  if (reportDate > today) {
    throw new Error("Cannot submit man hour report for future dates");
  }

  const result = await pool.query(
    `INSERT INTO man_hour_reports (employee_id, work_date, task, hours, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [employee_id, work_date, task, hours, remarks || null],
  );

  return result.rows[0];
};

// GET MY MAN HOUR REPORTS (EMPLOYEE)
const getMyManHourReports = async (
  employee_id,
  page,
  limit,
  search,
  status,
) => {
  const offset = (page - 1) * limit;

  // Note: man_hour_reports doesn't have a status column by default
  // We'll consider all reports as "SUBMITTED" and add approval tracking
  let query = `
    SELECT
  m.*,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.employee_code,

  -- ✅ ADD STATUS HERE
  COALESCE((
    SELECT al.action
    FROM approval_logs al
    WHERE al.request_type = 'MAN_HOUR'
      AND al.request_id = m.id
    ORDER BY al.created_at DESC
    LIMIT 1
  ), 'SUBMITTED') AS status

FROM man_hour_reports m
JOIN employees e ON e.id = m.employee_id
WHERE m.employee_id = $1
  `;
  const params = [employee_id];
  let paramIndex = 2;

  if (search) {
    query += ` AND m.task ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  let countQuery = `SELECT COUNT(*) FROM man_hour_reports WHERE employee_id = $1`;
  const countParams = [employee_id];

  if (search) {
    countQuery += ` AND task ILIKE $2`;
    countParams.push(`%${search}%`);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = parseInt(totalResult.rows[0].count);

  return {
    data: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET ALL MAN HOUR REPORTS (ADMIN/HR/APPROVERS)
const getAllManHourReports = async (
  user_id,
  page,
  limit,
  search,
  date,
  userRole,
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      m.*,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      e.id AS employee_id,
      EXISTS (
        SELECT 1 FROM employee_approvers ea
        WHERE ea.employee_id = m.employee_id
        AND ea.approver_id = $1
        AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')
      ) AS is_assigned_approver,
   
      COALESCE((
        SELECT al.action
        FROM approval_logs al
        WHERE al.request_type = 'MAN_HOUR'
          AND al.request_id = m.id
        ORDER BY al.created_at DESC
        LIMIT 1
      ), 'SUBMITTED') AS status
    FROM man_hour_reports m
    JOIN employees e ON e.id = m.employee_id
    WHERE 1=1
  `;

  const params = [user_id];
  let paramIndex = 2;

  // Filter by assigned employees for non-admin users
  const isAdmin =
    userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR";

  if (!isAdmin) {
    query += ` AND EXISTS (
      SELECT 1 FROM employee_approvers ea
      WHERE ea.employee_id = m.employee_id
      AND ea.approver_id = $1
      AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')
    )`;
  }

  if (search) {
    query += ` AND (e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex} OR m.task ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (date) {
    query += ` AND m.work_date = $${paramIndex}`;
    params.push(date);
    paramIndex++;
  }

  query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Count query
  let countQuery = `
    SELECT COUNT(*)
    FROM man_hour_reports m
    JOIN employees e ON e.id = m.employee_id
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  const isAdminForCount =
    userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR";

  if (!isAdminForCount) {
    countQuery += ` AND EXISTS (
      SELECT 1 FROM employee_approvers ea
      WHERE ea.employee_id = m.employee_id
      AND ea.approver_id = $${countIndex}
      AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')
    )`;
    countParams.push(user_id);
    countIndex++;
  }

  if (search) {
    countQuery += ` AND (e.first_name ILIKE $${countIndex} OR e.last_name ILIKE $${countIndex} OR e.employee_code ILIKE $${countIndex} OR m.task ILIKE $${countIndex})`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (date) {
    countQuery += ` AND m.work_date = $${countIndex}`;
    countParams.push(date);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = parseInt(totalResult.rows[0].count);

  return {
    data: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET MAN HOUR REPORT DETAILS
const getManHourReportDetails = async (id, currentUserId = null) => {
  if (currentUserId === "" || currentUserId === undefined) {
    currentUserId = null;
  } else if (currentUserId) {
    currentUserId = Number(currentUserId);
    if (isNaN(currentUserId)) currentUserId = null;
  }

  const result = await pool.query(
    `SELECT
      m.*,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      e.id AS employee_id,
      CASE
        WHEN $2::BIGINT IS NOT NULL THEN EXISTS (
          SELECT 1 FROM employee_approvers ea
          WHERE ea.employee_id = m.employee_id
          AND ea.approver_id = $2
          AND (ea.approval_type = 'MAN_HOUR' OR ea.approval_type = 'ALL')
        )
        ELSE false
      END AS is_assigned_approver
    FROM man_hour_reports m
    JOIN employees e ON e.id = m.employee_id
    WHERE m.id = $1`,
    [id, currentUserId],
  );

  if (result.rows.length === 0) {
    throw new Error("Man hour report not found");
  }

  const manHourReport = result.rows[0];

  // Get approval timeline from approval_logs
  const timeline = await pool.query(
    `SELECT
      al.request_type,
      al.action,
      al.remarks,
      al.created_at,
      emp.first_name || ' ' || emp.last_name AS performed_by
    FROM approval_logs al
    LEFT JOIN users u ON u.id = al.approved_by
    LEFT JOIN employees emp ON emp.id = u.employee_id
    WHERE al.request_type = 'MAN_HOUR' AND al.request_id = $1
    ORDER BY al.created_at ASC`,
    [id],
  );

  manHourReport.timeline = timeline.rows;
  manHourReport.status =
    timeline.rows.length > 0
      ? timeline.rows[timeline.rows.length - 1].action
      : "SUBMITTED";

  return manHourReport;
};

// CHECK IF USER CAN APPROVE
const canApprove = async (
  approver_id,
  employee_id,
  approval_type,
  userRole = null,
) => {
  // ADMIN and HR_ADMIN can always approve
  if (userRole === "ADMIN" || userRole === "HR_ADMIN") {
    return true;
  }

  // HR can always approve
  if (userRole === "HR") {
    return true;
  }

  // For EMPLOYEE role, check if they are assigned as approver
  const result = await pool.query(
    `SELECT 1 FROM employee_approvers
     WHERE employee_id = $1
     AND approver_id = $2
     AND (approval_type = $3 OR approval_type = 'ALL')
     LIMIT 1`,
    [employee_id, approver_id, approval_type],
  );

  return result.rows.length > 0;
};

// APPROVE MAN HOUR REPORT
const approveManHourReport = async (id, approver_id, comment = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Log the approval
    await client.query(
      `INSERT INTO approval_logs (request_type, request_id, approved_by, action, remarks)
       VALUES ('MAN_HOUR', $1, $2, 'APPROVED', $3)`,
      [id, approver_id, comment],
    );

    await client.query("COMMIT");
    return { id, status: "APPROVED" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// REJECT MAN HOUR REPORT
const rejectManHourReport = async (id, approver_id, reason) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Log the rejection
    await client.query(
      `INSERT INTO approval_logs (request_type, request_id, approved_by, action, remarks)
       VALUES ('MAN_HOUR', $1, $2, 'REJECTED', $3)`,
      [id, approver_id, reason],
    );

    await client.query("COMMIT");
    return { id, status: "REJECTED" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// GET MAN HOUR SUMMARY FOR DATE RANGE
const getManHourSummary = async (start_date, end_date, employee_id = null) => {
  let params = [start_date, end_date];
  let employeeFilter = "";

  if (employee_id) {
    employeeFilter = " AND employee_id = $3";
    params = [start_date, end_date, employee_id];
  }

  const result = await pool.query(
    `SELECT
      employee_id,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      SUM(hours) AS total_hours,
      COUNT(*) AS total_reports,
      ARRAY_AGG(id) AS report_ids
    FROM man_hour_reports m
    JOIN employees e ON e.id = m.employee_id
    WHERE work_date BETWEEN $1 AND $2${employeeFilter}
    GROUP BY employee_id, e.first_name, e.last_name, e.employee_code
    ORDER BY employee_id`,
    params,
  );

  return result.rows;
};

// CHECK IF REPORT EXISTS FOR DATE (to prevent duplicates)
const existsForDate = async (employee_id, work_date) => {
  const result = await pool.query(
    `SELECT id FROM man_hour_reports
     WHERE employee_id = $1 AND work_date = $2`,
    [employee_id, work_date],
  );
  return result.rows.length > 0;
};

// UPDATE MAN HOUR REPORT
const updateManHourReport = async (id, data) => {
  const { task, hours, remarks } = data;

  const result = await pool.query(
    `UPDATE man_hour_reports
     SET task = $1, hours = $2, remarks = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [task, hours, remarks, id],
  );

  if (result.rows.length === 0) {
    throw new Error("Man hour report not found");
  }

  return result.rows[0];
};

// DELETE MAN HOUR REPORT
const deleteManHourReport = async (id) => {
  await pool.query(`DELETE FROM man_hour_reports WHERE id = $1`, [id]);
  return { message: "Man hour report deleted" };
};

module.exports = {
  createManHourReport,
  getMyManHourReports,
  getAllManHourReports,
  getManHourReportDetails,
  canApprove,
  approveManHourReport,
  rejectManHourReport,
  getManHourSummary,
  existsForDate,
  updateManHourReport,
  deleteManHourReport,
};
