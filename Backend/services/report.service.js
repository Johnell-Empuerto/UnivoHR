const pool = require("../config/db");
const { getUserBranchIds } = require("../utils/branchAccess");

// ============================================
// EMPLOYEE REPORTS
// ============================================

const getEmployeeReport = async (user, { reportType, status, department, branch_id, startDate, endDate, search, page = 1, limit = 20 }) => {
  let whereConditions = [];
  const params = [];
  let idx = 1;

  if (user.role === "HR") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
    whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
    params.push(branchIds);
    idx++;
  }

  switch (reportType) {
    case "active":
      whereConditions.push(`e.status = $${idx++}`);
      params.push("ACTIVE");
      break;
    case "inactive":
      whereConditions.push(`e.status = $${idx++}`);
      params.push("INACTIVE");
      break;
    case "new_hires":
      if (startDate) { whereConditions.push(`e.hired_date >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`e.hired_date <= $${idx++}::date`); params.push(endDate); }
      break;
    case "resigned_terminated":
      whereConditions.push(`(e.status = $${idx++} OR e.status = $${idx++})`);
      params.push("RESIGNED", "TERMINATED");
      if (startDate) { whereConditions.push(`COALESCE(e.resignation_date, e.termination_date, e.last_working_date) >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`COALESCE(e.resignation_date, e.termination_date, e.last_working_date) <= $${idx++}::date`); params.push(endDate); }
      break;
    case "master_list":
    default:
      if (status) { whereConditions.push(`e.status = $${idx++}`); params.push(status); }
      break;
  }

  if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
  if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (search) {
    const searchVal = `%${search}%`;
    whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx} OR CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $${idx})`);
    params.push(searchVal);
    idx++;
  }

  const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
  const offset = (page - 1) * limit;

  const data = await pool.query(`
    SELECT e.id, e.employee_code, e.first_name, e.middle_name, e.last_name, e.suffix,
           e.department, e.position, e.status, e.employment_status,
           e.hired_date, e.resignation_date, e.termination_date, e.last_working_date,
           e.branch_id, b.name AS branch_name,
           e.gender, e.contact_number, e.email
    FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY e.last_name, e.first_name
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}${r.suffix ? ', ' + r.suffix : ''}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ============================================
// LEAVE REPORTS
// ============================================

const getLeaveReport = async (user, { reportType, status, department, startDate, endDate, search, page = 1, limit = 20 }) => {
  const params = [];
  let idx = 1;
  let offset = (page - 1) * limit;

  if (reportType === "balance") {
    const whereConditions = [];
    if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
    if (search) {
      const searchVal = `%${search}%`;
      whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
      params.push(searchVal);
      idx++;
    }
    if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
      whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
      params.push(branchIds);
      idx++;
    }

    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";

    const data = await pool.query(`
      SELECT e.id, e.employee_code, e.first_name, e.last_name, e.department, b.name AS branch_name,
             COALESCE(lc.vacation_leave, 0) AS vacation_leave,
             COALESCE(lc.used_vacation_leave, 0) AS used_vacation_leave,
             COALESCE(lc.sick_leave, 0) AS sick_leave,
             COALESCE(lc.used_sick_leave, 0) AS used_sick_leave,
             COALESCE(lc.emergency_leave, 0) AS emergency_leave,
             COALESCE(lc.used_emergency_leave, 0) AS used_emergency_leave,
             COALESCE(lc.maternity_leave, 0) AS maternity_leave,
             COALESCE(lc.used_maternity_leave, 0) AS used_maternity_leave
      FROM employees e
      LEFT JOIN leave_credits lc ON lc.employee_id = e.id
      LEFT JOIN branches b ON b.id = e.branch_id
      ${where}
      ORDER BY e.last_name, e.first_name
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const count = await pool.query(`
      SELECT COUNT(*) FROM employees e
      LEFT JOIN leave_credits lc ON lc.employee_id = e.id
      ${where}
    `, params);

    const total = parseInt(count.rows[0].count);
    return {
      data: data.rows.map(r => ({
        ...r,
        employee_name: `${r.first_name} ${r.last_name}`,
        available_vacation: Number(r.vacation_leave) - Number(r.used_vacation_leave),
        available_sick: Number(r.sick_leave) - Number(r.used_sick_leave),
        available_emergency: Number(r.emergency_leave) - Number(r.used_emergency_leave),
        available_maternity: Number(r.maternity_leave) - Number(r.used_maternity_leave),
      })),
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  if (reportType === "usage") {
    const whereConditions = ["l.status = $${idx++}"];
    params.push("APPROVED");

    if (startDate) { whereConditions.push(`l.from_date >= $${idx++}::date`); params.push(startDate); }
    if (endDate) { whereConditions.push(`l.to_date <= $${idx++}::date`); params.push(endDate); }
    if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
    if (search) {
      const searchVal = `%${search}%`;
      whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
      params.push(searchVal);
      idx++;
    }
    if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
      whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
      params.push(branchIds);
      idx++;
    }

    const where = "WHERE " + whereConditions.join(" AND ");

    const data = await pool.query(`
      SELECT l.id, l.employee_id, l.type, l.from_date, l.to_date, l.status, l.created_at,
             l.day_fraction, l.half_day_type,
             e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
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
  }

  if (reportType === "conversion") {
    const whereConditions = [];
    if (startDate) { whereConditions.push(`lc.conversion_date >= $${idx++}::date`); params.push(startDate); }
    if (endDate) { whereConditions.push(`lc.conversion_date <= $${idx++}::date`); params.push(endDate); }
    if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
    if (search) {
      const searchVal = `%${search}%`;
      whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
      params.push(searchVal);
      idx++;
    }
    if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
      whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
      params.push(branchIds);
      idx++;
    }

    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";

    const data = await pool.query(`
      SELECT lc.id, lc.employee_id, lc.days_converted, lc.amount, lc.year, lc.conversion_date,
             e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
      FROM leave_conversions lc
      JOIN employees e ON e.id = lc.employee_id
      LEFT JOIN branches b ON b.id = e.branch_id
      ${where}
      ORDER BY lc.conversion_date DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const count = await pool.query(`
      SELECT COUNT(*) FROM leave_conversions lc
      JOIN employees e ON e.id = lc.employee_id
      ${where}
    `, params);

    const total = parseInt(count.rows[0].count);
    return {
      data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  const whereConditions = ["1=1"];
  if (status) { whereConditions.push(`l.status = $${idx++}`); params.push(status); }
  if (startDate) { whereConditions.push(`l.from_date >= $${idx++}::date`); params.push(startDate); }
  if (endDate) { whereConditions.push(`l.to_date <= $${idx++}::date`); params.push(endDate); }
  if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
  if (search) {
    const searchVal = `%${search}%`;
    whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
    params.push(searchVal);
    idx++;
  }
  if (user.role === "HR") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
    whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
    params.push(branchIds);
    idx++;
  }

  const where = "WHERE " + whereConditions.join(" AND ");
  offset = (page - 1) * limit;

  const data = await pool.query(`
    SELECT l.id, l.employee_id, l.type, l.from_date, l.to_date, l.status, l.reason, l.created_at,
           l.day_fraction, l.half_day_type,
           e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY l.created_at DESC
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

// ============================================
// ATTENDANCE REPORTS
// ============================================

const getAttendanceReport = async (user, { reportType, status, department, branch_id, startDate, endDate, search, page = 1, limit = 20 }) => {
  let whereConditions = [];
  const params = [];
  let idx = 1;

  const buildBranchFilter = async () => {
    if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
    if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) return false;
      whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
      params.push(branchIds);
      idx++;
    }
    return true;
  };

  if (reportType === "monthly_summary") {
    const valid = await buildBranchFilter();
    if (!valid) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };

    if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
    if (startDate) { whereConditions.push(`a.date >= $${idx++}::date`); params.push(startDate); }
    if (endDate) { whereConditions.push(`a.date <= $${idx++}::date`); params.push(endDate); }

    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
    const offset = (page - 1) * limit;

    const data = await pool.query(`
      SELECT TO_CHAR(a.date, 'YYYY-MM') AS month,
             COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present_count,
             COUNT(*) FILTER (WHERE a.status = 'LATE') AS late_count,
             COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent_count,
             COUNT(*) FILTER (WHERE a.status = 'HALF_DAY') AS half_day_count,
             COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS leave_count,
             COUNT(*) AS total_records
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${where}
      GROUP BY TO_CHAR(a.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const count = await pool.query(`
      SELECT COUNT(DISTINCT TO_CHAR(a.date, 'YYYY-MM')) FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${where}
    `, params);

    const total = parseInt(count.rows[0].count);
    return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  if (reportType === "by_branch") {
    if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
      whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
      params.push(branchIds);
      idx++;
    }
    if (startDate) { whereConditions.push(`a.date >= $${idx++}::date`); params.push(startDate); }
    if (endDate) { whereConditions.push(`a.date <= $${idx++}::date`); params.push(endDate); }

    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
    const offset = (page - 1) * limit;

    const data = await pool.query(`
      SELECT e.branch_id, b.name AS branch_name,
             COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present_count,
             COUNT(*) FILTER (WHERE a.status = 'LATE') AS late_count,
             COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent_count,
             COUNT(*) FILTER (WHERE a.status = 'HALF_DAY') AS half_day_count,
             COUNT(*) AS total_records
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      JOIN branches b ON b.id = e.branch_id
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
    return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  if (reportType === "by_department") {
    const valid = await buildBranchFilter();
    if (!valid) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
    if (startDate) { whereConditions.push(`a.date >= $${idx++}::date`); params.push(startDate); }
    if (endDate) { whereConditions.push(`a.date <= $${idx++}::date`); params.push(endDate); }

    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
    const offset = (page - 1) * limit;

    const data = await pool.query(`
      SELECT e.department,
             COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present_count,
             COUNT(*) FILTER (WHERE a.status = 'LATE') AS late_count,
             COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent_count,
             COUNT(*) FILTER (WHERE a.status = 'HALF_DAY') AS half_day_count,
             COUNT(*) AS total_records
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${where}
      GROUP BY e.department
      ORDER BY e.department
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const count = await pool.query(`
      SELECT COUNT(DISTINCT e.department) FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${where}
    `, params);

    const total = parseInt(count.rows[0].count);
    return { data: data.rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  const valid = await buildBranchFilter();
  if (!valid) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };

  if (reportType === "late") { whereConditions.push(`a.status = $${idx++}`); params.push("LATE"); }
  else if (reportType === "absent") { whereConditions.push(`a.status = $${idx++}`); params.push("ABSENT"); }
  else if (status) { whereConditions.push(`a.status = $${idx++}`); params.push(status); }

  if (startDate) { whereConditions.push(`a.date >= $${idx++}::date`); params.push(startDate); }
  if (endDate) { whereConditions.push(`a.date <= $${idx++}::date`); params.push(endDate); }
  if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
  if (search) {
    const searchVal = `%${search}%`;
    whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
    params.push(searchVal);
    idx++;
  }

  const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
  const offset = (page - 1) * limit;

  const data = await pool.query(`
    SELECT a.id, a.employee_id, a.date, a.status, a.check_in_time, a.check_out_time, a.work_fraction,
           e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY a.date DESC, e.last_name
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

// ============================================
// PAYROLL REPORTS
// ============================================

const getPayrollReport = async (user, { reportType, status, department, branch_id, cutoffStart, cutoffEnd, payDate, startDate, endDate, search, page = 1, limit = 20 }) => {
  let whereConditions = [];
  const params = [];
  let idx = 1;

  switch (reportType) {
    case "by_branch":
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (cutoffStart) { whereConditions.push(`p.cutoff_start >= $${idx++}::date`); params.push(cutoffStart); }
      if (cutoffEnd) { whereConditions.push(`p.cutoff_end <= $${idx++}::date`); params.push(cutoffEnd); }
      if (search) {
        const searchVal = `%${search}%`;
        whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
        params.push(searchVal);
        idx++;
      }
      const whereBranch = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetBranch = (page - 1) * limit;
      const dataBranch = await pool.query(`
        SELECT e.branch_id, b.name AS branch_name,
               COUNT(*) AS total_employees,
               COALESCE(SUM(p.net_salary), 0) AS total_net_salary,
               COALESCE(SUM(p.deductions), 0) AS total_deductions,
               COALESCE(SUM(p.overtime_pay), 0) AS total_overtime,
               COALESCE(SUM(p.basic_salary), 0) AS total_basic_salary
        FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        JOIN branches b ON b.id = e.branch_id
        ${whereBranch}
        GROUP BY e.branch_id, b.name
        ORDER BY b.name
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetBranch]);
      const countBranch = await pool.query(`
        SELECT COUNT(DISTINCT e.branch_id) FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        ${whereBranch}
      `, params);
      return { data: dataBranch.rows, pagination: { total: parseInt(countBranch.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countBranch.rows[0].count) / limit) } };
    case "by_department":
    case "department_summary":
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (cutoffStart) { whereConditions.push(`p.cutoff_start >= $${idx++}::date`); params.push(cutoffStart); }
      if (cutoffEnd) { whereConditions.push(`p.cutoff_end <= $${idx++}::date`); params.push(cutoffEnd); }
      const whereDept = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetDept = (page - 1) * limit;
      const dataDept = await pool.query(`
        SELECT e.department,
               COUNT(*) AS total_employees,
               COALESCE(SUM(p.net_salary), 0) AS total_net_salary,
               COALESCE(SUM(p.deductions), 0) AS total_deductions,
               COALESCE(SUM(p.overtime_pay), 0) AS total_overtime,
               COALESCE(SUM(p.basic_salary), 0) AS total_basic_salary
        FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        ${whereDept}
        GROUP BY e.department
        ORDER BY e.department
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetDept]);
      const countDept = await pool.query(`
        SELECT COUNT(DISTINCT e.department) FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        ${whereDept}
      `, params);
      return { data: dataDept.rows, pagination: { total: parseInt(countDept.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countDept.rows[0].count) / limit) } };
    case "net_pay_summary":
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (cutoffStart) { whereConditions.push(`p.cutoff_start >= $${idx++}::date`); params.push(cutoffStart); }
      if (cutoffEnd) { whereConditions.push(`p.cutoff_end <= $${idx++}::date`); params.push(cutoffEnd); }
      if (status) { whereConditions.push(`p.status = $${idx++}`); params.push(status); }
      const whereNet = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetNet = (page - 1) * limit;
      const dataNet = await pool.query(`
        SELECT p.id, p.employee_id, p.cutoff_start, p.cutoff_end, p.pay_date, p.status,
               p.basic_salary, p.overtime_pay, p.deductions, p.net_salary,
               p.late_deduction, p.government_deduction, p.leave_conversion,
               e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
        FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        LEFT JOIN branches b ON b.id = e.branch_id
        ${whereNet}
        ORDER BY p.cutoff_end DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetNet]);
      const countNet = await pool.query(`
        SELECT COUNT(*) FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        ${whereNet}
      `, params);
      return {
        data: dataNet.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
        pagination: { total: parseInt(countNet.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countNet.rows[0].count) / limit) },
      };
    case "deduction_summary":
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (cutoffStart) { whereConditions.push(`p.cutoff_start >= $${idx++}::date`); params.push(cutoffStart); }
      if (cutoffEnd) { whereConditions.push(`p.cutoff_end <= $${idx++}::date`); params.push(cutoffEnd); }
      const whereDed = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetDed = (page - 1) * limit;
      const dataDed = await pool.query(`
        SELECT p.id, p.employee_id, p.cutoff_start, p.cutoff_end, p.status,
               p.deductions AS total_deductions,
               p.late_deduction, p.government_deduction,
               e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
        FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        LEFT JOIN branches b ON b.id = e.branch_id
        ${whereDed}
        ORDER BY p.deductions DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetDed]);
      const countDed = await pool.query(`
        SELECT COUNT(*) FROM payroll p
        JOIN employees e ON e.id = p.employee_id
        ${whereDed}
      `, params);
      return {
        data: dataDed.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
        pagination: { total: parseInt(countDed.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countDed.rows[0].count) / limit) },
      };
    case "final_pay":
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (startDate) { whereConditions.push(`fp.processed_at >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`fp.processed_at <= $${idx++}::date`); params.push(endDate); }
      if (search) {
        const searchVal = `%${search}%`;
        whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
        params.push(searchVal);
        idx++;
      }
      const whereFp = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetFp = (page - 1) * limit;
      const dataFp = await pool.query(`
        SELECT fp.id, fp.employee_id, fp.total_amount, fp.status AS fp_status,
               fp.processed_at, fp.processed_by,
               e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
        FROM final_pay fp
        JOIN employees e ON e.id = fp.employee_id
        LEFT JOIN branches b ON b.id = e.branch_id
        ${whereFp}
        ORDER BY fp.processed_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetFp]);
      const countFp = await pool.query(`
        SELECT COUNT(*) FROM final_pay fp
        JOIN employees e ON e.id = fp.employee_id
        ${whereFp}
      `, params);
      return {
        data: dataFp.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
        pagination: { total: parseInt(countFp.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countFp.rows[0].count) / limit) },
      };
    case "paid":
      whereConditions.push(`p.status = $${idx++}`);
      params.push("PAID");
      // fall through
    case "unpaid":
      if (reportType === "unpaid") {
        whereConditions.push(`p.status = $${idx++}`);
        params.push("UNPAID");
      }
      // fall through
    case "summary":
    default:
      if (user.role === "HR") {
        const branchIds = await getUserBranchIds(user.id);
        if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
        whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
        params.push(branchIds);
        idx++;
      }
      if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
      if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
      if (cutoffStart) { whereConditions.push(`p.cutoff_start >= $${idx++}::date`); params.push(cutoffStart); }
      if (cutoffEnd) { whereConditions.push(`p.cutoff_end <= $${idx++}::date`); params.push(cutoffEnd); }
      if (payDate) { whereConditions.push(`p.pay_date = $${idx++}::date`); params.push(payDate); }
      if (status) { whereConditions.push(`p.status = $${idx++}`); params.push(status); }
      if (search) {
        const searchVal = `%${search}%`;
        whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
        params.push(searchVal);
        idx++;
      }
      const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offset = (page - 1) * limit;
      const data = await pool.query(`
        SELECT p.id, p.employee_id, p.cutoff_start, p.cutoff_end, p.pay_date, p.status,
               p.basic_salary, p.overtime_pay, p.deductions, p.net_salary,
               p.late_deduction, p.government_deduction, p.leave_conversion,
               e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
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
  }
};

// ============================================
// BENEFITS REPORTS (employee_deductions)
// ============================================

const getBenefitsReport = async (user, { reportType, status, department, branch_id, deductionType, startDate, endDate, search, page = 1, limit = 20 }) => {
  let whereConditions = [];
  const params = [];
  let idx = 1;

  if (user.role === "HR") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
    whereConditions.push(`e.branch_id = ANY($${idx}::int[])`);
    params.push(branchIds);
    idx++;
  }

  if (reportType === "deductions" || reportType === "government" || !reportType) {
    if (deductionType) { whereConditions.push(`d.type = $${idx++}`); params.push(deductionType); }
    else if (reportType === "government") { whereConditions.push(`d.type NOT LIKE 'LATE%'`); }
  } else if (reportType === "sss") { whereConditions.push(`d.type = $${idx++}`); params.push("SSS"); }
  else if (reportType === "philhealth") { whereConditions.push(`d.type = $${idx++}`); params.push("PHILHEALTH"); }
  else if (reportType === "pagibig") { whereConditions.push(`d.type = $${idx++}`); params.push("PAGIBIG"); }
  else if (reportType === "tax") { whereConditions.push(`d.type = $${idx++}`); params.push("TAX"); }
  else if (reportType === "loan_other") { whereConditions.push(`(d.type = $${idx++} OR d.type = $${idx++})`); params.push("LOAN", "OTHER"); }
  else { whereConditions.push(`d.type NOT LIKE 'LATE%'`); }

  if (status === "active") { whereConditions.push(`d.is_active = $${idx++}`); params.push(true); }
  else if (status === "inactive") { whereConditions.push(`d.is_active = $${idx++}`); params.push(false); }

  if (department) { whereConditions.push(`e.department = $${idx++}`); params.push(department); }
  if (branch_id) { whereConditions.push(`e.branch_id = $${idx++}`); params.push(branch_id); }
  if (search) {
    const searchVal = `%${search}%`;
    whereConditions.push(`(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.employee_code ILIKE $${idx})`);
    params.push(searchVal);
    idx++;
  }

  const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
  const offset = (page - 1) * limit;

  const data = await pool.query(`
    SELECT d.id, d.employee_id, d.type, d.amount, d.is_active, d.created_at, d.updated_at,
           e.first_name, e.last_name, e.employee_code, e.department, b.name AS branch_name
    FROM employee_deductions d
    JOIN employees e ON e.id = d.employee_id
    LEFT JOIN branches b ON b.id = e.branch_id
    ${where}
    ORDER BY e.last_name, d.type
    LIMIT $${idx++} OFFSET $${idx++}
  `, [...params, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) FROM employee_deductions d
    JOIN employees e ON e.id = d.employee_id
    ${where}
  `, params);

  const total = parseInt(count.rows[0].count);
  return {
    data: data.rows.map(r => ({ ...r, employee_name: `${r.first_name} ${r.last_name}` })),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ============================================
// PERFORMANCE / KPI REPORTS
// ============================================

const getPerformanceReport = async (user, { reportType, status, department, branch_id, startDate, endDate, search, page = 1, limit = 20 }) => {
  let whereConditions = [];
  const params = [];
  let idx = 1;

  if (user.role === "HR") {
    const branchIds = await getUserBranchIds(user.id);
    if (branchIds.length === 0) return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
    whereConditions.push(`emp.branch_id = ANY($${idx}::int[])`);
    params.push(branchIds);
    idx++;
  }

  switch (reportType) {
    case "completed":
      whereConditions.push(`eke.status = $${idx++}`);
      params.push("Approved");
      break;
    case "pending":
      whereConditions.push(`(eke.status = $${idx++} OR eke.status = $${idx++} OR eke.status = $${idx++})`);
      params.push("Draft", "In Progress", "Submitted");
      break;
    case "by_department":
      if (department) { whereConditions.push(`emp.department = $${idx++}`); params.push(department); }
      if (startDate) { whereConditions.push(`eke.evaluation_period_start >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`eke.evaluation_period_end <= $${idx++}::date`); params.push(endDate); }
      if (status) { whereConditions.push(`eke.status = $${idx++}`); params.push(status); }
      const whereDeptPerf = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const offsetDeptPerf = (page - 1) * limit;
      const dataDeptPerf = await pool.query(`
        SELECT emp.department,
               COUNT(*) AS total_evaluations,
               COALESCE(AVG(eke.final_score), 0) AS avg_score,
               COUNT(*) FILTER (WHERE eke.status = 'Approved') AS completed_count,
               COUNT(*) FILTER (WHERE eke.status NOT IN ('Approved', 'Completed')) AS pending_count
        FROM employee_kpi_evaluations eke
        JOIN employees emp ON emp.id = eke.employee_id
        ${whereDeptPerf}
        GROUP BY emp.department
        ORDER BY emp.department
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offsetDeptPerf]);
      const countDeptPerf = await pool.query(`
        SELECT COUNT(DISTINCT emp.department) FROM employee_kpi_evaluations eke
        JOIN employees emp ON emp.id = eke.employee_id
        ${whereDeptPerf}
      `, params);
      return { data: dataDeptPerf.rows, pagination: { total: parseInt(countDeptPerf.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countDeptPerf.rows[0].count) / limit) } };
    case "completion_rate":
      if (department) { whereConditions.push(`emp.department = $${idx++}`); params.push(department); }
      if (startDate) { whereConditions.push(`eke.evaluation_period_start >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`eke.evaluation_period_end <= $${idx++}::date`); params.push(endDate); }
      const whereCr = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
      const dataCr = await pool.query(`
        SELECT
          COUNT(*) AS total_evaluations,
          COUNT(*) FILTER (WHERE eke.status = 'Approved') AS completed_count,
          COUNT(*) FILTER (WHERE eke.status = 'Submitted') AS submitted_count,
          COUNT(*) FILTER (WHERE eke.status = 'In Progress') AS in_progress_count,
          COUNT(*) FILTER (WHERE eke.status = 'Draft') AS draft_count
        FROM employee_kpi_evaluations eke
        JOIN employees emp ON emp.id = eke.employee_id
        ${whereCr}
      `, params);
      return {
        data: [{
          ...dataCr.rows[0],
          completion_rate: dataCr.rows[0].total_evaluations > 0
            ? Math.round((dataCr.rows[0].completed_count / dataCr.rows[0].total_evaluations) * 100)
            : 0,
        }],
        pagination: { total: 1, page: 1, limit, totalPages: 1 },
      };
    case "summary":
    default:
      if (status) { whereConditions.push(`eke.status = $${idx++}`); params.push(status); }
      if (department) { whereConditions.push(`emp.department = $${idx++}`); params.push(department); }
      if (branch_id) { whereConditions.push(`emp.branch_id = $${idx++}`); params.push(branch_id); }
      if (startDate) { whereConditions.push(`eke.evaluation_period_start >= $${idx++}::date`); params.push(startDate); }
      if (endDate) { whereConditions.push(`eke.evaluation_period_end <= $${idx++}::date`); params.push(endDate); }
      if (search) {
        const searchVal = `%${search}%`;
        whereConditions.push(`(emp.first_name ILIKE $${idx} OR emp.last_name ILIKE $${idx} OR emp.employee_code ILIKE $${idx})`);
        params.push(searchVal);
        idx++;
      }
      break;
  }

  if (reportType !== "by_department" && reportType !== "completion_rate") {
    const where = whereConditions.length ? "WHERE " + whereConditions.join(" AND ") : "";
    const offset = (page - 1) * limit;

    const data = await pool.query(`
      SELECT eke.id, eke.employee_id, eke.template_id, eke.evaluation_period_start,
             eke.evaluation_period_end, eke.status, eke.final_score, eke.created_at,
             eke.updated_at, eke.evaluator_id,
             emp.first_name, emp.last_name, emp.employee_code, emp.department,
             b.name AS branch_name,
             kt.name AS template_name,
             ev.first_name AS evaluator_first_name, ev.last_name AS evaluator_last_name
      FROM employee_kpi_evaluations eke
      JOIN employees emp ON emp.id = eke.employee_id
      LEFT JOIN branches b ON b.id = emp.branch_id
      LEFT JOIN kpi_templates kt ON kt.id = eke.template_id
      LEFT JOIN employees ev ON ev.id = eke.evaluator_id
      ${where}
      ORDER BY eke.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const count = await pool.query(`
      SELECT COUNT(*) FROM employee_kpi_evaluations eke
      JOIN employees emp ON emp.id = eke.employee_id
      ${where}
    `, params);

    const total = parseInt(count.rows[0].count);
    return {
      data: data.rows.map(r => ({
        ...r,
        employee_name: `${r.first_name} ${r.last_name}`,
        evaluator_name: r.evaluator_first_name ? `${r.evaluator_first_name} ${r.evaluator_last_name}` : null,
      })),
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }
};

// ============================================
// EXPORT TO CSV
// ============================================

const exportReport = async (user, { reportCategory, reportType, ...filters }) => {
  let result;
  switch (reportCategory) {
    case "employees":
      result = await getEmployeeReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    case "leaves":
      result = await getLeaveReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    case "attendance":
      result = await getAttendanceReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    case "payroll":
      result = await getPayrollReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    case "benefits":
      result = await getBenefitsReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    case "performance":
      result = await getPerformanceReport(user, { ...filters, reportType, page: 1, limit: 10000 });
      break;
    default:
      throw new Error("Invalid report category: " + reportCategory);
  }

  if (!result.data.length) {
    return { csv: "", filename: `${reportCategory}_${reportType}_${new Date().toISOString().split("T")[0]}.csv`, count: 0 };
  }

  const headers = Object.keys(result.data[0]);
  const csv = [headers.join(","), ...result.data.map(r => headers.map(h => {
    const v = r[h];
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  }).join(","))].join("\n");

  return { csv, filename: `${reportCategory}_${reportType}_${new Date().toISOString().split("T")[0]}.csv`, count: result.data.length };
};

module.exports = {
  getEmployeeReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getBenefitsReport,
  getPerformanceReport,
  exportReport,
};
