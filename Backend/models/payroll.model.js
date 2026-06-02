const pool = require("../config/db");
const attendanceModel = require("./attendance.model");
const overtimeModel = require("./overtime.model");

// ============================================
// GENERATE PAYROLL (FULLY OPTIMIZED - NO N+1 QUERIES + TRANSACTIONS)
// ============================================
const generatePayroll = async (cutoff_start, cutoff_end, pay_date, branch_id = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // DELETE OLD UNPAID PAYROLL FIRST (optional branch filter)
    await client.query(
      `
      DELETE FROM payroll
      WHERE cutoff_start = $1::date
        AND cutoff_end = $2::date
        AND status = 'UNPAID'
        AND ($3::int IS NULL OR branch_id = $3::int)
    `,
      [cutoff_start, cutoff_end, branch_id],
    );

    // 1. FETCH PAY RULES (MULTIPLIERS)
    const payRulesRes = await client.query(`
      SELECT day_type, multiplier 
      FROM pay_rules
    `);

    const payRulesMap = {};
    payRulesRes.rows.forEach((rule) => {
      payRulesMap[rule.day_type] = Number(rule.multiplier);
    });

    const DEFAULT_MULTIPLIER = 1;

    // 2. FETCH COMPANY SETTINGS
    const settingsRes = await client.query(`
      SELECT conversion_rate, enforce_sil, sil_min_days 
      FROM company_settings 
      LIMIT 1
    `);

    const { conversion_rate, enforce_sil, sil_min_days } = settingsRes
      .rows[0] || { conversion_rate: 1, enforce_sil: false, sil_min_days: 0 };

    // 3. GET ACTIVE EMPLOYEES (optional branch filter)
    const employees = await client.query(
      `
      SELECT e.*
      FROM employees e
      WHERE e.status = 'ACTIVE'
        AND ($1::int IS NULL OR e.branch_id = $1::int)
    `,
      [branch_id],
    );

    if (employees.rows.length === 0) {
      await client.query("ROLLBACK");
      return { message: "No active employees found" };
    }

    const employeeIds = employees.rows.map((e) => e.id);

    // ============================================
    // BATCH 1: FETCH ALL SALARIES (1 query instead of N)
    // ============================================
    const salaryRes = await client.query(
      `
      SELECT * FROM employee_salary 
      WHERE employee_id = ANY($1::int[])
    `,
      [employeeIds],
    );

    const salaryMap = new Map();
    salaryRes.rows.forEach((row) => {
      salaryMap.set(row.employee_id, row);
    });

    // ============================================
    // BATCH 2: FETCH ALL LEAVE CREDITS (1 query instead of N)
    // ============================================
    const leaveCreditsRes = await client.query(
      `
      SELECT * FROM leave_credits 
      WHERE employee_id = ANY($1::int[])
    `,
      [employeeIds],
    );

    const leaveCreditsMap = new Map();
    leaveCreditsRes.rows.forEach((row) => {
      leaveCreditsMap.set(row.employee_id, row);
    });

    // ============================================
    // BATCH 3: FETCH ALL LEAVE TYPES DEFAULTS (1 query)
    // ============================================
    const defaultLeaveTypesRes = await client.query(`
      SELECT code, default_days FROM leave_types
    `);
    const defaultLeaveTypes = {};
    defaultLeaveTypesRes.rows.forEach((d) => {
      defaultLeaveTypes[d.code] = d.default_days;
    });

    // ============================================
    // BATCH 4: FETCH ALL LEAVE REQUESTS FOR ALL EMPLOYEES (1 query instead of N)
    // ============================================
    const leaveRequestsRes = await client.query(
      `
      SELECT 
        l.employee_id,
        l.from_date,
        l.to_date,
        lt.is_paid,
        lt.name,
        lt.code
      FROM leaves l
      JOIN leave_types lt ON lt.code = l.type
      WHERE l.employee_id = ANY($1::int[])
        AND l.status = 'APPROVED'
        AND (
          (l.from_date BETWEEN $2::date AND $3::date)
          OR (l.to_date BETWEEN $2::date AND $3::date)
          OR ($2::date BETWEEN l.from_date AND l.to_date)
        )
    `,
      [employeeIds, cutoff_start, cutoff_end],
    );

    // Build leave map per employee: employee_id -> Map(date -> leaveInfo)
    const employeeLeaveMap = new Map();
    for (const leave of leaveRequestsRes.rows) {
      const startDate = new Date(leave.from_date);
      const endDate = new Date(leave.to_date);

      if (!employeeLeaveMap.has(leave.employee_id)) {
        employeeLeaveMap.set(leave.employee_id, new Map());
      }

      const leaveMap = employeeLeaveMap.get(leave.employee_id);

      // Mark all dates in the leave range
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toLocaleDateString("en-CA");
        if (!leaveMap.has(dateStr)) {
          leaveMap.set(dateStr, {
            is_paid: leave.is_paid,
            name: leave.name,
            code: leave.code,
          });
        }
      }
    }

    // ============================================
    // BATCH 5: FETCH ALL EMPLOYEE DEDUCTIONS (1 query instead of N)
    // ============================================
    const deductionsRes = await client.query(
      `
      SELECT * FROM employee_deductions 
      WHERE employee_id = ANY($1::int[])
        AND is_active = true
    `,
      [employeeIds],
    );

    // Group deductions by employee_id
    const deductionsByEmployee = new Map();
    deductionsRes.rows.forEach((row) => {
      if (!deductionsByEmployee.has(row.employee_id)) {
        deductionsByEmployee.set(row.employee_id, []);
      }
      deductionsByEmployee.get(row.employee_id).push(row);
    });

    // Separate government and late deductions
    const govDeductionsByEmployee = new Map();
    const lateDeductionsByEmployee = new Map();

    for (const [empId, deductions] of deductionsByEmployee) {
      govDeductionsByEmployee.set(empId, 0);
      for (const ded of deductions) {
        if (ded.type.startsWith("LATE")) {
          if (!lateDeductionsByEmployee.has(empId)) {
            lateDeductionsByEmployee.set(empId, ded);
          }
        } else {
          govDeductionsByEmployee.set(
            empId,
            (govDeductionsByEmployee.get(empId) || 0) + Number(ded.amount),
          );
        }
      }
    }

    // ============================================
    // BATCH 6: FETCH ALL LEAVE CONVERSIONS (1 query instead of N)
    // ============================================
    const currentDate = new Date(pay_date);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const conversionYear = currentYear - 1;

    let conversionMap = new Map();
    if (currentMonth === 1) {
      const conversionRes = await client.query(
        `
        SELECT employee_id, COALESCE(SUM(amount), 0) as total_amount
        FROM leave_conversions
        WHERE employee_id = ANY($1::int[]) AND year = $2
        GROUP BY employee_id
      `,
        [employeeIds, conversionYear],
      );

      conversionRes.rows.forEach((row) => {
        conversionMap.set(row.employee_id, parseFloat(row.total_amount));
      });
    }

    // ============================================
    // BATCH 7: FETCH ALL ATTENDANCE DATA (1 query instead of N)
    // ============================================
    // Generate all dates in range once
    const allDates = [];
    let startDate = new Date(cutoff_start);
    let endDate = new Date(cutoff_end);
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      allDates.push(d.toLocaleDateString("en-CA"));
    }

    // Fetch all attendance for all employees in one query
    const attendanceRes = await client.query(
      `
      SELECT 
        employee_id,
        date,
        status,
        check_in_time,
        check_out_time,
        work_fraction,
        shift_id
      FROM attendance
      WHERE employee_id = ANY($1::int[])
        AND date BETWEEN $2::date AND $3::date
    `,
      [employeeIds, cutoff_start, cutoff_end],
    );

    // Group attendance by employee_id and date
    const attendanceByEmployee = new Map();
    attendanceRes.rows.forEach((row) => {
      if (!attendanceByEmployee.has(row.employee_id)) {
        attendanceByEmployee.set(row.employee_id, new Map());
      }
      const dateStr = row.date.toLocaleDateString("en-CA");
      attendanceByEmployee.get(row.employee_id).set(dateStr, row);
    });

    // Fetch calendar days (day types) for all dates once
    const calendarDaysRes = await client.query(
      `
      SELECT date, day_type
      FROM calendar_days
      WHERE date BETWEEN $1::date AND $2::date
    `,
      [cutoff_start, cutoff_end],
    );

    const calendarDayMap = new Map();
    calendarDaysRes.rows.forEach((row) => {
      const dateStr = row.date.toLocaleDateString("en-CA");
      calendarDayMap.set(dateStr, row.day_type);
    });

    // ============================================
    // BATCH 8: GET ACTIVE ATTENDANCE RULES (1 query, cached)
    // ============================================
    const rules = await attendanceModel.getRules();

    // ============================================
    // BATCH 9a: FETCH ALL SHIFTS (for shift-aware late calculation)
    // ============================================
    const shiftsRes = await client.query(`SELECT * FROM shift_schedules`);
    const shiftMap = new Map();
    shiftsRes.rows.forEach((s) => {
      shiftMap.set(s.id, s);
    });

    // ============================================
    // BATCH 9b: FETCH EMPLOYEE SHIFT ASSIGNMENTS (for records without shift_id)
    // ============================================
    const shiftAssignmentsRes = await client.query(`
      SELECT employee_id, shift_id, effective_date, end_date
      FROM employee_shift_assignments
      WHERE employee_id = ANY($1::int[])
        AND effective_date <= $2::date
        AND (end_date IS NULL OR end_date >= $3::date)
    `, [employeeIds, cutoff_end, cutoff_start]);

    const shiftAssignmentsByEmployee = new Map();
    for (const row of shiftAssignmentsRes.rows) {
      if (!shiftAssignmentsByEmployee.has(row.employee_id)) {
        shiftAssignmentsByEmployee.set(row.employee_id, []);
      }
      shiftAssignmentsByEmployee.get(row.employee_id).push(row);
    }
    for (const assignments of shiftAssignmentsByEmployee.values()) {
      assignments.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
    }

    // ============================================
    // BATCH 9c: FETCH REST DAY CONFIGURATION (for REST_DAY payroll activation, Phase 2D.2)
    // ============================================
    const empRestDaysRes = await client.query(`
      SELECT employee_id, day_of_week
      FROM employee_rest_days
      WHERE employee_id = ANY($1::int[])
        AND effective_date <= $2::date
        AND (end_date IS NULL OR end_date >= $3::date)
    `, [employeeIds, cutoff_end, cutoff_start]);

    const empRestDaysByEmployee = new Map();
    for (const row of empRestDaysRes.rows) {
      if (!empRestDaysByEmployee.has(row.employee_id)) {
        empRestDaysByEmployee.set(row.employee_id, new Set());
      }
      empRestDaysByEmployee.get(row.employee_id).add(row.day_of_week);
    }

    const branchRestDaysRes = await client.query(`
      SELECT branch_id, day_of_week
      FROM branch_rest_days
      WHERE is_active = true
    `);

    const branchRestDaysByBranch = new Map();
    for (const row of branchRestDaysRes.rows) {
      if (!branchRestDaysByBranch.has(row.branch_id)) {
        branchRestDaysByBranch.set(row.branch_id, new Set());
      }
      branchRestDaysByBranch.get(row.branch_id).add(row.day_of_week);
    }

    // ============================================
    // BATCH 9d: FETCH PAYROLL RULES (night differential, future rates)
    // ============================================
    const payrollRulesRes = await client.query(
      `SELECT rule_key, rule_value FROM payroll_rules`,
    );

    const payrollRulesMap = new Map();
    payrollRulesRes.rows.forEach((r) => {
      payrollRulesMap.set(r.rule_key, Number(r.rule_value));
    });

    // ============================================
    // BATCH 9e: FETCH ROTATION GROUP DATA (for rotation shift resolution, Phase 2G.1)
    // ============================================
    const empRotationGroupRes = await client.query(`
      SELECT employee_id, rotation_group_id
      FROM employee_rotation_group_assignments
      WHERE employee_id = ANY($1::int[])
        AND effective_date <= $2::date
        AND (end_date IS NULL OR end_date >= $3::date)
    `, [employeeIds, cutoff_end, cutoff_start]);

    const employeeRotationGroupMap = new Map();
    for (const row of empRotationGroupRes.rows) {
      employeeRotationGroupMap.set(row.employee_id, row.rotation_group_id);
    }

    const groupIds = [...new Set(empRotationGroupRes.rows.map(r => r.rotation_group_id))];

    const rotationAssignmentsByGroup = new Map();
    if (groupIds.length > 0) {
      const assignRes = await client.query(`
        SELECT rga.*, rp.cycle_days
        FROM rotation_group_assignments rga
        JOIN rotation_patterns rp ON rp.id = rga.pattern_id
        WHERE rga.group_id = ANY($1::int[])
          AND rga.effective_date <= $2::date
          AND (rga.end_date IS NULL OR rga.end_date >= $3::date)
      `, [groupIds, cutoff_end, cutoff_start]);

      for (const row of assignRes.rows) {
        if (!rotationAssignmentsByGroup.has(row.group_id)) {
          rotationAssignmentsByGroup.set(row.group_id, []);
        }
        rotationAssignmentsByGroup.get(row.group_id).push(row);
      }
      for (const assignments of rotationAssignmentsByGroup.values()) {
        assignments.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date));
      }
    }

    const patternIds = [...new Set(
      [...rotationAssignmentsByGroup.values()]
        .flatMap(a => a.map(r => r.pattern_id))
    )];

    const rotationStepsByPattern = new Map();
    if (patternIds.length > 0) {
      const stepsRes = await client.query(`
        SELECT * FROM rotation_pattern_steps
        WHERE pattern_id = ANY($1::int[])
        ORDER BY pattern_id, day_offset ASC
      `, [patternIds]);

      for (const row of stepsRes.rows) {
        if (!rotationStepsByPattern.has(row.pattern_id)) {
          rotationStepsByPattern.set(row.pattern_id, new Map());
        }
        rotationStepsByPattern.get(row.pattern_id).set(row.day_offset, row);
      }
    }

    // ============================================
    // BATCH 10: FETCH OVERTIME DATA FOR ALL EMPLOYEES (1 query)
    // ============================================
    const overtimeRes = await client.query(
      `
      SELECT 
        o.employee_id,
        COALESCE(SUM(o.hours), 0) as total_hours,
        array_agg(o.id) as request_ids
      FROM overtime_requests o
      WHERE o.employee_id = ANY($1::int[])
        AND o.status = 'APPROVED'
        AND o.is_paid = FALSE
        AND o.date BETWEEN $2::date AND $3::date
      GROUP BY o.employee_id
    `,
      [employeeIds, cutoff_start, cutoff_end],
    );

    const overtimeMap = new Map();
    overtimeRes.rows.forEach((row) => {
      overtimeMap.set(row.employee_id, {
        total_hours: parseFloat(row.total_hours),
        request_ids: row.request_ids || [],
      });
    });

    // For employees with no overtime, provide default
    for (const empId of employeeIds) {
      if (!overtimeMap.has(empId)) {
        overtimeMap.set(empId, { total_hours: 0, request_ids: [] });
      }
    }

    // ============================================
    // HELPER: Resolve shift for a date (attendance.shift_id OR employee_shift_assignments OR rotation)
    // ============================================
    const resolveShiftForDate = (employeeId, date) => {
      const dateStr = date.toLocaleDateString("en-CA");
      const dateObj = new Date(dateStr);

      // Step 1: Direct assignment
      const assignments = shiftAssignmentsByEmployee.get(employeeId);
      if (assignments) {
        for (const assignment of assignments) {
          const effDate = new Date(assignment.effective_date);
          if (effDate <= dateObj) {
            if (!assignment.end_date || new Date(assignment.end_date) >= dateObj) {
              return shiftMap.get(assignment.shift_id) || null;
            }
          }
        }
      }

      // Step 2: Rotation group fallback
      const groupId = employeeRotationGroupMap.get(employeeId);
      if (!groupId) return null;

      const groupAssignments = rotationAssignmentsByGroup.get(groupId);
      if (!groupAssignments) return null;

      for (const ga of groupAssignments) {
        const effDate = new Date(ga.effective_date);
        if (effDate <= dateObj) {
          if (!ga.end_date || new Date(ga.end_date) >= dateObj) {
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysSinceStart = Math.floor((dateObj - effDate) / msPerDay);
            const dayOffset = ((daysSinceStart % ga.cycle_days) + ga.cycle_days) % ga.cycle_days;

            const steps = rotationStepsByPattern.get(ga.pattern_id);
            const step = steps ? steps.get(dayOffset) : null;
            if (step && !step.is_rest_day) {
              return shiftMap.get(step.shift_id) || null;
            }
            return null;
          }
        }
      }

      return null;
    };

    // ============================================
    // PROCESS EACH EMPLOYEE (WITHIN TRANSACTION)
    // ============================================
    let processedCount = 0;

    for (const emp of employees.rows) {
      // Get salary (from memory)
      const salary = salaryMap.get(emp.id);
      if (!salary) continue;

      // Get leave credits (from memory)
      let credits = leaveCreditsMap.get(emp.id);

      // Create leave credits if missing (this still requires DB write)
      if (!credits) {
        await client.query(
          `INSERT INTO leave_credits (employee_id, vacation_leave, used_vacation_leave, last_conversion_year)
           VALUES ($1, $2, 0, NULL)
           ON CONFLICT (employee_id) DO NOTHING`,
          [emp.id, defaultLeaveTypes["VL"] ?? 5],
        );

        // Re-fetch just this one
        const newCredits = await client.query(
          `SELECT * FROM leave_credits WHERE employee_id = $1`,
          [emp.id],
        );
        credits = newCredits.rows[0];
        leaveCreditsMap.set(emp.id, credits);
      }

      // Get leave map for this employee (from memory)
      const leaveMap = employeeLeaveMap.get(emp.id) || new Map();

      // Get overtime data (from memory)
      const overtime = overtimeMap.get(emp.id) || {
        total_hours: 0,
        request_ids: [],
      };

      // Get attendance for this employee (from memory)
      const attendanceMap = attendanceByEmployee.get(emp.id) || new Map();

      // Get government deductions (from memory)
      const government_deduction = govDeductionsByEmployee.get(emp.id) || 0;

      // Get late deduction config (from memory)
      const empLate = lateDeductionsByEmployee.get(emp.id);

      // Get leave conversion (from memory)
      let leave_conversion_cash = 0;
      if (currentMonth === 1) {
        leave_conversion_cash = conversionMap.get(emp.id) || 0;
      }

      // Calculate daily rate
      const monthly_salary = Number(salary.basic_salary);
      const working_days_per_month = Number(
        salary.working_days_per_month || 26,
      );
      const daily_rate = monthly_salary / working_days_per_month;

      // Calculate overtime pay
      const overtime_rate = Number(salary.overtime_rate || 0);
      const overtime_pay = overtime.total_hours * overtime_rate;

      // ============================================
      // BUILD ATTENDANCE DATA WITH DAY TYPES (from memory)
      // ============================================
      const attendanceFull = [];
      for (const dateStr of allDates) {
        const attendance = attendanceMap.get(dateStr) || {};
        const dayType = calendarDayMap.get(dateStr) || "REGULAR";

        attendanceFull.push({
          date: new Date(dateStr),
          status: attendance.status || null,
          check_in_time: attendance.check_in_time,
          check_out_time: attendance.check_out_time,
          work_fraction: attendance.work_fraction,
          day_type: dayType,
          shift_id: attendance.shift_id || null,
        });
      }

      // ============================================
      // REST DAY OVERRIDE: Employee Override → Branch Default → Keep
      // Only overrides REGULAR days; holidays and special days are preserved.
      // ============================================
      const empRestDays = empRestDaysByEmployee.get(emp.id);
      const empBranchRestDays = emp.branch_id ? branchRestDaysByBranch.get(emp.branch_id) : null;

      for (const row of attendanceFull) {
        if (row.day_type !== "REGULAR") continue;

        const dow = row.date.getDay();

        if (empRestDays?.has(dow)) {
          row.day_type = "REST_DAY";
        } else if (empBranchRestDays?.has(dow)) {
          row.day_type = "REST_DAY";
        }
      }

      // ============================================
      // CALCULATE WORK UNITS WITH MULTIPLIER & PAID LEAVE
      // ============================================
      let total_work_units_with_multiplier = 0;
      let total_work_units_raw = 0;
      let late_count = 0;
      let late_minutes = 0;
      let working_days_in_cutoff = 0;
      let paid_leave_days = 0;
      let unpaid_leave_days = 0;

      // Track breakdown by day type for reporting
      const breakdown = {
        REGULAR: {
          days: 0,
          units: 0,
          multiplier: payRulesMap.REGULAR || 1,
          pay: 0,
        },
        SPECIAL_NON_WORKING: {
          days: 0,
          units: 0,
          multiplier: payRulesMap.SPECIAL_NON_WORKING || 1,
          pay: 0,
        },
        SPECIAL_HOLIDAY: {
          days: 0,
          units: 0,
          multiplier: payRulesMap.SPECIAL_HOLIDAY || 1,
          pay: 0,
        },
        REGULAR_HOLIDAY: {
          days: 0,
          units: 0,
          multiplier: payRulesMap.REGULAR_HOLIDAY || 1,
          pay: 0,
        },
        REST_DAY: {
          days: 0,
          units: 0,
          multiplier: payRulesMap.REST_DAY || 1,
          pay: 0,
        },
      };

      // Phase 2F.3: Holiday-type-specific unworked policy key mapping
      const UNWORKED_POLICY_KEYS = {
        REGULAR_HOLIDAY: "unworked_regular_holiday_policy",
        SPECIAL_HOLIDAY: "unworked_special_holiday_policy",
        SPECIAL_NON_WORKING: "unworked_special_non_working_policy",
      };
      const UNWORKED_POLICY_DEFAULTS = {
        REGULAR_HOLIDAY: 2,
        SPECIAL_HOLIDAY: 1,
        SPECIAL_NON_WORKING: 1,
      };

      for (const row of attendanceFull) {
        const dateStr = row.date.toLocaleDateString("en-CA");
        const dayType = row.day_type;

        const leaveInfo = leaveMap.get(dateStr);
        const isLeave = row.status === "LEAVE" || !!leaveInfo;
        const isPaidLeave = isLeave && leaveInfo?.is_paid === true;

        let multiplier = payRulesMap[dayType] || DEFAULT_MULTIPLIER;

        const isHolidayDay = dayType === "REGULAR_HOLIDAY" || dayType === "SPECIAL_HOLIDAY" || dayType === "SPECIAL_NON_WORKING";
        const hasAttendance = row.status === "PRESENT" || row.status === "LATE" || row.status === "HALF_DAY";
        const isUnworkedHoliday = isHolidayDay && !hasAttendance && !isLeave;
        const unworkedPolicy = isUnworkedHoliday && UNWORKED_POLICY_KEYS[dayType]
          ? Number(payrollRulesMap.get(UNWORKED_POLICY_KEYS[dayType])
            ?? UNWORKED_POLICY_DEFAULTS[dayType] ?? 1)
          : 0;

        // Unworked Holiday Policy: override multiplier for non-attended holidays
        if (isUnworkedHoliday) {
          if (unworkedPolicy === 2) { // DAILY_RATE
            multiplier = 1;
          }
          // HOLIDAY_RATE (3): keep holiday multiplier
          // NO_PAY (1): day will produce 0 pay
        }

        // Holiday on Rest Day: composite multiplier — only when employee worked
        if (hasAttendance && (dayType === "REGULAR_HOLIDAY" || dayType === "SPECIAL_HOLIDAY")) {
          const dow = row.date.getDay();
          const isRestDay = empRestDays?.has(dow) || empBranchRestDays?.has(dow);
          if (isRestDay) {
            const rdMult = payRulesMap.REST_DAY || 1;
            const method = Number(payrollRulesMap.get("holiday_rest_day_method") || 1);
            if (method === 1) {
              multiplier = multiplier * rdMult;
            } else if (method === 2) {
              multiplier = multiplier + rdMult - 1;
            } else if (method === 3) {
              multiplier = Math.max(multiplier, rdMult);
            }
          }
        }

        if (isLeave) {
          multiplier = 1;
        }

        const isSpecialNonWorking = dayType === "SPECIAL_NON_WORKING";
        const isWorkingDay =
          dayType !== "REST_DAY" && dayType !== "NON_WORKING" && !isSpecialNonWorking;
        const isHoliday =
          dayType === "REGULAR_HOLIDAY" || dayType === "SPECIAL_HOLIDAY";

        if (isWorkingDay || isHoliday) {
          if (!isUnworkedHoliday || unworkedPolicy !== 1) {
            working_days_in_cutoff++;
          }
        }

        if (isSpecialNonWorking) {
          if (!row.status || row.status === "ABSENT") {
            if (unworkedPolicy === 1) {
              continue;
            }
          }
        } else if (!isWorkingDay && !isHoliday && dayType !== "REST_DAY") {
          continue;
        }

        let rawWorkUnits = 0;

        if (row.status === "PRESENT") {
          rawWorkUnits = 1;
        } else if (row.status === "LATE") {
          rawWorkUnits = 1;
          late_count++;

          if (row.check_in_time) {
            const checkInTime = new Date(row.check_in_time);

            // Resolve shift: attendance.shift_id -> employee_shift_assignments -> fallback
            const resolvedShift = row.shift_id
              ? (shiftMap.get(row.shift_id) || null)
              : resolveShiftForDate(emp.id, row.date);

            let scheduledStart;
            if (resolvedShift) {
              if (resolvedShift.is_flexitime && resolvedShift.flex_end_window) {
                const [fh, fm] = resolvedShift.flex_end_window.split(':').map(Number);
                scheduledStart = new Date(checkInTime);
                scheduledStart.setHours(fh, fm, 0, 0);
              } else {
                const [sh, sm] = resolvedShift.start_time.split(':').map(Number);
                scheduledStart = new Date(checkInTime);
                scheduledStart.setHours(sh, sm, 0, 0);
              }
            } else {
              scheduledStart = new Date(checkInTime);
              scheduledStart.setHours(8, 0, 0, 0);
            }

            const rawLateMinutes = (checkInTime - scheduledStart) / 1000 / 60;
            const threshold = rules?.late_threshold || 0;

            let penaltyMinutes = rawLateMinutes - threshold;

            if (penaltyMinutes > 0) {
              const cappedMinutes = Math.min(penaltyMinutes, 30);
              late_minutes += cappedMinutes;
            }
          }
        } else if (row.status === "HALF_DAY") {
          rawWorkUnits = row.work_fraction || 0.5;
        } else if (isLeave) {
          if (isPaidLeave) {
            rawWorkUnits = 1;
            paid_leave_days++;
          } else {
            rawWorkUnits = 0;
            unpaid_leave_days++;
          }
        } else if (!row.status || row.status === "ABSENT") {
          if (isHolidayDay && unworkedPolicy >= 2) {
            rawWorkUnits = 1;
          } else {
            rawWorkUnits = 0;
          }
        }

        const weightedWorkUnits = rawWorkUnits * multiplier;

        total_work_units_raw += rawWorkUnits;
        total_work_units_with_multiplier += weightedWorkUnits;

        if (breakdown[dayType]) {
          breakdown[dayType].days += rawWorkUnits > 0 ? 1 : 0;
          breakdown[dayType].units += weightedWorkUnits;
          breakdown[dayType].pay += daily_rate * weightedWorkUnits;
        }
      }

      // ============================================
      // NIGHT DIFFERENTIAL CALCULATION (10PM–6AM window)
      // ============================================
      let night_differential_hours = 0;
      let night_differential_pay = 0;

      if (payrollRulesMap.get('night_differential_enabled')) {
        const ndRate = Number(payrollRulesMap.get('night_differential_rate') || 0.10);
        const hourlyRate = daily_rate / (rules?.max_work_hours || 8);

        for (const row of attendanceFull) {
          if (!row.check_in_time || !row.check_out_time) continue;
          if (row.status === 'ABSENT' || row.status === 'LEAVE' || (!row.status)) continue;

          const checkIn = new Date(row.check_in_time);
          const checkOut = new Date(row.check_out_time);

          // Window 1: checkIn day 22:00 → checkIn day+1 06:00
          const w1Start = new Date(checkIn);
          w1Start.setHours(22, 0, 0, 0);
          const w1End = new Date(w1Start);
          w1End.setDate(w1End.getDate() + 1);
          w1End.setHours(6, 0, 0, 0);

          const s1 = Math.max(checkIn.getTime(), w1Start.getTime());
          const e1 = Math.min(checkOut.getTime(), w1End.getTime());
          if (e1 > s1) night_differential_hours += (e1 - s1) / (1000 * 60 * 60);

          // Window 2: (checkIn day-1) 22:00 → checkIn day 06:00 (pre-6AM work)
          const w2Start = new Date(checkIn);
          w2Start.setDate(w2Start.getDate() - 1);
          w2Start.setHours(22, 0, 0, 0);
          const w2End = new Date(checkIn);
          w2End.setHours(6, 0, 0, 0);

          const s2 = Math.max(checkIn.getTime(), w2Start.getTime());
          const e2 = Math.min(checkOut.getTime(), w2End.getTime());
          if (e2 > s2) night_differential_hours += (e2 - s2) / (1000 * 60 * 60);
        }

        night_differential_hours = Math.round(night_differential_hours * 100) / 100;
        night_differential_pay = Math.round(night_differential_hours * hourlyRate * ndRate * 100) / 100;
      }

      // ============================================
      // LATE DEDUCTION CALCULATION
      // ============================================
      const effectiveLateMinutes = rules?.grace_period
        ? Math.max(0, late_minutes - Number(rules.grace_period))
        : late_minutes;

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
          if (!workingDays || workingDays < 20) {
            workingDays = 26;
          }
          const maxHours = rules?.max_work_hours || 8;
          const totalMinutes = workingDays * maxHours * 60;
          const perMinuteRate = monthly_salary / totalMinutes;
          late_deduction = effectiveLateMinutes * perMinuteRate;
        }
      }

      const total_deductions = government_deduction + late_deduction;

      // BASIC PAY = Daily Rate × Weighted Work Units
      const basic_pay = daily_rate * total_work_units_with_multiplier;

      const net_salary =
        Math.max(0, basic_pay - total_deductions) +
        leave_conversion_cash +
        overtime_pay +
        night_differential_pay;

      if (net_salary === 0 && monthly_salary > 0 && attendanceMap.size > 0) {
        console.warn("[PAYROLL] ZERO NET SALARY despite salary+attendance", {
          employee_id: emp.id,
          monthly_salary,
          daily_rate,
          total_work_units_raw,
          basic_pay,
          deductions: total_deductions,
        });
      }

      const absent_days =
        working_days_in_cutoff - Math.floor(total_work_units_raw);

      console.log("[PAYROLL] DEBUG:", {
        employee_id: emp.id,
        employee_code: emp.employee_code,
        salary_type: salary.salary_type || "N/A",
        monthly_salary,
        working_days_per_month,
        daily_rate,
        total_work_units_raw,
        total_work_units_with_multiplier,
        basic_pay,
        overtime_pay,
        night_differential_hours,
        night_differential_pay,
        late_deduction,
        government_deduction,
        total_deductions,
        leave_conversion_cash,
        net_salary,
        attendanceMap_sample_keys: [...attendanceMap.keys()].slice(0, 3),
        allDates_sample: allDates.slice(0, 3),
      });

      console.log("[PAYROLL] Processed:", {
        employee_id: emp.id,
        employee_code: emp.employee_code,
        cutoff_start,
        cutoff_end,
        attendance_records_count: attendanceMap.size,
        working_days_in_cutoff,
        paid_leave_days,
        unpaid_leave_days,
      });

      // Skip employees with LOCKED payroll for this cutoff
      const existingLocked = await client.query(
        `SELECT id FROM payroll WHERE employee_id = $1 AND cutoff_start = $2 AND cutoff_end = $3 AND status = 'LOCKED'`,
        [emp.id, cutoff_start, cutoff_end],
      );
      if (existingLocked.rows.length > 0) continue;

      // Determine branch_id for this payroll record
      const empBranchId = branch_id || emp.branch_id || null;

      // Insert payroll record (using client instead of pool for transaction)
      const payrollInsertResult = await client.query(
        `INSERT INTO payroll (
          employee_id, cutoff_start, cutoff_end, pay_date,
          basic_salary, overtime_pay, deductions, net_salary,
          late_deduction, absent_deduction, government_deduction,
          leave_conversion, rule_snapshot, branch_id,
          night_differential_hours, night_differential_pay
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (employee_id, cutoff_start, cutoff_end)
        DO UPDATE SET
          overtime_pay = EXCLUDED.overtime_pay,
          deductions = EXCLUDED.deductions,
          net_salary = EXCLUDED.net_salary,
          late_deduction = EXCLUDED.late_deduction,
          absent_deduction = EXCLUDED.absent_deduction,
          leave_conversion = EXCLUDED.leave_conversion,
          rule_snapshot = EXCLUDED.rule_snapshot,
          branch_id = EXCLUDED.branch_id,
          night_differential_hours = EXCLUDED.night_differential_hours,
          night_differential_pay = EXCLUDED.night_differential_pay
        RETURNING id`,
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
          0,
          government_deduction,
          leave_conversion_cash,
          JSON.stringify({
            attendance_rules: rules,
            pay_rules: payRulesMap,
            working_days_per_month,
            daily_rate,
            working_days_in_cutoff,
            total_work_units_raw,
            total_work_units_weighted: total_work_units_with_multiplier,
            absent_days,
            late_count,
            late_minutes: effectiveLateMinutes,
            paid_leave_days,
            unpaid_leave_days,
            breakdown,
            late_deduction_config: {
              type: deductionType,
              value: deductionValue,
              enabled: lateDeductionEnabled,
              has_employee_override: !!empLate,
            },
            leave_conversion: {
              converted: leave_conversion_cash > 0,
              amount: leave_conversion_cash,
              conversion_year: currentMonth === 1 ? conversionYear : null,
            },
            overtime: {
              hours: overtime.total_hours,
              rate: overtime_rate,
              pay: overtime_pay,
              request_ids: overtime.request_ids,
            },
            night_differential: {
              hours: night_differential_hours,
              rate: payrollRulesMap.get('night_differential_rate') || 0.10,
              pay: night_differential_pay,
            },
            }),
          empBranchId,
          night_differential_hours,
          night_differential_pay,
        ],
      );

      // MARK OVERTIME AS PAID (is_paid only — status stays APPROVED per DB constraint)
      if (
        overtime.total_hours > 0 &&
        overtime.request_ids &&
        overtime.request_ids.length > 0
      ) {
        const payrollId = payrollInsertResult.rows[0]?.id ?? null;
        const overtimeUpdatePayload = {
          employee_id: emp.id,
          payroll_id: payrollId,
          request_ids: overtime.request_ids,
          status_unchanged: "APPROVED",
          is_paid: true,
        };

        console.log("[Payroll/Overtime] Marking overtime as paid", {
          employee_id: emp.id,
          overtime_update: overtimeUpdatePayload,
          status_before_update: "APPROVED",
        });

        await client.query(
          `UPDATE overtime_requests 
           SET is_paid = TRUE,
               paid_at = NOW(),
               paid_in_payroll_id = $3
           WHERE id = ANY($1::int[]) 
             AND employee_id = $2
             AND status = 'APPROVED'
             AND is_paid = FALSE`,
          [overtime.request_ids, emp.id, payrollId],
        );
      }

      processedCount++;
    }

    // COMMIT THE TRANSACTION
    await client.query("COMMIT");

    console.log(
      `Payroll generated successfully for ${processedCount} employees`,
    );

    return {
      message:
        "Payroll generated with fully optimized batched queries and transaction safety!",
      employees_processed: processedCount,
      cutoff_start,
      cutoff_end,
      pay_date,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payroll generation failed:", error);
    throw new Error(`Payroll generation failed: ${error.message}`);
  } finally {
    client.release();
  }
};

// ============================================
// ALL EXISTING FUNCTIONS BELOW (UNCHANGED)
// ============================================

// GET PAYROLL - NO NAME (with branch access)
const getPayroll = async (
  cutoff_start,
  cutoff_end,
  page = 1,
  limit = 10,
  search = "",
  allowedBranchIds = null,
) => {
  const offset = (page - 1) * limit;

  // Build dynamic branch clause
  let branchClause = "";
  const params = [limit, offset, `%${search}%`, cutoff_start, cutoff_end];
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    branchClause = `AND p.branch_id = ANY($${params.length + 1}::int[])`;
    params.push(allowedBranchIds);
  }

  const dataQuery = await pool.query(
    `
  SELECT 
    p.id AS payroll_id,
    p.employee_id AS id,
    e.first_name,
    e.last_name,
    e.middle_name,
    e.suffix,
    e.employee_code,

    s.basic_salary,
    s.daily_rate,
    s.overtime_rate,
    s.working_days_per_month,

    p.net_salary,
    p.overtime_pay,
    p.deductions,
    p.leave_conversion,
    p.status,
    p.cutoff_start,
    p.cutoff_end,
    p.pay_date,
    p.branch_id,
    b.name AS branch_name

  FROM payroll p
  JOIN employees e ON e.id = p.employee_id
  LEFT JOIN employee_salary s ON s.employee_id = e.id
  LEFT JOIN branches b ON b.id = p.branch_id

  WHERE p.cutoff_start::date >= $4::date
    AND p.cutoff_end::date <= $5::date
    ${branchClause}
  AND (
    e.first_name ILIKE $3 OR 
    e.last_name ILIKE $3 OR 
    e.employee_code ILIKE $3 OR
    CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
  )

  ORDER BY e.first_name, e.last_name
  LIMIT $1 OFFSET $2
  `,
    params,
  );

  const countParams = [`%${search}%`, cutoff_start, cutoff_end];
  let countBranchClause = "";
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    countBranchClause = `AND p.branch_id = ANY($${countParams.length + 1}::int[])`;
    countParams.push(allowedBranchIds);
  }

  const countQuery = await pool.query(
    `
    SELECT COUNT(*)
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    WHERE p.cutoff_start::date >= $2::date
      AND p.cutoff_end::date <= $3::date
      ${countBranchClause}
    AND (
      e.first_name ILIKE $1 OR 
      e.last_name ILIKE $1 OR 
      e.employee_code ILIKE $1 OR
      CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
    )
    `,
    countParams,
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

// GET PAYROLL SUMMARY (with branch access)
const getPayrollSummary = async (cutoff_start, cutoff_end, allowedBranchIds = null) => {
  const params = [cutoff_start, cutoff_end];
  let branchClause = "";
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    branchClause = `AND branch_id = ANY($${params.length + 1}::int[])`;
    params.push(allowedBranchIds);
  }

  const result = await pool.query(
    `
    SELECT 
      COUNT(*) AS total_employees,
      COALESCE(SUM(net_salary), 0) AS total_payout,
      COALESCE(SUM(deductions), 0) AS total_deductions
    FROM payroll
    WHERE cutoff_start >= $1 
      AND cutoff_end <= $2
      ${branchClause}
  `,
    params,
  );

  return result.rows[0];
};

// MARK AS PAID
const markAsPaid = async (id) => {
  const result = await pool.query(
    `
    UPDATE payroll 
    SET status = 'PAID' 
    WHERE id = $1 AND status NOT IN ('PAID', 'LOCKED', 'VOID')
    RETURNING *
    `,
    [id],
  );
  return result.rows[0];
};

// MARK ALL AS PAID
const markAllAsPaid = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `
    UPDATE payroll
    SET status = 'PAID'
    WHERE cutoff_start::date = $1::date
    AND cutoff_end::date = $2::date
    AND status NOT IN ('PAID', 'LOCKED', 'VOID')
    RETURNING *
    `,
    [cutoff_start, cutoff_end],
  );

  if (result.rowCount === 0) {
    throw new Error("No payable (unpaid) payroll found for this cutoff");
  }

  return {
    message: "All payroll marked as paid",
    count: result.rowCount,
    data: result.rows,
  };
};

// GET PAYROLL DETAILS
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
      s.basic_salary AS monthly_salary,
      b.name AS branch_name
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN employee_salary s ON s.employee_id = e.id
    LEFT JOIN branches b ON b.id = p.branch_id
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

// GET EMPLOYEE SALARY (with branch access)
const getEmployeeSalary = async (page = 1, limit = 10, search = "", allowedBranchIds = null) => {
  const offset = (page - 1) * limit;

  const params = [limit, offset, `%${search}%`];
  let branchClause = "";
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    branchClause = `AND e.branch_id = ANY($${params.length + 1}::int[])`;
    params.push(allowedBranchIds);
  }

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
    WHERE (1=1)
      ${branchClause}
      AND (
        e.first_name ILIKE $3 OR 
        e.last_name ILIKE $3 OR 
        e.employee_code ILIKE $3 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $3
      )
    ORDER BY e.first_name, e.last_name
    LIMIT $1 OFFSET $2
    `,
    params,
  );

  const countParams = [`%${search}%`];
  let countBranchClause = "";
  if (allowedBranchIds && allowedBranchIds.length > 0) {
    countBranchClause = `AND e.branch_id = ANY($${countParams.length + 1}::int[])`;
    countParams.push(allowedBranchIds);
  }

  const countQuery = await pool.query(
    `
    SELECT COUNT(*) 
    FROM employees e
    WHERE (1=1)
      ${countBranchClause}
      AND (
        e.first_name ILIKE $1 OR 
        e.last_name ILIKE $1 OR 
        e.employee_code ILIKE $1 OR
        CONCAT_WS(' ', e.first_name, e.middle_name, e.last_name, e.suffix) ILIKE $1
      )
    `,
    countParams,
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
    AND status NOT IN ('PAID', 'LOCKED', 'VOID')
    RETURNING *
  `,
    [cutoff_start, cutoff_end, pay_date],
  );

  if (result.rowCount === 0) {
    throw new Error("No deletable payroll found for this cutoff");
  }

  return { message: "Payroll deleted successfully" };
};

// GET MY PAYROLL
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
      b.name AS branch_name,
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
    LEFT JOIN branches b ON b.id = p.branch_id
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

// ============================================
// PAYROLL LOCKING & STATUS MANAGEMENT
// ============================================

const lockPayroll = async (id) => {
  const result = await pool.query(
    `UPDATE payroll SET status = 'LOCKED' WHERE id = $1 AND status NOT IN ('LOCKED', 'PAID', 'VOID') RETURNING *`,
    [id],
  );
  return result.rows[0];
};

const unlockPayroll = async (id) => {
  const result = await pool.query(
    `UPDATE payroll SET status = 'UNPAID' WHERE id = $1 AND status = 'LOCKED' RETURNING *`,
    [id],
  );
  return result.rows[0];
};

const voidPayroll = async (id) => {
  const result = await pool.query(
    `UPDATE payroll SET status = 'VOID' WHERE id = $1 AND status NOT IN ('PAID', 'VOID') RETURNING *`,
    [id],
  );
  return result.rows[0];
};

// ============================================
// GET MY BENEFITS
// ============================================
const getMyBenefits = async (employee_id) => {
  const deductionsRes = await pool.query(
    `SELECT * FROM employee_deductions 
     WHERE employee_id = $1 
       AND is_active = true 
       AND type NOT LIKE 'LATE%'`,
    [employee_id],
  );

  const employeeRes = await pool.query(
    `SELECT sss_number, philhealth_number, hdmf_number, tin_number 
     FROM employees WHERE id = $1`,
    [employee_id],
  );

  return {
    deductions: deductionsRes.rows,
    government_ids: employeeRes.rows[0] || {},
  };
};

// ============================================
// NOTIFICATION HELPERS
// ============================================
const getUserIdsByEmployeeIds = async (employeeIds) => {
  if (employeeIds.length === 0) return [];
  const result = await pool.query(
    `SELECT id, employee_id FROM users WHERE employee_id = ANY($1::int[])`,
    [employeeIds],
  );
  return result.rows;
};

const getActiveHRUserIds = async () => {
  const result = await pool.query(
    `SELECT id FROM users WHERE role = 'ADMIN' OR EXISTS (SELECT 1 FROM user_permissions up WHERE up.user_id = users.id AND up.permission_key = 'employees.manage' AND up.is_allowed = true)`,
  );
  return result.rows.map(r => r.id);
};

const getEmployeeIdsByCutoff = async (cutoff_start, cutoff_end) => {
  const result = await pool.query(
    `SELECT DISTINCT employee_id FROM payroll WHERE cutoff_start::date = $1::date AND cutoff_end::date = $2::date`,
    [cutoff_start, cutoff_end],
  );
  return result.rows.map(r => r.employee_id);
};

// ============================================
// MODULE EXPORTS (UNCHANGED)
// ============================================
module.exports = {
  getMyBenefits,
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
  lockPayroll,
  unlockPayroll,
  voidPayroll,
  getUserIdsByEmployeeIds,
  getActiveHRUserIds,
  getEmployeeIdsByCutoff,
};
