const pool = require("../config/db");
const leaveCreditModel = require("../models/leaveCredit.model");

const getMyCredits = async (employeeId) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  if (!credits) {
    return null;
  }

  return {
    ...credits,
    sick_leave_remaining: credits.sick_leave - credits.used_sick_leave,
    vacation_leave_remaining:
      credits.vacation_leave - credits.used_vacation_leave,
    maternity_leave_remaining:
      credits.maternity_leave - credits.used_maternity_leave,
    emergency_leave_remaining:
      credits.emergency_leave - credits.used_emergency_leave,
  };
};

const getAllCredits = async (page = 1, limit = 10, search = "", department = "") => {
  const offset = (page - 1) * limit;
  const now = new Date().getFullYear();
  const params = [];
  let paramIndex = 1;

  let whereClauses = ["1=1"];
  if (search) {
    whereClauses.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (department) {
    whereClauses.push(`e.department = $${paramIndex}`);
    params.push(department);
    paramIndex++;
  }

  const whereSQL = whereClauses.join(" AND ");

  const empResult = await pool.query(`
    SELECT e.id, e.first_name, e.last_name, e.middle_name, e.suffix,
           e.employee_code, e.department, e.position
    FROM employees e
    WHERE ${whereSQL}
    ORDER BY e.last_name, e.first_name
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, [...params, limit, offset]);

  const empIds = empResult.rows.map(r => r.id);
  if (empIds.length === 0) {
    return { data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 } };
  }

  const balResult = await pool.query(`
    SELECT elb.employee_id, lt.code, lt.name, lt.sort_order,
           lt.is_unlimited, lt.requires_balance, lt.include_in_credits, lt.is_paid,
           elb.total_days, elb.used_days, elb.carried_over_days, elb.adjusted_days
    FROM employee_leave_balances elb
    JOIN leave_types lt ON lt.id = elb.leave_type_id
    WHERE elb.employee_id = ANY($1) AND elb.year = $2 AND lt.is_enabled = true
    ORDER BY lt.sort_order
  `, [empIds, now]);

  const balancesByEmp = new Map();
  for (const row of balResult.rows) {
    if (!balancesByEmp.has(row.employee_id)) balancesByEmp.set(row.employee_id, []);
    balancesByEmp.get(row.employee_id).push(row);
  }

  const data = empResult.rows.map((emp) => {
    const entry = {
      id: emp.id, employee_id: emp.id,
      first_name: emp.first_name, last_name: emp.last_name,
      middle_name: emp.middle_name, suffix: emp.suffix,
      employee_code: emp.employee_code, department: emp.department, position: emp.position,
      sick_leave: 0, vacation_leave: 0, maternity_leave: 0, emergency_leave: 0,
      used_sick_leave: 0, used_vacation_leave: 0, used_maternity_leave: 0, used_emergency_leave: 0,
      balances: [],
    };
    const balances = balancesByEmp.get(emp.id) || [];
    for (const b of balances) {
      const total = Number(b.total_days) + Number(b.carried_over_days) + Number(b.adjusted_days);
      entry.balances.push({
        code: b.code, name: b.name, total_days: b.total_days, used_days: b.used_days,
        carried_over_days: b.carried_over_days, adjusted_days: b.adjusted_days,
        remaining_days: total - Number(b.used_days),
        sort_order: b.sort_order, is_unlimited: b.is_unlimited,
        requires_balance: b.requires_balance, include_in_credits: b.include_in_credits, is_paid: b.is_paid,
      });
      if (b.code === 'SL') { entry.sick_leave = total; entry.used_sick_leave = b.used_days; }
      else if (b.code === 'VL') { entry.vacation_leave = total; entry.used_vacation_leave = b.used_days; }
      else if (b.code === 'ML') { entry.maternity_leave = total; entry.used_maternity_leave = b.used_days; }
      else if (b.code === 'EL') { entry.emergency_leave = total; entry.used_emergency_leave = b.used_days; }
    }
    entry.sick_leave_remaining = entry.sick_leave - entry.used_sick_leave;
    entry.vacation_leave_remaining = entry.vacation_leave - entry.used_vacation_leave;
    entry.maternity_leave_remaining = entry.maternity_leave - entry.used_maternity_leave;
    entry.emergency_leave_remaining = entry.emergency_leave - entry.used_emergency_leave;
    return entry;
  });

  const countResult = await pool.query(`
    SELECT COUNT(*) AS cnt FROM employees e WHERE ${whereSQL}
  `, params);
  const total = parseInt(countResult.rows[0].cnt);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getEmployeeCredits = async (employeeId) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  if (!credits) {
    return null;
  }

  return {
    ...credits,
    sick_leave_remaining: credits.sick_leave - credits.used_sick_leave,
    vacation_leave_remaining:
      credits.vacation_leave - credits.used_vacation_leave,
    maternity_leave_remaining:
      credits.maternity_leave - credits.used_maternity_leave,
    emergency_leave_remaining:
      credits.emergency_leave - credits.used_emergency_leave,
  };
};

const updateCredits = async (employeeId, updates) => {
  const now = new Date().getFullYear();

  if (Array.isArray(updates.balances) && updates.balances.length > 0) {
    for (const item of updates.balances) {
      const ltResult = await pool.query(
        `SELECT id FROM leave_types WHERE code = $1 AND is_enabled = true`,
        [item.code],
      );
      if (ltResult.rows.length === 0) continue;

      await pool.query(`
        INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days)
        VALUES ($1, $2, $3, $4, 0, 0, 0)
        ON CONFLICT (employee_id, leave_type_id, year)
        DO UPDATE SET total_days = $4, updated_at = CURRENT_TIMESTAMP
      `, [employeeId, ltResult.rows[0].id, now, item.total_days || 0]);
    }
  } else {
    const leaveTypeMap = {
      sick_leave: 'SL',
      vacation_leave: 'VL',
      maternity_leave: 'ML',
      emergency_leave: 'EL',
    };

    for (const [field, code] of Object.entries(leaveTypeMap)) {
      if (updates[field] !== undefined) {
        const ltResult = await pool.query(
          `SELECT id FROM leave_types WHERE code = $1 AND is_enabled = true`,
          [code],
        );
        if (ltResult.rows.length === 0) continue;

        await pool.query(`
          INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days)
          VALUES ($1, $2, $3, $4, 0, 0, 0)
          ON CONFLICT (employee_id, leave_type_id, year)
          DO UPDATE SET total_days = $4, updated_at = CURRENT_TIMESTAMP
        `, [employeeId, ltResult.rows[0].id, now, updates[field]]);
      }
    }
  }

  return await getEmployeeCredits(employeeId);
};

module.exports = {
  getMyCredits,
  getAllCredits,
  getEmployeeCredits,
  updateCredits,
};
