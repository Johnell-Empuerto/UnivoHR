const pool = require("../config/db");
const { getUserBranchIds } = require("../utils/branchAccess");

const buildScope = (user, params) => {
  let idx = params.length + 1;
  let clause = "";
  if (user.role !== "ADMIN") {
    return { clause: `AND e.branch_id = ANY($${idx}::int[])`, params: [] };
  }
  return { clause: "", params: [] };
};

const getDrillDownAttendance = async (user, { status, date_from, date_to, branch_id, employee_id, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }
  if (date_from) { conditions.push(`a.date >= $${idx++}::date`); params.push(date_from); }
  if (date_to) { conditions.push(`a.date <= $${idx++}::date`); params.push(date_to); }
  if (branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (employee_id) { conditions.push(`a.employee_id = $${idx++}`); params.push(employee_id); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`e.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT a.id, a.employee_id, a.date, a.status, a.check_in_time, a.check_out_time,
           e.first_name, e.last_name, e.employee_code, b.name AS branch_name
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY a.date DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getDrillDownPayroll = async (user, { cutoff_start, cutoff_end, branch_id, employee_id, min_net, max_net, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (cutoff_start) { conditions.push(`p.cutoff_start = $${idx++}::date`); params.push(cutoff_start); }
  if (cutoff_end) { conditions.push(`p.cutoff_end = $${idx++}::date`); params.push(cutoff_end); }
  if (branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (employee_id) { conditions.push(`p.employee_id = $${idx++}`); params.push(employee_id); }
  if (min_net) { conditions.push(`p.net_salary >= $${idx++}`); params.push(min_net); }
  if (max_net) { conditions.push(`p.net_salary <= $${idx++}`); params.push(max_net); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`e.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT p.id, p.employee_id, p.cutoff_start, p.cutoff_end, p.net_salary, p.deductions, p.status,
           e.first_name, e.last_name, e.employee_code, b.name AS branch_name
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY p.cutoff_end DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getDrillDownOvertime = async (user, { date_from, date_to, branch_id, employee_id, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (date_from) { conditions.push(`o.date >= $${idx++}::date`); params.push(date_from); }
  if (date_to) { conditions.push(`o.date <= $${idx++}::date`); params.push(date_to); }
  if (branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (employee_id) { conditions.push(`o.employee_id = $${idx++}`); params.push(employee_id); }
  if (status) { conditions.push(`o.status = $${idx++}`); params.push(status); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`e.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT o.id, o.employee_id, o.date, o.hours, o.status, o.reason,
           e.first_name, e.last_name, e.employee_code, b.name AS branch_name
    FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY o.date DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM overtime_requests o
    JOIN employees e ON e.id = o.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getDrillDownLeaves = async (user, { date_from, date_to, branch_id, employee_id, status, type, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (date_from) { conditions.push(`l.from_date >= $${idx++}::date`); params.push(date_from); }
  if (date_to) { conditions.push(`l.to_date <= $${idx++}::date`); params.push(date_to); }
  if (branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (employee_id) { conditions.push(`l.employee_id = $${idx++}`); params.push(employee_id); }
  if (status) { conditions.push(`l.status = $${idx++}`); params.push(status); }
  if (type) { conditions.push(`l.type = $${idx++}`); params.push(type); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`e.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT l.id, l.employee_id, l.type, l.from_date, l.to_date, l.status, l.reason,
           e.first_name, e.last_name, e.employee_code, b.name AS branch_name
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY l.from_date DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getDrillDownAnomalies = async (user, { date_from, date_to, branch_id, employee_id, severity, status, anomaly_type, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (date_from) { conditions.push(`a.detected_at >= $${idx++}::date`); params.push(date_from); }
  if (date_to) { conditions.push(`a.detected_at <= $${idx++}::date + interval '1 day'`); params.push(date_to); }
  if (branch_id) { conditions.push(`a.branch_id = $${idx++}`); params.push(branch_id); }
  if (employee_id) { conditions.push(`a.employee_id = $${idx++}`); params.push(employee_id); }
  if (severity) { conditions.push(`a.severity = $${idx++}`); params.push(severity); }
  if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }
  if (anomaly_type) { conditions.push(`a.anomaly_type = $${idx++}`); params.push(anomaly_type); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`a.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT a.*, e.first_name, e.last_name, e.employee_code, b.name AS branch_name
    FROM anomaly_logs a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = a.branch_id
    ${where}
    ORDER BY a.detected_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM anomaly_logs a
    JOIN employees e ON e.id = a.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getDrillDownBranch = async (user, { branch_id, date_from, date_to, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (branch_id) { conditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (date_from) { conditions.push(`a.date >= $${idx++}::date`); params.push(date_from); }
  if (date_to) { conditions.push(`a.date <= $${idx++}::date`); params.push(date_to); }

  if (user.role !== "ADMIN") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    conditions.push(`e.branch_id = ANY($${idx++}::int[])`);
    params.push(branchIds);
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const data = await pool.query(`
    SELECT e.branch_id, b.name AS branch_name,
           COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
           COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
           COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
           COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS on_leave,
           COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    GROUP BY e.branch_id, b.name
    ORDER BY b.name
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(DISTINCT e.branch_id) FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// Export to CSV-appropriate format
const exportDrillDown = async (user, { module, format = "csv", ...filters }) => {
  let data;
  switch (module) {
    case "attendance": data = await getDrillDownAttendance(user, { ...filters, page: 1, limit: 10000 }); break;
    case "payroll": data = await getDrillDownPayroll(user, { ...filters, page: 1, limit: 10000 }); break;
    case "overtime": data = await getDrillDownOvertime(user, { ...filters, page: 1, limit: 10000 }); break;
    case "leaves": data = await getDrillDownLeaves(user, { ...filters, page: 1, limit: 10000 }); break;
    case "anomalies": data = await getDrillDownAnomalies(user, { ...filters, page: 1, limit: 10000 }); break;
    case "branches": data = await getDrillDownBranch(user, { ...filters, page: 1, limit: 10000 }); break;
    default: throw new Error("Invalid module: " + module);
  }

  if (format === "csv" && data.data.length) {
    const headers = Object.keys(data.data[0]);
    const csv = [headers.join(","), ...data.data.map(r => headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    }).join(","))].join("\n");
    return { csv, filename: `${module}_drilldown_${new Date().toISOString().split("T")[0]}.csv`, count: data.data.length };
  }

  return data;
};

module.exports = {
  getDrillDownAttendance,
  getDrillDownPayroll,
  getDrillDownOvertime,
  getDrillDownLeaves,
  getDrillDownAnomalies,
  getDrillDownBranch,
  exportDrillDown,
};
