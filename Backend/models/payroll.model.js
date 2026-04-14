const pool = require("../config/db");
const attendanceModel = require("./attendance.model");
const overtimeModel = require("./overtime.model");

// GENERATE PAYROLL (WITH FULL DATE COVERAGE & LEAVE CONVERSION + OVERTIME + HALF-DAY SUPPORT)
const generatePayroll = async (cutoff_start, cutoff_end, pay_date) => {
  const settingsRes = await pool.query(`
    SELECT conversion_rate, enforce_sil, sil_min_days 
    FROM company_settings 
    LIMIT 1
  `);

  const { conversion_rate, enforce_sil, sil_min_days } = settingsRes
    .rows[0] || { conversion_rate: 1, enforce_sil: false, sil_min_days: 0 };

  const employees = await pool.query(`
  SELECT e.*
  FROM employees e
WHERE e.status = 'ACTIVE'
`);

  for (const emp of employees.rows) {
    // GET EMPLOYEE SALARY
    const salaryRes = await pool.query(
      `SELECT * FROM employee_salary WHERE employee_id = $1`,
      [emp.id],
    );

    if (salaryRes.rows.length === 0) continue;
    const salary = salaryRes.rows[0];

    // GET OVERTIME DATA
    const overtime = await overtimeModel.getOvertimeHoursForPayroll(
      emp.id,
      cutoff_start,
      cutoff_end,
    );

    // GET LEAVE CREDITS
    const leaveCreditsRes = await pool.query(
      `SELECT * FROM leave_credits WHERE employee_id = $1`,
      [emp.id],
    );

    let credits = leaveCreditsRes.rows[0];

    if (!credits) {
      const defaults = await pool.query(`
        SELECT code, default_days FROM leave_types
      `);

      const map = {};
      defaults.rows.forEach((d) => {
        map[d.code] = d.default_days;
      });

      await pool.query(
        `
        INSERT INTO leave_credits (
          employee_id,
          vacation_leave,
          used_vacation_leave,
          last_conversion_year
        )
        VALUES ($1, $2, 0, NULL)
      `,
        [emp.id, map["VL"] ?? 5],
      );

      const newCredits = await pool.query(
        `SELECT * FROM leave_credits WHERE employee_id = $1`,
        [emp.id],
      );
      credits = newCredits.rows[0];
    }

    // GET ACTIVE ATTENDANCE RULES
    const rules = await attendanceModel.getRules();

    // Use monthly salary as base
    const monthly_salary = Number(salary.basic_salary);
    const working_days_per_month = Number(salary.working_days_per_month || 26);
    const daily_rate = monthly_salary / working_days_per_month;

    // CALCULATE OVERTIME PAY
    const overtime_rate = Number(salary.overtime_rate || 0);
    const overtime_pay = overtime.total_hours * overtime_rate;

    // LEAVE CONVERSION - FETCH FROM leave_conversions TABLE
    // DO NOT calculate here - conversion is done by year-end process or resignation
    let leave_conversion_cash = 0;
    const currentYear = new Date(pay_date).getFullYear();
    const currentMonth = new Date(pay_date).getMonth() + 1;

    // On January payroll, fetch previous year's conversion
    if (currentMonth === 1) {
      const conversionYear = currentYear - 1;

      // Fetch conversion amount from leave_conversions table
      const conversionRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total_amount
         FROM leave_conversions
         WHERE employee_id = $1 AND year = $2`,
        [emp.id, conversionYear],
      );

      leave_conversion_cash = parseFloat(conversionRes.rows[0].total_amount);
    }

    // GET ATTENDANCE
    const attendanceFull = await pool.query(
      `
      SELECT 
        d.date,
        a.status,
        a.check_in_time,
        a.check_out_time,
        a.work_fraction,
        COALESCE(c.day_type, 'REGULAR') AS day_type
      FROM generate_series($1::date, $2::date, interval '1 day') d(date)
      
      LEFT JOIN attendance a 
        ON a.date = d.date AND a.employee_id = $3
      
      LEFT JOIN calendar_days c 
        ON c.date = d.date
      
      ORDER BY d.date
    `,
      [cutoff_start, cutoff_end, emp.id],
    );

    // NEW: Calculate work units (supports half-day through work_fraction)
    let total_work_units = 0;
    let late_count = 0;
    let late_minutes = 0;
    let holiday_worked = 0;
    let regular_holidays = 0;
    let special_holidays = 0;
    let working_days_in_cutoff = 0;

    for (const row of attendanceFull.rows) {
      const isWorkingDay =
        row.day_type !== "REST_DAY" && row.day_type !== "NON_WORKING";
      const isHoliday =
        row.day_type === "REGULAR_HOLIDAY" ||
        row.day_type === "SPECIAL_HOLIDAY";

      if (isWorkingDay || isHoliday) {
        working_days_in_cutoff++;
      }

      if (!isWorkingDay && !isHoliday) {
        continue;
      }

      // Support half-day through work_fraction
      let workUnits = 0;

      if (row.status === "PRESENT") {
        workUnits = 1;
      } else if (row.status === "LATE") {
        workUnits = 1;
        late_count++;

        if (row.check_in_time) {
          const checkInTime = new Date(row.check_in_time);
          const scheduledStart = new Date(row.check_in_time);
          scheduledStart.setHours(8, 0, 0, 0);

          const rawLateMinutes = (checkInTime - scheduledStart) / 1000 / 60;

          // 🔥 CRITICAL FIX: Apply threshold and grace period
          const threshold = rules?.late_threshold || 0;
          const grace = rules?.grace_period || 0;

          let penaltyMinutes = rawLateMinutes - threshold - grace;

          // Cap at max reasonable value (4 hours)
          if (penaltyMinutes > 0) {
            // ✅ LIMIT: max 30 minutes penalty per day
            const cappedMinutes = Math.min(penaltyMinutes, 30);
            late_minutes += cappedMinutes;
          }

          // Debug log (remove in production)
          console.log("Late Debug:", {
            employee: emp.employee_code,
            checkIn: row.check_in_time,
            rawLateMinutes,
            threshold,
            grace,
            penaltyMinutes: penaltyMinutes > 0 ? penaltyMinutes : 0,
          });
        }
      } else if (row.status === "HALF_DAY") {
        // Use work_fraction from DB (should be 0.5)
        workUnits = row.work_fraction || 0.5;
      } else if (row.status === "LEAVE") {
        workUnits = 0;
      } else if (!row.status || row.status === "ABSENT") {
        workUnits = 0;
      }

      total_work_units += workUnits;

      // Holiday calculation
      if (workUnits > 0 && isHoliday) {
        holiday_worked += workUnits;
        if (row.day_type === "REGULAR_HOLIDAY") {
          regular_holidays += workUnits;
        } else if (row.day_type === "SPECIAL_HOLIDAY") {
          special_holidays += workUnits;
        }
      }
    }

    // Calculate effective late minutes with grace period
    // const effectiveLateMinutes = rules?.grace_period
    //   ? Math.max(0, late_minutes - Number(rules.grace_period))
    //   : late_minutes;

    // Calculate effective late minutes (penalty minutes already account for threshold+grace)
    // No need to subtract again - just use late_minutes directly
    const effectiveLateMinutes = late_minutes;

    // FETCH EMPLOYEE-SPECIFIC LATE DEDUCTION OVERRIDE
    const empLateRes = await pool.query(
      `
      SELECT * FROM employee_deductions
      WHERE employee_id = $1
        AND type LIKE 'LATE%'
        AND is_active = true
      LIMIT 1
    `,
      [emp.id],
    );

    const empLate = empLateRes.rows[0];

    // DETERMINE DEDUCTION TYPE AND VALUE (Employee override > Global rule)
    let deductionType = rules?.late_deduction_type;
    let deductionValue = Number(rules?.late_deduction_value || 0);
    let lateDeductionEnabled = rules?.late_deduction_enabled;

    if (empLate) {
      if (empLate.type === "LATE_FIXED") {
        deductionType = "FIXED";
        deductionValue = Number(empLate.amount || 0);
        lateDeductionEnabled = true;
      } else if (empLate.type === "LATE_PER_MINUTE") {
        deductionType = "PER_MINUTE";
        deductionValue = Number(empLate.amount || 0);
        lateDeductionEnabled = true;
      } else if (empLate.type === "LATE_SALARY_BASED") {
        deductionType = "SALARY_BASED";
        lateDeductionEnabled = true;
      }
    }

    let late_deduction = 0;

    if (lateDeductionEnabled) {
      if (deductionType === "FIXED") {
        late_deduction = late_count * deductionValue;
      } else if (deductionType === "PER_MINUTE") {
        late_deduction = effectiveLateMinutes * deductionValue;
      } else if (deductionType === "SALARY_BASED") {
        let workingDays = Number(salary.working_days_per_month);

        // ✅ prevent wrong DB values
        if (!workingDays || workingDays < 20) {
          workingDays = 26;
        }

        const maxHours = rules?.max_work_hours || 8;
        const totalMinutes = workingDays * maxHours * 60;

        const perMinuteRate = monthly_salary / totalMinutes;

        console.log("RATE DEBUG:", {
          monthly_salary,
          workingDays,
          totalMinutes,
          perMinuteRate,
          effectiveLateMinutes,
        });

        late_deduction = effectiveLateMinutes * perMinuteRate;
      }
    }

    // Government deductions (EXCLUDE late deduction configs)
    const govRes = await pool.query(
      `
  SELECT COALESCE(SUM(amount), 0) AS total
  FROM employee_deductions
  WHERE employee_id = $1
    AND is_active = true
    AND type NOT LIKE 'LATE%'
`,
      [emp.id],
    );

    const government_deduction = Number(govRes.rows[0].total);
    const total_deductions = government_deduction + late_deduction;

    // CORRECTED: Basic Pay = Daily Rate × Total Work Units (supports half-day)
    const basic_pay = daily_rate * total_work_units;

    const net_salary =
      Math.max(0, basic_pay - total_deductions) +
      leave_conversion_cash +
      overtime_pay;

    // Calculate absent days for audit (full days only, not half-days)
    const absent_days = working_days_in_cutoff - Math.floor(total_work_units);

    await pool.query(
      `
      INSERT INTO payroll (
        employee_id,
        cutoff_start,
        cutoff_end,
        pay_date,
        basic_salary,
        overtime_pay,
        deductions,
        net_salary,
        late_deduction,
        absent_deduction,
        government_deduction,
        leave_conversion,
        rule_snapshot
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (employee_id, cutoff_start, cutoff_end)
      DO UPDATE SET
        overtime_pay = EXCLUDED.overtime_pay,
        deductions = EXCLUDED.deductions,
        net_salary = EXCLUDED.net_salary,
        late_deduction = EXCLUDED.late_deduction,
        absent_deduction = EXCLUDED.absent_deduction,
        leave_conversion = EXCLUDED.leave_conversion,
        rule_snapshot = EXCLUDED.rule_snapshot
      `,
      [
        emp.id,
        cutoff_start,
        cutoff_end,
        pay_date,
        basic_pay,
        overtime_pay,
        total_deductions,
        net_salary,
        late_deduction,
        0, // absent_deduction removed (already accounted in work_units)
        government_deduction,
        leave_conversion_cash,
        JSON.stringify({
          attendance_rules: rules,
          working_days_per_month,
          daily_rate,
          working_days_in_cutoff,
          total_work_units,
          absent_days,
          late_count,
          late_minutes: effectiveLateMinutes,
          total_days_in_cutoff: attendanceFull.rows.length,
          late_deduction_config: {
            type: deductionType,
            value: deductionValue,
            enabled: lateDeductionEnabled,
            has_employee_override: !!empLate,
          },
          leave_conversion: {
            converted: leave_conversion_cash > 0,
            amount: leave_conversion_cash,
            conversion_year: currentMonth === 1 ? currentYear - 1 : null,
            note: "Fetched from leave_conversions table",
          },
          overtime: {
            hours: overtime.total_hours,
            rate: overtime_rate,
            pay: overtime_pay,
            request_ids: overtime.request_ids,
            prevented_duplicate: true,
          },
          holiday_stats: {
            regular_holidays,
            special_holidays,
            holiday_worked,
          },
        }),
      ],
    );

    // MARK OVERTIME AS PAID
    if (overtime.total_hours > 0) {
      await overtimeModel.markOvertimeAsPaid(
        emp.id,
        cutoff_start,
        cutoff_end,
        null,
      );
    }
  }

  return {
    message:
      "Payroll generated with half-day support and correct salary computation!",
  };
};

// GET PAYROLL - NO NAME
const getPayroll = async (
  cutoff_start,
  cutoff_end,
  page = 1,
  limit = 10,
  search = "",
) => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.suffix,
    e.employee_code,

    -- salary
    s.basic_salary,
    s.daily_rate,
    s.overtime_rate,
    s.working_days_per_month,

    -- payroll (IMPORTANT)
    p.id AS payroll_id,
    p.net_salary,
    p.overtime_pay,
    p.deductions,
    p.leave_conversion,
    p.status,
    p.cutoff_start,
    p.cutoff_end,
    p.pay_date

  FROM employees e

  LEFT JOIN employee_salary s 
    ON s.employee_id = e.id

  -- 🔥 PUT IT HERE
  LEFT JOIN payroll p 
    ON p.employee_id = e.id
    AND p.cutoff_start::date >= $4::date
    AND p.cutoff_end::date <= $5::date

  WHERE e.status = 'ACTIVE'
  AND (
    e.first_name ILIKE $3 OR 
    e.last_name ILIKE $3 OR 
    e.employee_code ILIKE $3 OR
    CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
  )

  ORDER BY e.first_name, e.last_name
  LIMIT $1 OFFSET $2
  `,
    [limit, offset, `%${search}%`, cutoff_start, cutoff_end],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*) 
    FROM employees e
    WHERE e.status = 'ACTIVE'
    AND (
      e.first_name ILIKE $1 OR 
      e.last_name ILIKE $1 OR 
      e.employee_code ILIKE $1 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
    )
    `,
    [`%${search}%`],
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

// GET PAYROLL SUMMARY - No changes needed
const getPayrollSummary = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    SELECT 
      COUNT(*) AS total_employees,
      COALESCE(SUM(net_salary), 0) AS total_payout,
      COALESCE(SUM(deductions), 0) AS total_deductions
    FROM payroll
    WHERE cutoff_start >= $1 
    AND cutoff_end <= $2
  `,
    [cutoff_start, cutoff_end],
  );

  return result.rows[0];
};

// MARK AS PAID - FIXED
const markAsPaid = async (id) => {
  const result = await pool.query(
    `
    UPDATE payroll 
    SET status = 'PAID' 
    WHERE id = $1 AND status != 'PAID' 
    RETURNING *
    `,
    [id],
  );
  return result.rows[0];
};

// MARK ALL AS PAID - FIXED
const markAllAsPaid = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    UPDATE payroll
    SET status = 'PAID'
    WHERE cutoff_start::date = $1::date
    AND cutoff_end::date = $2::date
    AND status != 'PAID'   
    RETURNING *
    `,
    [cutoff_start, cutoff_end],
  );

  if (result.rowCount === 0) {
    throw new Error("No payroll found for this cutoff");
  }

  return {
    message: "All payroll marked as paid",
    count: result.rowCount,
    data: result.rows,
  };
};

// GET PAYROLL DETAILS - FIXED (removed the stray '-')
const getPayrollDetails = async (id) => {
  const payrollRes = await pool.query(
    `
    SELECT 
      p.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.sss_number,
      e.philhealth_number,
      e.hdmf_number,
      e.tin_number,
      s.basic_salary AS monthly_salary  
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN employee_salary s ON s.employee_id = e.id
    WHERE p.id = $1
    `,
    [id],
  );

  const payroll = payrollRes.rows[0];

  if (!payroll) throw new Error("Payroll not found");

  if (payroll.rule_snapshot) {
    try {
      payroll.rule_snapshot =
        typeof payroll.rule_snapshot === "string"
          ? JSON.parse(payroll.rule_snapshot)
          : payroll.rule_snapshot;
    } catch (err) {
      console.error("Invalid rule_snapshot JSON:", err);
      payroll.rule_snapshot = null;
    }
  }

  const deductionsRes = await pool.query(
    `
    SELECT type, amount
FROM employee_deductions
WHERE employee_id = $1 
AND is_active = true
AND type NOT LIKE 'LATE%'
    `,
    [payroll.employee_id],
  );

  payroll.deductions_list = deductionsRes.rows;

  return payroll;
};

// GET EMPLOYEE SALARY - NO NAME
const getEmployeeSalary = async (page = 1, limit = 10, search = "") => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      s.basic_salary,
      s.daily_rate,
      s.overtime_rate,
      s.working_days_per_month
    FROM employees e
    LEFT JOIN employee_salary s ON s.employee_id = e.id
    WHERE 
      e.first_name ILIKE $3 OR 
      e.last_name ILIKE $3 OR 
      e.employee_code ILIKE $3 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
    ORDER BY e.first_name, e.last_name
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, `%${search}%`],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*) 
    FROM employees e
    WHERE 
      e.first_name ILIKE $1 OR 
      e.last_name ILIKE $1 OR 
      e.employee_code ILIKE $1 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
    `,
    [`%${search}%`],
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

// UPDATE EMPLOYEE SALARY
const updateEmployeeSalary = async (id, data) => {
  const { basic_salary, overtime_rate, working_days_per_month } = data;
  const working_days = Number(working_days_per_month || 26);
  const daily_rate = basic_salary / working_days;

  const result = await pool.query(
    `
    INSERT INTO employee_salary 
    (employee_id, basic_salary, daily_rate, overtime_rate, working_days_per_month)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (employee_id)
    DO UPDATE SET
      basic_salary = EXCLUDED.basic_salary,
      daily_rate = EXCLUDED.daily_rate,
      overtime_rate = EXCLUDED.overtime_rate,
      working_days_per_month = EXCLUDED.working_days_per_month
    RETURNING *
  `,
    [id, basic_salary, daily_rate, overtime_rate, working_days],
  );

  return result.rows[0];
};

// GET DEDUCTIONS
const getDeductions = async (employee_id) => {
  const result = await pool.query(
    `SELECT * FROM employee_deductions WHERE employee_id = $1`,
    [employee_id],
  );
  return result.rows;
};

// CREATE DEDUCTION
const createDeduction = async (data) => {
  const { employee_id, type, amount } = data;
  const result = await pool.query(
    `
    INSERT INTO employee_deductions (employee_id, type, amount, is_active)
    VALUES ($1, $2, $3, true)
    RETURNING *
  `,
    [employee_id, type, amount],
  );
  return result.rows[0];
};

// UPDATE DEDUCTION
const updateDeduction = async (id, data) => {
  const { type, amount } = data;
  const result = await pool.query(
    `
    UPDATE employee_deductions
    SET type = $1, amount = $2
    WHERE id = $3
    RETURNING *
  `,
    [type, amount, id],
  );
  return result.rows[0];
};

// DELETE DEDUCTION
const deleteDeduction = async (id) => {
  await pool.query(`DELETE FROM employee_deductions WHERE id = $1`, [id]);
  return { message: "Deleted" };
};

// DELETE PAYROLL BY CUTOFF
const deletePayrollByCutoff = async (cutoff_start, cutoff_end, pay_date) => {
  const result = await pool.query(
    `
    DELETE FROM payroll
    WHERE cutoff_start::date = $1::date
    AND cutoff_end::date = $2::date
    AND pay_date::date = $3::date
    RETURNING *
  `,
    [cutoff_start, cutoff_end, pay_date],
  );

  if (result.rowCount === 0) {
    throw new Error("No matching payroll found to delete");
  }

  return { message: "Payroll deleted successfully" };
};

// GET MY PAYROLL - NO NAME
const getMyPayroll = async (employee_id, cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'type', d.type,
              'amount', d.amount
            )
          )
          FROM employee_deductions d
          WHERE d.employee_id = p.employee_id
          AND d.is_active = true
        ),
        '[]'
      ) AS deductions_list
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.employee_id = $1
    AND p.cutoff_start >= $2 
    AND p.cutoff_end <= $3
    ORDER BY p.cutoff_start DESC
  `,
    [employee_id, cutoff_start, cutoff_end],
  );

  return result.rows;
};

// GET MY SALARY DETAILS
const getMySalaryDetails = async (employee_id) => {
  const result = await pool.query(
    `
    SELECT 
      s.basic_salary,
      s.daily_rate,
      s.overtime_rate,
      COALESCE(SUM(d.amount), 0) AS total_deductions
    FROM employee_salary s
    LEFT JOIN employee_deductions d ON d.employee_id = s.employee_id AND d.is_active = true
    WHERE s.employee_id = $1
    GROUP BY s.basic_salary, s.daily_rate, s.overtime_rate
  `,
    [employee_id],
  );

  return result.rows[0] || null;
};

module.exports = {
  generatePayroll,
  getPayroll,
  getPayrollSummary,
  markAsPaid,
  markAllAsPaid,
  getEmployeeSalary,
  updateEmployeeSalary,
  getDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  deletePayrollByCutoff,
  getMyPayroll,
  getMySalaryDetails,
  getPayrollDetails,
};
