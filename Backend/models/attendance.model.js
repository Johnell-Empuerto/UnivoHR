const pool = require("../config/db");
const { getLocalDate } = require("../utils/date");
const logger = require("../utils/logger");

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
const getTodayRecord = async (employeeId, timestamp, timeZone = null) => {
  const localDate = getLocalDate(timestamp, timeZone);

  const query = `
    SELECT * FROM attendance
    WHERE employee_id = $1
    AND date = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [employeeId, localDate]);
  return result.rows[0];
};

// Get open attendance record (check-in without check-out) — used by night shift
const getOpenAttendanceRecord = async (employeeId) => {
  const query = `
    SELECT * FROM attendance
    WHERE employee_id = $1
    AND check_in_time IS NOT NULL
    AND check_out_time IS NULL
    ORDER BY check_in_time DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [employeeId]);
  return result.rows[0];
};

// CHECK IN
const checkIn = async (employeeId, timestamp, status, shiftId = null, shiftDate = null, source = 'BIOMETRIC', branchId = null, timezoneUsed = null, deviceId = null) => {
  logger.info({ employeeId, timestamp, status, shiftId, shiftDate, source, branchId, timezoneUsed, deviceId }, "CHECK-IN:");

  const localDate = getLocalDate(timestamp, timezoneUsed);

  const columns = ['employee_id', 'check_in_time', 'date', 'status', 'shift_id', 'shift_date', 'source'];
  const values = [employeeId, timestamp, localDate, status, shiftId, shiftDate || localDate, source];
  const placeholders = ['$1', '$2', '$3', '$4', '$5', '$6', '$7'];
  let idx = 8;

  // Compute UTC timestamp using PostgreSQL AT TIME ZONE (single, not double)
  // timestamp without tz AT TIME ZONE timezone → timestamptz
  let checkInUtc = null;
  if (timestamp) {
    const tz = timezoneUsed || 'Asia/Manila';
    const utcRes = await pool.query(
      `SELECT $1::timestamp AT TIME ZONE $2::varchar AS utc`,
      [timestamp, tz]
    );
    checkInUtc = utcRes.rows[0].utc;
  }

  if (checkInUtc != null) {
    columns.push('check_in_time_utc');
    placeholders.push(`$${idx++}`);
    values.push(checkInUtc);
  }

  if (branchId != null) {
    columns.push('branch_id');
    placeholders.push(`$${idx++}`);
    values.push(branchId);
  }
  if (timezoneUsed != null) {
    columns.push('timezone_used');
    placeholders.push(`$${idx++}`);
    values.push(timezoneUsed);
  }
  if (deviceId != null) {
    columns.push('device_id');
    placeholders.push(`$${idx++}`);
    values.push(deviceId);
  }

  const query = `
    INSERT INTO attendance (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// CHECK OUT
const checkOut = async (attendanceId, timestamp, branchId = null, timezoneUsed = null) => {
  const result = await pool.query(`SELECT * FROM attendance WHERE id = $1`, [
    attendanceId,
  ]);

  const record = result.rows[0];

  if (!record.check_in_time) return record;

  const checkIn = new Date(record.check_in_time);
  const checkOut = new Date(timestamp);

  const hoursWorked = (checkOut - checkIn) / 1000 / 60 / 60;

  let status = record.status;
  let work_fraction = 1;

  if (hoursWorked < 4) {
    status = "ABSENT";
    work_fraction = 0;
  } else if (hoursWorked < 8) {
    status = "HALF_DAY";
    work_fraction = 0.5;
  } else {
    work_fraction = 1;
  }

  // Compute UTC timestamp using PostgreSQL AT TIME ZONE (single, not double)
  let checkOutUtc = null;
  if (timestamp) {
    const tz = timezoneUsed || 'Asia/Manila';
    const utcRes = await pool.query(
      `SELECT $1::timestamp AT TIME ZONE $2::varchar AS utc`,
      [timestamp, tz]
    );
    checkOutUtc = utcRes.rows[0].utc;
  }

  const setClauses = ['check_out_time = $1', 'status = $2', 'work_fraction = $3'];
  const values = [timestamp, status, work_fraction, attendanceId];
  let paramIdx = 4;

  if (checkOutUtc != null) {
    paramIdx++;
    setClauses.push(`check_out_time_utc = $${paramIdx}`);
    values.push(checkOutUtc);
  }

  if (branchId != null) {
    paramIdx++;
    setClauses.push(`branch_id = $${paramIdx}`);
    values.push(branchId);
  }
  if (timezoneUsed != null) {
    paramIdx++;
    setClauses.push(`timezone_used = $${paramIdx}`);
    values.push(timezoneUsed);
  }

  const update = await pool.query(
    `UPDATE attendance SET ${setClauses.join(', ')} WHERE id = $4 RETURNING *`,
    values,
  );

  return update.rows[0];
};

// GET ALL ATTENDANCE
const getAttendance = async (
  page = 1,
  limit = 10,
  search = "",
  status = "",
  date = "",
  branch_id = "",
  allowedBranchIds = null,
) => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  const isUnrestricted = allowedBranchIds === null;
  let dataBranchClause = "";
  let countBranchClause = "";
  let branchParams = [];

  if (!isUnrestricted && Array.isArray(allowedBranchIds)) {
    if (allowedBranchIds.length === 0) {
      dataBranchClause = "AND 1=0";
      countBranchClause = "AND 1=0";
    } else {
      branchParams = [allowedBranchIds];
      dataBranchClause = `AND e.branch_id = ANY($6)`;
      countBranchClause = `AND e.branch_id = ANY($4)`;
    }
  }

  const dataQuery = await pool.query(
    `
    SELECT
      a.id,
      a.employee_id,
      a.check_in_time,
      a.check_out_time,
      a.check_in_time_utc,
      a.check_out_time_utc,
      a.timezone_used,
      a.branch_id AS attendance_branch_id,
      a.device_id,
      a.source,
      a.date,
      a.status,
      a.work_fraction,
      a.half_day_type,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      b.name AS branch_name
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN users u ON u.employee_id = e.id
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE
      (
        e.first_name ILIKE $3 OR
        e.last_name ILIKE $3 OR
        e.employee_code ILIKE $3 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
      )
      AND ($4 = '' OR a.status = $4)
      AND ($5 = '' OR a.date = $5::date)
      ${dataBranchClause}
    ORDER BY a.date DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchValue, status, date, ...branchParams],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN users u ON u.employee_id = e.id
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE
      (
        e.first_name ILIKE $1 OR
        e.last_name ILIKE $1 OR
        e.employee_code ILIKE $1 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
      )
      AND ($2 = '' OR a.status = $2)
      AND ($3 = '' OR a.date = $3::date)
      ${countBranchClause}
    `,
    [searchValue, status, date, ...branchParams],
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
const getByEmployee = async (employeeId, date = "") => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.employee_id,
      a.check_in_time,
      a.check_out_time,
      a.check_in_time_utc,
      a.check_out_time_utc,
      a.timezone_used,
      a.branch_id AS attendance_branch_id,
      a.device_id,
      a.source,
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
    AND ($2 = '' OR a.date = $2::date)
    ORDER BY a.date DESC
  `,
    [employeeId, date],
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
    "SELECT date::text, timezone_used, branch_id FROM attendance WHERE id = $1",
    [attendanceId],
  );

  const attendance = attendanceResult.rows[0];
  if (!attendance) throw new Error("Attendance not found");

  const dateStr = attendance.date;

  const toLocal = (time) => {
    if (!time) return null;

    if (time.includes("T")) return time;

    let cleanTime = time;

    if (time.split(":").length === 3) {
      cleanTime = time;
    } else {
      cleanTime = `${time}:00`;
    }

    return `${dateStr}T${cleanTime}`;
  };

  const fullCheckIn = toLocal(checkIn);
  const fullCheckOut = toLocal(checkOut);

  logger.info({ fullCheckIn, fullCheckOut }, "LOCAL VALUES:");

  // Resolve timezone for UTC conversion
  const tz =
    attendance.timezone_used ||
    (attendance.branch_id
      ? (await pool.query(
          "SELECT timezone FROM branches WHERE id = $1",
          [attendance.branch_id],
        )).rows[0]?.timezone
      : null) ||
    (await pool.query(
      "SELECT value FROM system_settings WHERE key = 'company_timezone'",
    )).rows[0]?.value ||
    'Asia/Manila';

  // Compute UTC timestamps using PostgreSQL AT TIME ZONE
  let checkInUtc = null;
  if (fullCheckIn) {
    const utcRes = await pool.query(
      `SELECT $1::timestamp AT TIME ZONE $2::varchar AS utc`,
      [fullCheckIn, tz],
    );
    checkInUtc = utcRes.rows[0].utc;
  }

  let checkOutUtc = null;
  if (fullCheckOut) {
    const utcRes = await pool.query(
      `SELECT $1::timestamp AT TIME ZONE $2::varchar AS utc`,
      [fullCheckOut, tz],
    );
    checkOutUtc = utcRes.rows[0].utc;
  }

  // GET RULES
  const rulesResult = await pool.query(
    `SELECT * FROM attendance_rules WHERE is_active = true LIMIT 1`,
  );

  const rules = rulesResult.rows[0];

  let status = "PRESENT";

  if (rules && fullCheckIn) {
    const checkInDate = new Date(fullCheckIn);
    const shiftStart = new Date(`${dateStr}T08:00:00`);

    const lateMinutes = (checkInDate - shiftStart) / 1000 / 60;

    if (lateMinutes > rules.late_threshold) {
      status = "LATE";
    }
  }

  const setClauses = ['check_in_time = $2', 'check_out_time = $3', 'status = $4'];
  const updateValues = [attendanceId, fullCheckIn, fullCheckOut, status];
  let paramIdx = 5;

  // Mark as manually modified
  setClauses.push(`source = $${paramIdx++}`);
  updateValues.push('MANUAL');

  // Persist the resolved timezone
  if (tz) {
    setClauses.push(`timezone_used = $${paramIdx++}`);
    updateValues.push(tz);
  }

  if (checkInUtc != null) {
    setClauses.push(`check_in_time_utc = $${paramIdx++}`);
    updateValues.push(checkInUtc);
  }
  if (checkOutUtc != null) {
    setClauses.push(`check_out_time_utc = $${paramIdx++}`);
    updateValues.push(checkOutUtc);
  }

  const query = `
    UPDATE attendance
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, updateValues);

  return result.rows[0];
};

module.exports = {
  getTodayRecord,
  getOpenAttendanceRecord,
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
