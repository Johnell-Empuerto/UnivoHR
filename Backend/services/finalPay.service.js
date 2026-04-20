const pool = require("../config/db");
const leaveConversionService = require("./leaveConversion.service");

// ============================================
// SHARED UTILITY - Calculate Work Units
// ============================================
/**
 * Calculate work units for an employee between dates
 * @param {number} employeeId - Employee ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Work units breakdown
 */
const calculateWorkUnits = async (employeeId, startDate, endDate) => {
  const result = await pool.query(
    `
    SELECT 
      d.date,
      a.status,
      a.work_fraction,
      COALESCE(c.day_type, 'REGULAR') AS day_type
    FROM generate_series($1::date, $2::date, interval '1 day') d(date)
    LEFT JOIN attendance a 
      ON a.date = d.date AND a.employee_id = $3
    LEFT JOIN calendar_days c 
      ON c.date = d.date
    ORDER BY d.date
    `,
    [startDate, endDate, employeeId],
  );

  let total_work_units = 0;
  let present_days = 0;
  let late_days = 0;
  let half_days = 0;
  let leave_days = 0;
  let absent_days = 0;
  let holiday_worked = 0;

  for (const row of result.rows) {
    const isWorkingDay =
      row.day_type !== "REST_DAY" && row.day_type !== "NON_WORKING";
    const isHoliday =
      row.day_type === "REGULAR_HOLIDAY" || row.day_type === "SPECIAL_HOLIDAY";

    // Skip non-working days that are not holidays
    if (!isWorkingDay && !isHoliday) continue;

    // 🔥 FIX: Skip holiday if no attendance (only count if worked)
    if (isHoliday && !row.status) continue;

    let workUnits = 0;

    if (row.status === "PRESENT") {
      workUnits = 1;
      present_days++;
      if (isHoliday) holiday_worked++;
    } else if (row.status === "LATE") {
      workUnits = 1;
      late_days++;
      if (isHoliday) holiday_worked++;
    } else if (row.status === "HALF_DAY") {
      workUnits = row.work_fraction || 0.5;
      half_days++;
      if (isHoliday) holiday_worked += workUnits;
    } else if (row.status === "LEAVE") {
      workUnits = 1; // ✅ Paid leave
      leave_days++;
    } else if (!row.status || row.status === "ABSENT") {
      workUnits = 0;
      absent_days++;
    }

    total_work_units += workUnits;
  }

  return {
    total_work_units,
    breakdown: {
      present_days,
      late_days,
      half_days,
      leave_days,
      absent_days,
      holiday_worked,
    },
  };
};

// ============================================
// GET EMPLOYEES FOR FINAL PAY
// ============================================
// ============================================
// GET EMPLOYEES FOR FINAL PAY (WITH PAGINATION)
// ============================================
const getEmployeesForFinalPay = async (page = 1, limit = 10, search = "") => {
  const offset = (page - 1) * limit;
  const searchValue = `%${search}%`;

  // Data query with pagination
  const dataQuery = await pool.query(
    `
    SELECT 
      e.id,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.status,
      e.resignation_date,
      e.termination_date,
      e.last_working_date,
      e.final_pay_processed,
      e.final_pay_date,
      e.final_pay_amount,
      s.basic_salary,
      s.daily_rate,
      s.working_days_per_month,
      lc.vacation_leave,
      lc.used_vacation_leave,
      lc.sick_leave,
      lc.used_sick_leave
    FROM employees e
    LEFT JOIN employee_salary s ON e.id = s.employee_id
    LEFT JOIN leave_credits lc ON e.id = lc.employee_id
    WHERE e.status IN ('RESIGNED', 'TERMINATED')
    AND (e.final_pay_processed IS NULL OR e.final_pay_processed = false)
    AND (
      $3 = '' OR 
      e.first_name ILIKE $3 OR 
      e.last_name ILIKE $3 OR 
      e.employee_code ILIKE $3 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
    )
    ORDER BY 
      CASE WHEN e.status = 'RESIGNED' THEN 1 ELSE 2 END,
      e.resignation_date DESC NULLS LAST,
      e.termination_date DESC NULLS LAST
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchValue],
  );

  // Count query for pagination
  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM employees e
    WHERE e.status IN ('RESIGNED', 'TERMINATED')
    AND (e.final_pay_processed IS NULL OR e.final_pay_processed = false)
    AND (
      $1 = '' OR 
      e.first_name ILIKE $1 OR 
      e.last_name ILIKE $1 OR 
      e.employee_code ILIKE $1 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
    )
    `,
    [searchValue],
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

// ============================================
// CALCULATE FINAL PAY (ATTENDANCE-BASED)
// ============================================
// ============================================
// CALCULATE FINAL PAY (ATTENDANCE-BASED)
// ============================================
const calculateFinalPay = async (employeeId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get employee details
    const employeeRes = await client.query(
      `
      SELECT 
        e.*,
        s.basic_salary,
        s.daily_rate,
        s.working_days_per_month,
        lc.vacation_leave,
        lc.used_vacation_leave,
        lc.sick_leave,
        lc.used_sick_leave
      FROM employees e
      LEFT JOIN employee_salary s ON e.id = s.employee_id
      LEFT JOIN leave_credits lc ON e.id = lc.employee_id
      WHERE e.id = $1 AND e.status IN ('RESIGNED', 'TERMINATED')
      `,
      [employeeId],
    );

    if (employeeRes.rows.length === 0) {
      throw new Error("Employee not found or not resigned/terminated");
    }

    const emp = employeeRes.rows[0];

    // 🔥 FIX: Get last working date with proper timezone handling
    let lastWorkingDateRaw =
      emp.last_working_date || emp.resignation_date || emp.termination_date;

    if (!lastWorkingDateRaw) {
      throw new Error("No resignation/termination date found");
    }

    // 🔥 CRITICAL FIX: Convert to YYYY-MM-DD format without timezone issues
    const formatDateOnly = (dateValue) => {
      if (!dateValue) return null;
      // If it's a Date object or string, extract just the date part
      const d = new Date(dateValue);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const lastWorkingDate = formatDateOnly(lastWorkingDateRaw);

    console.log(`[Final Pay] Raw date: ${lastWorkingDateRaw}`);
    console.log(`[Final Pay] Formatted date: ${lastWorkingDate}`);

    // Calculate daily rate
    const dailyRate =
      emp.daily_rate || emp.basic_salary / (emp.working_days_per_month || 26);

    // 🔥 FIX: Calculate start of month using the formatted date
    const lastWorkingDateObj = new Date(lastWorkingDate);
    const startOfMonth = new Date(
      lastWorkingDateObj.getFullYear(),
      lastWorkingDateObj.getMonth(),
      1,
    );
    const startDate = formatDateOnly(startOfMonth);

    console.log(`[Final Pay] Start date: ${startDate}`);
    console.log(`[Final Pay] End date: ${lastWorkingDate}`);

    // 🔥 USE SHARED FUNCTION for work units
    const workUnitsResult = await calculateWorkUnits(
      employeeId,
      startDate,
      lastWorkingDate,
    );

    const { total_work_units, breakdown } = workUnitsResult;

    // Calculate salary based on ACTUAL work units
    const salaryUntilLastDay = total_work_units * dailyRate;

    // For display: show as decimal or integer
    const displayWorkUnits =
      total_work_units % 1 === 0
        ? total_work_units
        : total_work_units.toFixed(1);

    console.log(`[Final Pay] Employee ${employeeId}:`);
    console.log(`  - Last Working Date: ${lastWorkingDate}`);
    console.log(
      `  - Work Units: ${total_work_units} (${displayWorkUnits} days equivalent)`,
    );
    console.log(`  - Present: ${breakdown.present_days}`);
    console.log(`  - Late: ${breakdown.late_days}`);
    console.log(`  - Half Days: ${breakdown.half_days}`);
    console.log(`  - Leave Days: ${breakdown.leave_days}`);
    console.log(`  - Absent: ${breakdown.absent_days}`);
    console.log(`  - Holiday Worked: ${breakdown.holiday_worked}`);
    console.log(`  - Daily Rate: ${dailyRate}`);
    console.log(`  - Salary: ${salaryUntilLastDay}`);

    // Calculate unused vacation leave
    const unusedVL = (emp.vacation_leave || 0) - (emp.used_vacation_leave || 0);

    // Process leave conversion with FALLBACK
    let leaveConversionAmount = 0;
    if (unusedVL > 0) {
      try {
        const conversionResult =
          await leaveConversionService.processEmployeeLeaveConversion(
            employeeId,
            new Date().getFullYear(),
            emp.status === "RESIGNED" ? "RESIGNATION" : "TERMINATION",
          );

        if (conversionResult.success) {
          leaveConversionAmount = conversionResult.data.amount;
          console.log(
            `[Final Pay] Leave conversion successful: ₱${leaveConversionAmount}`,
          );
        } else {
          // 🔥 FALLBACK
          console.log(
            `[Final Pay] Conversion failed: ${conversionResult.message}`,
          );
          leaveConversionAmount = unusedVL * dailyRate;
          console.log(
            `[Final Pay] FALLBACK: ${unusedVL} days × ${dailyRate} = ₱${leaveConversionAmount}`,
          );
        }
      } catch (error) {
        console.error(`[Final Pay] Conversion error:`, error.message);
        leaveConversionAmount = unusedVL * dailyRate;
        console.log(
          `[Final Pay] FALLBACK: ${unusedVL} days × ${dailyRate} = ₱${leaveConversionAmount}`,
        );
      }
    }

    // Calculate total final pay
    const totalFinalPay = salaryUntilLastDay + leaveConversionAmount;

    await client.query("COMMIT");

    return {
      success: true,
      data: {
        employee_id: employeeId,
        employee_name:
          `${emp.first_name} ${emp.last_name} ${emp.suffix || ""}`.trim(),
        status: emp.status,
        resignation_date: emp.resignation_date
          ? formatDateOnly(emp.resignation_date)
          : null,
        termination_date: emp.termination_date
          ? formatDateOnly(emp.termination_date)
          : null,
        last_working_date: lastWorkingDate,
        // 🔥 Use work_units (not days) for accuracy
        work_units: parseFloat(total_work_units.toFixed(2)),
        // For display purposes
        display_days: displayWorkUnits,
        breakdown: {
          present_days: breakdown.present_days,
          late_days: breakdown.late_days,
          half_days: breakdown.half_days,
          leave_days: breakdown.leave_days,
          absent_days: breakdown.absent_days,
          holiday_worked: breakdown.holiday_worked,
        },
        daily_rate: dailyRate,
        salary_until_last_day: parseFloat(salaryUntilLastDay.toFixed(2)),
        unused_vacation_leave: unusedVL,
        leave_conversion_amount: parseFloat(leaveConversionAmount.toFixed(2)),
        total_final_pay: parseFloat(totalFinalPay.toFixed(2)),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ============================================
// PROCESS FINAL PAY
// ============================================
const processFinalPay = async (employeeId, processedBy) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const calculation = await calculateFinalPay(employeeId);

    if (!calculation.success) {
      throw new Error("Failed to calculate final pay");
    }

    const data = calculation.data;

    const result = await client.query(
      `
      INSERT INTO final_pay (
        employee_id,
        resignation_date,
        termination_date,
        last_working_date,
        days_worked,
        salary_until_last_day,
        leave_conversion_amount,
        total_amount,
        processed_by,
        processed_at,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'PROCESSED')
      RETURNING *
      `,
      [
        employeeId,
        data.resignation_date,
        data.termination_date,
        data.last_working_date,
        data.work_units, // Store as work_units
        data.salary_until_last_day,
        data.leave_conversion_amount,
        data.total_final_pay,
        processedBy,
      ],
    );

    await client.query(
      `
      UPDATE employees 
      SET final_pay_processed = true, 
          final_pay_date = NOW(),
          final_pay_amount = $1
      WHERE id = $2
      `,
      [data.total_final_pay, employeeId],
    );

    await client.query("COMMIT");

    return {
      success: true,
      message: `Final pay processed successfully for ${data.employee_name}`,
      data: result.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ============================================
// GET FINAL PAY HISTORY
// ============================================
const getFinalPayHistory = async (page = 1, limit = 10, search = "") => {
  const offset = (page - 1) * limit;

  const dataQuery = await pool.query(
    `
    SELECT 
      fp.*,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.suffix,
      e.employee_code,
      e.status,
      u.username as processed_by_name
    FROM final_pay fp
    JOIN employees e ON e.id = fp.employee_id
    LEFT JOIN users u ON u.id = fp.processed_by
    WHERE 
      e.first_name ILIKE $3 OR 
      e.last_name ILIKE $3 OR 
      e.employee_code ILIKE $3
    ORDER BY fp.processed_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, `%${search}%`],
  );

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM final_pay fp
    JOIN employees e ON e.id = fp.employee_id
    WHERE 
      e.first_name ILIKE $1 OR 
      e.last_name ILIKE $1 OR 
      e.employee_code ILIKE $1
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

// ============================================
// GET FINAL PAY BY ID
// ============================================
const getFinalPayById = async (id) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        fp.*,
        e.first_name,
        e.last_name,
        e.middle_name,
        e.suffix,
        e.employee_code,
        e.status,
        u.username as processed_by_name
      FROM final_pay fp
      JOIN employees e ON e.id = fp.employee_id
      LEFT JOIN users u ON u.id = fp.processed_by
      WHERE fp.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Final pay record not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

// ============================================
// DOWNLOAD FINAL PAY SLIP
// ============================================
const downloadFinalPaySlip = async (id, res) => {
  const { generateFinalPaySlip } = require("../utils/finalPaySlipGenerator");

  try {
    const result = await pool.query(
      `
      SELECT 
        fp.*,
        e.first_name,
        e.last_name,
        e.middle_name,
        e.suffix,
        e.employee_code,
        e.status,
        e.sss_number,
        e.philhealth_number,
        e.hdmf_number,
        e.tin_number,
        s.basic_salary,
        s.daily_rate
      FROM final_pay fp
      JOIN employees e ON e.id = fp.employee_id
      LEFT JOIN employee_salary s ON s.employee_id = e.id
      WHERE fp.id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error("Final pay record not found");
    }

    const record = result.rows[0];
    await generateFinalPaySlip(res, record);
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getEmployeesForFinalPay,
  calculateFinalPay,
  processFinalPay,
  getFinalPayHistory,
  getFinalPayById,
  downloadFinalPaySlip,
  calculateWorkUnits,
};
