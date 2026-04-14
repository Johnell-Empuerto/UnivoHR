const pool = require("../config/db");
const { getLocalDate } = require("../utils/date");

// Helper function to generate date range
const generateDateRange = (from, to) => {
  const dates = [];
  let current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    dates.push(new Date(current).toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// Helper function to validate and normalize half-day type
const validateAndNormalizeHalfDayType = (dayFraction, halfDayType) => {
  if (dayFraction === 0.5) {
    if (!halfDayType) {
      throw new Error(
        "Half-day type (MORNING/AFTERNOON) is required for half-day leave",
      );
    }
    const normalized = halfDayType.toUpperCase();
    if (!["MORNING", "AFTERNOON"].includes(normalized)) {
      throw new Error(
        "Invalid half-day type. Must be 'MORNING' or 'AFTERNOON'",
      );
    }
    return normalized;
  }
  return null;
};

// Get today's record
const getTodayRecord = async (employeeId, timestamp) => {
  const localDate = getLocalDate(timestamp);

  const query = `
    SELECT * FROM attendance
    WHERE employee_id = $1
    AND date = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [employeeId, localDate]);
  return result.rows[0];
};

// CHECK IN
const checkIn = async (employeeId, timestamp, status) => {
  console.log("CHECK-IN:", { employeeId, timestamp, status });

  const query = `
    INSERT INTO attendance (employee_id, check_in_time, date, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const localDate = getLocalDate(timestamp);
  const values = [employeeId, timestamp, localDate, status];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// CHECK OUT
const checkOut = async (attendanceId, timestamp) => {
  console.log("CHECK-OUT:", { attendanceId, timestamp });

  const query = `
    UPDATE attendance
    SET check_out_time = $1
    WHERE id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [timestamp, attendanceId]);
  return result.rows[0];
};

// GET ALL ATTENDANCE
const getAttendance = async (
  page = 1,
  limit = 10,
  search = "",
  status = "",
  date = "",
) => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const dataQuery = await pool.query(
    `
    SELECT
      a.id,
      a.employee_id,
      a.check_in_time,
      a.check_out_time,
      a.date,
      a.status,
      a.work_fraction,
      a.half_day_type,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN users u ON u.employee_id = e.id
    WHERE
      u.role != 'ADMIN'
      AND (
        e.first_name ILIKE $3 OR
        e.last_name ILIKE $3 OR
        e.employee_code ILIKE $3 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
      )
      AND ($4 = '' OR a.status = $4)
      AND ($5 = '' OR a.date = $5::date)
    ORDER BY a.date DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchValue, status, date],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN users u ON u.employee_id = e.id
    WHERE
      u.role != 'ADMIN'
      AND (
        e.first_name ILIKE $1 OR
        e.last_name ILIKE $1 OR
        e.employee_code ILIKE $1 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
      )
      AND ($2 = '' OR a.status = $2)
      AND ($3 = '' OR a.date = $3::date)
    `,
    [searchValue, status, date],
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

// GET BY EMPLOYEE
const getByEmployee = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.employee_id,
      a.check_in_time,
      a.check_out_time,
      a.date,
      a.status,
      a.work_fraction,
      a.half_day_type,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.employee_id = $1
    ORDER BY a.date DESC
  `,
    [employeeId],
  );

  return result.rows;
};

// Get attendance by ID
const getAttendanceById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      a.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.id = $1
    `,
    [id],
  );
  return result.rows[0];
};

// FIXED: Mark as leave using LEAVE status (not HALF_DAY)
const markAsLeave = async (
  employeeId,
  fromDate,
  toDate,
  dayFraction = 1,
  halfDayType = null,
  client = null,
) => {
  const db = client || pool;

  // Validate and normalize half-day type
  const normalizedHalfDayType = validateAndNormalizeHalfDayType(
    dayFraction,
    halfDayType,
  );

  if (dayFraction === 0.5 && normalizedHalfDayType) {
    // Handle multi-day half-day leave
    const workFraction = 0.5;
    const dates = generateDateRange(fromDate, toDate);

    for (const date of dates) {
      //FIXED: Use 'LEAVE' status, not 'HALF_DAY'
      await db.query(
        `
        UPDATE attendance
        SET status = 'LEAVE',
            work_fraction = $3,
            half_day_type = $4
        WHERE employee_id = $1
        AND date = $2
        `,
        [employeeId, date, workFraction, normalizedHalfDayType],
      );

      // FIXED: Use 'LEAVE' status in INSERT as well
      await db.query(
        `
        INSERT INTO attendance (employee_id, date, status, work_fraction, half_day_type)
        SELECT $1, $2::date, 'LEAVE', $3, $4
        WHERE NOT EXISTS (
          SELECT 1 FROM attendance a
          WHERE a.employee_id = $1 AND a.date = $2::date
        )
        `,
        [employeeId, date, workFraction, normalizedHalfDayType],
      );
    }
  } else {
    // Full day leave
    await db.query(
      `
      UPDATE attendance
      SET status = 'LEAVE',
          work_fraction = 0,
          half_day_type = NULL
      WHERE employee_id = $1
      AND date BETWEEN $2 AND $3
      `,
      [employeeId, fromDate, toDate],
    );

    // Insert missing dates
    const insertQuery = `
      INSERT INTO attendance (employee_id, date, status, work_fraction, half_day_type)
      SELECT $1, d::date, 'LEAVE', 0, NULL
      FROM generate_series($2::date, $3::date, interval '1 day') d
      WHERE NOT EXISTS (
        SELECT 1 FROM attendance a
        WHERE a.employee_id = $1 AND a.date = d::date
      )
    `;
    await db.query(insertQuery, [employeeId, fromDate, toDate]);
  }

  return { success: true };
};

// GET RULES
const getRules = async () => {
  const result = await pool.query(`
    SELECT * FROM attendance_rules
    WHERE is_active = true
    LIMIT 1
  `);
  return result.rows[0];
};

const updateRules = async (data) => {
  const {
    late_threshold,
    grace_period,
    max_work_hours,
    late_deduction_type,
    late_deduction_value,
    late_deduction_enabled,
  } = data;

  const result = await pool.query(
    `
    UPDATE attendance_rules
    SET
      late_threshold = $1,
      grace_period = $2,
      max_work_hours = $3,
      late_deduction_type = $4,
      late_deduction_value = $5,
      late_deduction_enabled = $6
    WHERE id = (
      SELECT id FROM attendance_rules ORDER BY id DESC LIMIT 1
    )
    RETURNING *
  `,
    [
      late_threshold,
      grace_period,
      max_work_hours,
      late_deduction_type,
      late_deduction_value,
      late_deduction_enabled,
    ],
  );

  return result.rows[0];
};

// GET ALL RULES
const getAllRules = async () => {
  const result = await pool.query(`
    SELECT * FROM attendance_rules
    ORDER BY created_at DESC
  `);
  return result.rows;
};

// CREATE RULE
const createRule = async (data) => {
  const {
    late_threshold,
    grace_period,
    max_work_hours,
    late_deduction_type,
    late_deduction_value,
    late_deduction_enabled,
  } = data;

  const result = await pool.query(
    `
    INSERT INTO attendance_rules (
      late_threshold,
      grace_period,
      max_work_hours,
      late_deduction_type,
      late_deduction_value,
      late_deduction_enabled
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
  `,
    [
      late_threshold,
      grace_period,
      max_work_hours,
      late_deduction_type,
      late_deduction_value,
      late_deduction_enabled,
    ],
  );

  return result.rows[0];
};

// SET ACTIVE RULE
const setActiveRule = async (id) => {
  await pool.query(`UPDATE attendance_rules SET is_active = false`);

  const result = await pool.query(
    `UPDATE attendance_rules SET is_active = true WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};

// DELETE RULE
const deleteRule = async (id) => {
  const result = await pool.query(
    `DELETE FROM attendance_rules WHERE id = $1 RETURNING *`,
    [id],
  );

  return result.rows[0];
};

// UPDATE RULE
const updateRule = async (id, data) => {
  const {
    late_threshold,
    grace_period,
    max_work_hours,
    late_deduction_type,
    late_deduction_value,
    late_deduction_enabled,
  } = data;

  const result = await pool.query(
    `
    UPDATE attendance_rules
    SET
      late_threshold = $1,
      grace_period = $2,
      max_work_hours = $3,
      late_deduction_type = $4,
      late_deduction_value = $5,
      late_deduction_enabled = $6
    WHERE id = $7
    RETURNING *
  `,
    [
      late_threshold,
      grace_period,
      max_work_hours,
      late_deduction_type,
      late_deduction_value,
      late_deduction_enabled,
      id,
    ],
  );

  return result.rows[0];
};

// CREATE TIME MODIFICATION REQUEST
const createTimeModificationRequest = async (data) => {
  const {
    employee_id,
    attendance_id,
    requested_check_in,
    requested_check_out,
    reason,
  } = data;

  const query = `
    INSERT INTO time_modification_requests
      (employee_id, attendance_id, requested_check_in, requested_check_out, reason, status)
    VALUES ($1, $2, $3, $4, $5, 'PENDING')
    RETURNING *;
  `;

  const result = await pool.query(query, [
    employee_id,
    attendance_id,
    requested_check_in,
    requested_check_out,
    reason,
  ]);

  return result.rows[0];
};

// GET ALL TIME MODIFICATION REQUESTS (for admin/HR)
const getTimeModificationRequests = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `
    SELECT
      tmr.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      a.date as attendance_date,
      a.check_in_time as original_check_in,
      a.check_out_time as original_check_out
    FROM time_modification_requests tmr
    JOIN employees e ON e.id = tmr.employee_id
    JOIN attendance a ON a.id = tmr.attendance_id
    ORDER BY tmr.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM time_modification_requests`,
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

// GET MY TIME MODIFICATION REQUESTS
const getMyTimeModificationRequests = async (employeeId) => {
  const result = await pool.query(
    `
    SELECT
      tmr.*,
      a.date as attendance_date,
      a.check_in_time as original_check_in,
      a.check_out_time as original_check_out,
      reviewer.first_name as reviewer_first_name,
      reviewer.last_name as reviewer_last_name
    FROM time_modification_requests tmr
    JOIN attendance a ON a.id = tmr.attendance_id
    LEFT JOIN users ru ON ru.id = tmr.reviewed_by
    LEFT JOIN employees reviewer ON reviewer.id = ru.employee_id
    WHERE tmr.employee_id = $1
    ORDER BY tmr.created_at DESC
    `,
    [employeeId],
  );

  return result.rows.map((row) => ({
    ...row,
    reviewer_name: row.reviewer_first_name
      ? `${row.reviewer_first_name} ${row.reviewer_last_name || ""}`.trim()
      : null,
  }));
};

// GET TIME MODIFICATION REQUEST BY ID
const getTimeModificationRequestById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      tmr.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      a.date as attendance_date,
      a.check_in_time as original_check_in,
      a.check_out_time as original_check_out
    FROM time_modification_requests tmr
    JOIN employees e ON e.id = tmr.employee_id
    JOIN attendance a ON a.id = tmr.attendance_id
    WHERE tmr.id = $1
    `,
    [id],
  );

  const row = result.rows[0];
  if (row) {
    row.employee_name =
      row.first_name && row.last_name
        ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.trim()
        : `${row.first_name || ""} ${row.last_name || ""}`.trim();
  }

  return row;
};

// UPDATE TIME MODIFICATION REQUEST STATUS
const updateTimeModificationStatus = async (
  id,
  status,
  reviewedBy,
  rejectionReason = null,
) => {
  let query;
  let values;

  if (status === "REJECTED" && rejectionReason) {
    query = `
      UPDATE time_modification_requests
      SET
        status = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        rejection_reason = $3
      WHERE id = $4
      RETURNING *;
    `;
    values = [status, reviewedBy, rejectionReason, id];
  } else {
    query = `
      UPDATE time_modification_requests
      SET
        status = $1,
        reviewed_by = $2,
        reviewed_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    values = [status, reviewedBy, id];
  }

  const result = await pool.query(query, values);
  return result.rows[0];
};

// CHECK FOR EXISTING PENDING REQUEST
const hasPendingTimeRequest = async (employeeId, attendanceId) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) as count
    FROM time_modification_requests
    WHERE employee_id = $1
      AND attendance_id = $2
      AND status = 'PENDING'
    `,
    [employeeId, attendanceId],
  );

  return parseInt(result.rows[0].count) > 0;
};

// APPLY APPROVED TIME MODIFICATION TO ATTENDANCE
const applyTimeModification = async (attendanceId, checkIn, checkOut) => {
  const attendanceResult = await pool.query(
    "SELECT date FROM attendance WHERE id = $1",
    [attendanceId],
  );

  const attendance = attendanceResult.rows[0];
  if (!attendance) throw new Error("Attendance not found");

  //FORCE ISO DATE
  const dateOnly = new Date(attendance.date).toISOString().split("T")[0];

  const toISO = (time) => {
    if (!time) return null;

    // Already full ISO
    if (time.includes("T")) return time;

    // Normalize time (remove seconds if already present)
    let cleanTime = time;

    if (time.split(":").length === 3) {
      // already HH:mm:ss
      cleanTime = time;
    } else {
      // HH:mm → add seconds
      cleanTime = `${time}:00`;
    }

    const isoString = `${dateOnly}T${cleanTime}`;

    const dateObj = new Date(isoString);

    if (isNaN(dateObj.getTime())) {
      console.error("INVALID DATE:", isoString);
      throw new Error("Invalid time value");
    }

    return dateObj.toISOString();
  };

  const fullCheckIn = toISO(checkIn);
  const fullCheckOut = toISO(checkOut);

  console.log("ISO VALUES:", { fullCheckIn, fullCheckOut });

  // GET RULES
  const rulesResult = await pool.query(
    `SELECT * FROM attendance_rules WHERE is_active = true LIMIT 1`,
  );

  const rules = rulesResult.rows[0];

  let status = "PRESENT";

  if (rules && fullCheckIn) {
    const checkInDate = new Date(fullCheckIn);

    // SHIFT START in ISO
    const shiftStart = new Date(`${dateOnly}T08:00:00.000Z`);

    const lateMinutes = (checkInDate - shiftStart) / 1000 / 60;

    if (lateMinutes > rules.late_threshold) {
      status = "LATE";
    }
  }

  const query = `
    UPDATE attendance
    SET
      check_in_time = $2,
      check_out_time = $3,
      status = $4
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [
    attendanceId,
    fullCheckIn,
    fullCheckOut,
    status,
  ]);

  return result.rows[0];
};

module.exports = {
  getTodayRecord,
  checkIn,
  checkOut,
  getAttendance,
  getByEmployee,
  getAttendanceById,
  markAsLeave,
  getRules,
  updateRules,
  getAllRules,
  deleteRule,
  setActiveRule,
  createRule,
  updateRule,
  createTimeModificationRequest,
  getTimeModificationRequests,
  getMyTimeModificationRequests,
  getTimeModificationRequestById,
  updateTimeModificationStatus,
  hasPendingTimeRequest,
  applyTimeModification,
};
