const pool = require("../config/db");

// CREATE OVERTIME REQUEST

const createOvertime = async (data) => {
  const { employee_id, date, start_time, end_time, hours, reason } = data;

  // Validate hours
  if (hours <= 0 || hours > 12) {
    throw new Error("Overtime hours must be between 0.5 and 12 hours");
  }

  // Validate date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestDate = new Date(date);

  if (requestDate > today) {
    throw new Error("Cannot submit overtime for future dates");
  }

  const result = await pool.query(
    `INSERT INTO overtime_requests (employee_id, date, start_time, end_time, hours, reason)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [employee_id, date, start_time, end_time, hours, reason],
  );

  return result.rows[0];
};

// GET MY OVERTIME REQUESTS (EMPLOYEE)

const getMyOvertime = async (employee_id, page, limit, search, status) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      o.*,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      approver_emp.first_name || ' ' || approver_emp.last_name AS approved_by_name
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    LEFT JOIN users approver_user ON approver_user.id = o.approved_by
    LEFT JOIN employees approver_emp ON approver_emp.id = approver_user.employee_id
    WHERE o.employee_id = $1
  `;
  const params = [employee_id];
  let paramIndex = 2;

  if (search) {
    query += ` AND o.reason ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    query += ` AND o.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  let countQuery = `SELECT COUNT(*) FROM overtime_requests WHERE employee_id = $1`;
  const countParams = [employee_id];
  let countIndex = 2;

  if (search) {
    countQuery += ` AND reason ILIKE $${countIndex}`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (status) {
    countQuery += ` AND status = $${countIndex}`;
    countParams.push(status);
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

// GET ALL OVERTIME REQUESTS (ADMIN/HR/APPROVERS)

const getAllOvertime = async (
  user_id,
  page,
  limit,
  search,
  status,
  date,
  userRole,
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      o.*,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      e.id AS employee_id,
      approver_emp.first_name || ' ' || approver_emp.last_name AS approved_by_name,
      EXISTS (
        SELECT 1 FROM employee_approvers ea
        WHERE ea.employee_id = o.employee_id
        AND ea.approver_id = $1
        AND ea.approval_type = 'OVERTIME'
      ) AS is_assigned_approver
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    LEFT JOIN users approver_user ON approver_user.id = o.approved_by
    LEFT JOIN employees approver_emp ON approver_emp.id = approver_user.employee_id
    WHERE 1=1
  `;

  const params = [user_id];
  let paramIndex = 2;

  // Filter by assigned employees for non-admin users
  const isAdmin =
    userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR";

  if (!isAdmin) {
    // For non-admin users (EMPLOYEE approvers), only show requests from employees they are assigned to
    query += ` AND EXISTS (
      SELECT 1 FROM employee_approvers ea
      WHERE ea.employee_id = o.employee_id
      AND ea.approver_id = $1
      AND ea.approval_type = 'OVERTIME'
    )`;
  }

  if (search) {
    query += ` AND (e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    query += ` AND o.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (date) {
    query += ` AND o.date = $${paramIndex}`;
    params.push(date);
    paramIndex++;
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  let countQuery = `
    SELECT COUNT(*) 
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    WHERE 1=1
  `;
  const countParams = [];
  let countIndex = 1;

  const isAdminForCount =
    userRole === "ADMIN" || userRole === "HR_ADMIN" || userRole === "HR";

  if (!isAdminForCount) {
    countQuery += ` AND EXISTS (
      SELECT 1 FROM employee_approvers ea
      WHERE ea.employee_id = o.employee_id
      AND ea.approver_id = $${countIndex}
      AND ea.approval_type = 'OVERTIME'
    )`;
    countParams.push(user_id);
    countIndex++;
  }

  if (search) {
    countQuery += ` AND (e.first_name ILIKE $${countIndex} OR e.last_name ILIKE $${countIndex} OR e.employee_code ILIKE $${countIndex})`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (status) {
    countQuery += ` AND o.status = $${countIndex}`;
    countParams.push(status);
    countIndex++;
  }

  if (date) {
    countQuery += ` AND o.date = $${countIndex}`;
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

// GET OVERTIME REQUEST DETAILS

const getOvertimeDetails = async (id, currentUserId = null) => {
  // Ensure currentUserId is null if empty string
  if (currentUserId === "" || currentUserId === undefined) {
    currentUserId = null;
  } else if (currentUserId) {
    currentUserId = Number(currentUserId);
    if (isNaN(currentUserId)) currentUserId = null;
  }

  const result = await pool.query(
    `SELECT 
      o.*,
      e.first_name || ' ' || e.last_name AS employee_name,
      e.employee_code,
      e.id AS employee_id,
      approver_emp.first_name || ' ' || approver_emp.last_name AS approved_by_name,
      rejected_emp.first_name || ' ' || rejected_emp.last_name AS rejected_by_name,
      CASE 
        WHEN $2::BIGINT IS NOT NULL THEN EXISTS (
          SELECT 1 FROM employee_approvers ea
          WHERE ea.employee_id = o.employee_id
          AND ea.approver_id = $2
          AND ea.approval_type = 'OVERTIME'
        )
        ELSE false
      END AS is_assigned_approver
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    LEFT JOIN users approver_user ON approver_user.id = o.approved_by
    LEFT JOIN employees approver_emp ON approver_emp.id = approver_user.employee_id
    LEFT JOIN users rejected_user ON rejected_user.id = o.rejected_by
    LEFT JOIN employees rejected_emp ON rejected_emp.id = rejected_user.employee_id
    WHERE o.id = $1`,
    [id, currentUserId],
  );

  if (result.rows.length === 0) {
    throw new Error("Overtime request not found");
  }

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
    WHERE al.request_type = 'OVERTIME' AND al.request_id = $1
    ORDER BY al.created_at ASC`,
    [id],
  );

  const overtime = result.rows[0];
  overtime.timeline = timeline.rows;

  return overtime;
};

// GET OVERTIME BASIC (LIGHTWEIGHT - NO JOINS)

const getOvertimeBasic = async (id) => {
  const result = await pool.query(
    `SELECT id, employee_id, status, is_paid, hours
     FROM overtime_requests
     WHERE id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Overtime request not found");
  }

  return result.rows[0];
};

// ==========================================
// APPROVE OVERTIME REQUEST
// ==========================================
const approveOvertime = async (id, approver_id, comment = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Added is_paid = FALSE safety check
    const result = await client.query(
      `UPDATE overtime_requests 
       SET status = 'APPROVED', 
           approved_by = $1, 
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $2 
         AND status = 'PENDING'
         AND is_paid = FALSE
       RETURNING *`,
      [approver_id, id],
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Overtime request not found, already processed, or already paid",
      );
    }

    // FIX: Use 'approved_by' instead of 'approver_id'
    await client.query(
      `INSERT INTO approval_logs (request_type, request_id, approved_by, action, remarks)
       VALUES ('OVERTIME', $1, $2, 'APPROVED', $3)`,
      [id, approver_id, comment],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ==========================================
// REJECT OVERTIME REQUEST
// ==========================================
const rejectOvertime = async (id, approver_id, reason) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Added is_paid = FALSE safety check
    const result = await client.query(
      `UPDATE overtime_requests 
       SET status = 'REJECTED', 
           rejected_by = $1, 
           rejected_at = NOW(),
           rejected_reason = $2,
           updated_at = NOW()
       WHERE id = $3 
         AND status = 'PENDING'
         AND is_paid = FALSE
       RETURNING *`,
      [approver_id, reason, id],
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Overtime request not found, already processed, or already paid",
      );
    }

    //  FIX: Use 'approved_by' instead of 'approver_id'
    await client.query(
      `INSERT INTO approval_logs (request_type, request_id, approved_by, action, remarks)
       VALUES ('OVERTIME', $1, $2, 'REJECTED', $3)`,
      [id, approver_id, reason],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// CHECK IF USER CAN APPROVE (UPDATED)

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

  // For EMPLOYEE role, check if they are assigned as approver for this specific employee
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

// GET OVERTIME HOURS FOR PAYROLL (UNPAID ONLY)

const getOvertimeHoursForPayroll = async (
  employee_id,
  start_date,
  end_date,
) => {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(hours), 0) AS total_hours,
      COUNT(*) AS total_requests,
      ARRAY_AGG(id) AS request_ids
    FROM overtime_requests
    WHERE employee_id = $1
      AND status = 'APPROVED'
      AND is_paid = FALSE
      AND date BETWEEN $2 AND $3`,
    [employee_id, start_date, end_date],
  );

  return {
    total_hours: parseFloat(result.rows[0].total_hours),
    total_requests: parseInt(result.rows[0].total_requests),
    request_ids: result.rows[0].request_ids || [],
  };
};

// MARK OVERTIME AS PAID (AFTER PAYROLL)

const markOvertimeAsPaid = async (
  employee_id,
  start_date,
  end_date,
  payroll_id = null,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE overtime_requests 
       SET is_paid = TRUE,
           paid_in_payroll_id = $4,
           paid_at = NOW()
       WHERE employee_id = $1
         AND status = 'APPROVED'
         AND is_paid = FALSE
         AND date BETWEEN $2 AND $3
       RETURNING id, hours`,
      [employee_id, start_date, end_date, payroll_id],
    );

    await client.query("COMMIT");

    return {
      marked_count: result.rowCount,
      total_hours_marked: result.rows.reduce(
        (sum, row) => sum + parseFloat(row.hours),
        0,
      ),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// GET OVERTIME SUMMARY FOR PAYROLL PREVIEW

const getOvertimeSummaryForPayroll = async (start_date, end_date) => {
  const result = await pool.query(
    `SELECT 
      employee_id,
      COALESCE(SUM(hours), 0) AS total_hours,
      COUNT(*) AS total_requests,
      ARRAY_AGG(id) AS request_ids
    FROM overtime_requests
    WHERE status = 'APPROVED'
      AND is_paid = FALSE
      AND date BETWEEN $1 AND $2
    GROUP BY employee_id
    ORDER BY employee_id`,
    [start_date, end_date],
  );

  return result.rows;
};

// EMPLOYEE APPROVERS CRUD

const getApprovers = async (page, limit, search, type) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT 
      ea.*,
      e1.first_name || ' ' || e1.last_name AS employee_name,
      e1.employee_code,
      e2.first_name || ' ' || e2.last_name AS approver_name,
      e2.employee_code AS approver_code
    FROM employee_approvers ea
    JOIN employees e1 ON e1.id = ea.employee_id
    JOIN users u ON u.id = ea.approver_id
    JOIN employees e2 ON e2.id = u.employee_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (e1.first_name ILIKE $${paramIndex} OR e1.last_name ILIKE $${paramIndex} OR e1.employee_code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (type) {
    query += ` AND ea.approval_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  query += ` ORDER BY e1.first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  let countQuery = `SELECT COUNT(*) FROM employee_approvers ea JOIN employees e1 ON e1.id = ea.employee_id WHERE 1=1`;
  const countParams = [];
  let countIndex = 1;

  if (search) {
    countQuery += ` AND (e1.first_name ILIKE $${countIndex} OR e1.last_name ILIKE $${countIndex} OR e1.employee_code ILIKE $${countIndex})`;
    countParams.push(`%${search}%`);
    countIndex++;
  }

  if (type) {
    countQuery += ` AND ea.approval_type = $${countIndex}`;
    countParams.push(type);
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

const createApprover = async (data) => {
  const { employee_id, approver_id, approval_type } = data;

  //  Convert employee_id to user.id
  // The frontend sends approver_id as employee.id, but we need user.id
  const userResult = await pool.query(
    `SELECT id FROM users WHERE employee_id = $1`,
    [approver_id],
  );

  if (userResult.rows.length === 0) {
    throw new Error(
      "Approver user not found. Please ensure this employee has a user account.",
    );
  }

  const approver_user_id = userResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO employee_approvers (employee_id, approver_id, approval_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (employee_id, approval_type) 
     DO UPDATE SET approver_id = EXCLUDED.approver_id
     RETURNING *`,
    [employee_id, approver_user_id, approval_type],
  );

  return result.rows[0];
};

const updateApprover = async (id, data) => {
  const { employee_id, approver_id, approval_type } = data;

  //  Convert employee_id to user.id
  const userResult = await pool.query(
    `SELECT id FROM users WHERE employee_id = $1`,
    [approver_id],
  );

  if (userResult.rows.length === 0) {
    throw new Error(
      "Approver user not found. Please ensure this employee has a user account.",
    );
  }

  const approver_user_id = userResult.rows[0].id;

  const result = await pool.query(
    `UPDATE employee_approvers 
     SET employee_id = $1, approver_id = $2, approval_type = $3
     WHERE id = $4
     RETURNING *`,
    [employee_id, approver_user_id, approval_type, id],
  );

  return result.rows[0];
};

const deleteApprover = async (id) => {
  await pool.query(`DELETE FROM employee_approvers WHERE id = $1`, [id]);
  return { message: "Approver mapping deleted" };
};

const getEmployeesForDropdown = async () => {
  const result = await pool.query(`
    SELECT 
      e.id,
      e.first_name || ' ' || e.last_name AS name,
      e.employee_code,
      e.department
    FROM employees e
    JOIN users u ON u.employee_id = e.id
    WHERE u.role = 'EMPLOYEE'
      AND e.status = 'ACTIVE'
    ORDER BY e.first_name, e.last_name
  `);

  return result.rows;
};

const isApprover = async (user_id) => {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT 1 FROM employee_approvers 
      WHERE approver_id = $1
      LIMIT 1
    ) as is_approver`,
    [user_id],
  );

  return result.rows[0].is_approver;
};

module.exports = {
  createOvertime,
  getMyOvertime,
  getAllOvertime,
  getOvertimeDetails,
  getOvertimeBasic,
  approveOvertime,
  rejectOvertime,
  canApprove,
  getOvertimeHoursForPayroll,
  markOvertimeAsPaid,
  getOvertimeSummaryForPayroll,
  getApprovers,
  createApprover,
  updateApprover,
  deleteApprover,
  getEmployeesForDropdown,
  isApprover,
};
