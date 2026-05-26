const pool = require("../config/db");

const ANOMALY_TYPES = [
  "REPEATED_LATE",
  "EXCESSIVE_OVERTIME",
  "ABSENT_WITHOUT_LEAVE",
  "OVERTIME_SPIKE",
  "PAYROLL_SPIKE",
  "REPEATED_TIME_MODIFICATION",
  "FREQUENT_UNDERTIME",
  "CHECKOUT_WITHOUT_CHECKIN",
  "REPEATED_MISSING_CHECKOUT",
  "ABNORMAL_LEAVE_FREQUENCY",
  "BRANCH_HIGH_ABSENCE",
  "REJECTED_LEAVE_FOLLOWED_BY_ABSENCE",
  "LEAVE_AROUND_ABSENCE",
  "REJECTED_OVERTIME_REPEATED",
  "MANHOUR_OVERLAP",
  "MANHOUR_EXCEEDS_EXPECTED",
  "MANHOUR_REPEATED_EDITS",
  "REJECTED_TIME_MODIFICATION_REPEATED",
];

const SOURCE_MODULES = [
  "attendance",
  "overtime",
  "payroll",
  "leaves",
  "man_hours",
  "time_modification",
];

const createAnomaly = async ({
  employee_id,
  branch_id,
  anomaly_type,
  source_module,
  severity,
  title,
  description,
  detected_value,
  expected_value,
  metadata,
}) => {
  const query = `
    INSERT INTO anomaly_logs
      (employee_id, branch_id, anomaly_type, source_module, severity, title, description, detected_value, expected_value, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [
    employee_id,
    branch_id || null,
    anomaly_type,
    source_module,
    severity,
    title,
    description || null,
    detected_value ? String(detected_value) : null,
    expected_value ? String(expected_value) : null,
    metadata ? JSON.stringify(metadata) : "{}",
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const findExistingOpenAnomaly = async ({
  employee_id,
  anomaly_type,
  source_module,
  since_date,
}) => {
  const query = `
    SELECT * FROM anomaly_logs
    WHERE employee_id = $1
      AND anomaly_type = $2
      AND source_module = $3
      AND status = 'OPEN'
      AND detected_at >= $4::timestamptz
    LIMIT 1;
  `;

  const result = await pool.query(query, [
    employee_id,
    anomaly_type,
    source_module,
    since_date,
  ]);
  return result.rows[0] || null;
};

const getAnomalies = async ({
  page = 1,
  limit = 10,
  status,
  severity,
  branch_id,
  employee_id,
  anomaly_type,
  source_module,
  date_from,
  date_to,
  allowedBranchIds,
}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`a.status = $${paramIndex++}`);
    params.push(status);
  }

  if (severity) {
    conditions.push(`a.severity = $${paramIndex++}`);
    params.push(severity);
  }

  if (branch_id) {
    conditions.push(`a.branch_id = $${paramIndex++}`);
    params.push(branch_id);
  }

  if (employee_id) {
    conditions.push(`a.employee_id = $${paramIndex++}`);
    params.push(employee_id);
  }

  if (anomaly_type) {
    conditions.push(`a.anomaly_type = $${paramIndex++}`);
    params.push(anomaly_type);
  }

  if (source_module) {
    conditions.push(`a.source_module = $${paramIndex++}`);
    params.push(source_module);
  }

  if (date_from) {
    conditions.push(`a.detected_at >= $${paramIndex++}::date`);
    params.push(date_from);
  }

  if (date_to) {
    conditions.push(`a.detected_at <= $${paramIndex++}::date + interval '1 day'`);
    params.push(date_to);
  }

  if (allowedBranchIds !== null && Array.isArray(allowedBranchIds)) {
    if (allowedBranchIds.length === 0) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
    conditions.push(`a.branch_id = ANY($${paramIndex++}::int[])`);
    params.push(allowedBranchIds);
  }

  const whereClause =
    conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const dataQuery = `
    SELECT
      a.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      b.name AS branch_name,
      ru.username AS reviewer_name,
      rru.username AS resolver_name
    FROM anomaly_logs a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = a.branch_id
    LEFT JOIN users ru ON ru.id = a.reviewed_by
    LEFT JOIN users rru ON rru.id = a.resolved_by
    ${whereClause}
    ORDER BY a.detected_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;

  params.push(limit, offset);

  const result = await pool.query(dataQuery, params);

  const countParams = params.slice(0, -2);
  const countQuery = `
    SELECT COUNT(*)
    FROM anomaly_logs a
    ${whereClause};
  `;

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  const rows = result.rows.map((row) => ({
    ...row,
    employee_name:
      row.first_name && row.last_name
        ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.replace(/\s+/g, " ").trim()
        : `${row.first_name || ""} ${row.last_name || ""}`.trim(),
  }));

  return {
    data: rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAnomalyById = async (id) => {
  const query = `
    SELECT
      a.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      b.name AS branch_name,
      ru.username AS reviewer_name,
      rru.username AS resolver_name
    FROM anomaly_logs a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = a.branch_id
    LEFT JOIN users ru ON ru.id = a.reviewed_by
    LEFT JOIN users rru ON rru.id = a.resolved_by
    WHERE a.id = $1;
  `;

  const result = await pool.query(query, [id]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    employee_name:
      row.first_name && row.last_name
        ? `${row.first_name} ${row.middle_name || ""} ${row.last_name}${row.suffix ? `, ${row.suffix}` : ""}`.replace(/\s+/g, " ").trim()
        : `${row.first_name || ""} ${row.last_name || ""}`.trim(),
  };
};

const updateAnomalyStatus = async (id, status, userId) => {
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  setClauses.push(`status = $${paramIndex++}`);
  params.push(status);

  if (status === "REVIEWED") {
    setClauses.push(`reviewed_by = $${paramIndex++}`);
    setClauses.push(`reviewed_at = NOW()`);
    params.push(userId);
  }

  if (status === "RESOLVED") {
    setClauses.push(`resolved_by = $${paramIndex++}`);
    setClauses.push(`resolved_at = NOW()`);
    params.push(userId);
  }

  params.push(id);

  const query = `
    UPDATE anomaly_logs
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  const result = await pool.query(query, params);
  return result.rows[0] || null;
};

const getAnomalySummary = async ({ allowedBranchIds } = {}) => {
  let branchFilter = "";
  const params = [];
  let paramIndex = 1;

  if (allowedBranchIds !== null && Array.isArray(allowedBranchIds)) {
    if (allowedBranchIds.length === 0) {
      return {
        open_count: 0,
        high_severity_count: 0,
        today_detected_count: 0,
        resolved_count: 0,
      };
    }
    branchFilter = `AND a.branch_id = ANY($${paramIndex++}::int[])`;
    params.push(allowedBranchIds);
  }

  const query = `
    SELECT
      COUNT(*) FILTER (WHERE a.status = 'OPEN') AS open_count,
      COUNT(*) FILTER (WHERE a.severity = 'HIGH' AND a.status = 'OPEN') AS high_severity_count,
      COUNT(*) FILTER (WHERE a.detected_at::date = CURRENT_DATE) AS today_detected_count,
      COUNT(*) FILTER (WHERE a.status = 'RESOLVED') AS resolved_count
    FROM anomaly_logs a
    WHERE 1=1 ${branchFilter};
  `;

  const result = await pool.query(query, params);
  return {
    open_count: parseInt(result.rows[0].open_count) || 0,
    high_severity_count: parseInt(result.rows[0].high_severity_count) || 0,
    today_detected_count: parseInt(result.rows[0].today_detected_count) || 0,
    resolved_count: parseInt(result.rows[0].resolved_count) || 0,
  };
};

module.exports = {
  createAnomaly,
  findExistingOpenAnomaly,
  getAnomalies,
  getAnomalyById,
  updateAnomalyStatus,
  getAnomalySummary,
  ANOMALY_TYPES,
  SOURCE_MODULES,
};
