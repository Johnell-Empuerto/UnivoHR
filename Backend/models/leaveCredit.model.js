const pool = require("../config/db");

const getByEmployee = async (employeeId) => {
  const result = await pool.query(`
    SELECT
      elb.id,
      elb.employee_id,
      elb.leave_type_id,
      lt.code,
      lt.name,
      lt.is_paid,
      lt.is_convertible,
      lt.requires_balance,
      lt.is_unlimited,
      lt.include_in_credits,
      lt.sort_order,
      lt.default_days,
      elb.year,
      elb.total_days,
      elb.used_days,
      elb.carried_over_days,
      elb.adjusted_days,
      (elb.total_days + elb.carried_over_days + elb.adjusted_days - elb.used_days) AS remaining_days
    FROM employee_leave_balances elb
    JOIN leave_types lt ON lt.id = elb.leave_type_id
    WHERE elb.employee_id = $1
      AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      AND lt.is_enabled = true
    ORDER BY lt.sort_order, lt.code
  `, [employeeId]);

  const rows = result.rows;
  if (rows.length === 0) return null;

  const credits = {
    employee_id: employeeId,
    id: rows[0].id,
    balances: rows,
    sick_leave: 0,
    vacation_leave: 0,
    maternity_leave: 0,
    emergency_leave: 0,
    no_pay_leave: 0,
    used_sick_leave: 0,
    used_vacation_leave: 0,
    used_maternity_leave: 0,
    used_emergency_leave: 0,
    used_no_pay_leave: 0,
  };

  for (const row of rows) {
    const total = row.total_days + row.carried_over_days + row.adjusted_days;
    if (row.code === 'SL') { credits.sick_leave = total; credits.used_sick_leave = row.used_days; }
    else if (row.code === 'VL') { credits.vacation_leave = total; credits.used_vacation_leave = row.used_days; }
    else if (row.code === 'ML') { credits.maternity_leave = total; credits.used_maternity_leave = row.used_days; }
    else if (row.code === 'EL') { credits.emergency_leave = total; credits.used_emergency_leave = row.used_days; }
    else if (row.code === 'NP') { credits.no_pay_leave = 0; credits.used_no_pay_leave = 0; }
  }

  return credits;
};

const createDefault = async (employeeId, client = null) => {
  const db = client || pool;
  const now = new Date().getFullYear();

  const leaveTypes = await db.query(`
    SELECT id, code, default_days, requires_balance, include_in_credits, is_unlimited
    FROM leave_types
    WHERE is_enabled = true
      AND (include_in_credits = true OR requires_balance = true)
  `);

  if (leaveTypes.rows.length === 0) return null;

  for (const lt of leaveTypes.rows) {
    const totalDays = lt.is_unlimited ? 0 : (lt.default_days || 0);
    await db.query(`
      INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days)
      VALUES ($1, $2, $3, $4, 0, 0, 0)
      ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
    `, [employeeId, lt.id, now, totalDays]);
  }

  return await getByEmployee(employeeId);
};

const ensureBalanceRow = async (employeeId, leaveTypeId, year, defaultDays, client = null) => {
  const db = client || pool;
  await db.query(`
    INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days)
    VALUES ($1, $2, $3, $4, 0, 0, 0)
    ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
  `, [employeeId, leaveTypeId, year, defaultDays]);
};

const useLeave = async (employeeId, type, days, client = null) => {
  const db = client || pool;

  const legacyCodeMap = { SICK: 'SL', ANNUAL: 'VL', EMERGENCY: 'EL', MATERNITY: 'ML', NO_PAY: 'NP' };
  const code = legacyCodeMap[type] || type;

  const ltResult = await db.query(`
    SELECT id, code, requires_balance, is_unlimited, default_days
    FROM leave_types
    WHERE code = $1 AND is_enabled = true
  `, [code]);

  if (ltResult.rows.length === 0) {
    return;
  }

  const lt = ltResult.rows[0];

  if (lt.is_unlimited) {
    return;
  }

  if (lt.requires_balance) {
    const now = new Date().getFullYear();
    await ensureBalanceRow(employeeId, lt.id, now, lt.default_days || 0, db);
    await db.query(`
      UPDATE employee_leave_balances
      SET used_days = used_days + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $2
        AND leave_type_id = $3
        AND year = $4
    `, [days, employeeId, lt.id, now]);
  }
};

module.exports = {
  getByEmployee,
  createDefault,
  useLeave,
  ensureBalanceRow,
};
