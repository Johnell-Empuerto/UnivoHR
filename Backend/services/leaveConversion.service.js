const leaveConversionModel = require("../models/leaveConversion.model");
const pool = require("../config/db");

const processYearEndLeaveConversion = async (year, processed_by = null) => {
  const client = await pool.connect();
  const results = {
    total_processed: 0,
    total_converted: 0,
    total_amount: 0,
    errors: [],
    skipped: [],
  };

  try {
    await client.query("BEGIN");

    const companySettings = await leaveConversionModel.getCompanySettings();
    const conversion_rate = companySettings?.conversion_rate || 1;
    const enforce_sil = companySettings?.enforce_sil || false;
    const sil_min_days = companySettings?.sil_min_days || 0;

    const convertibleTypes = await leaveConversionModel.getAllConvertibleTypes();

    if (convertibleTypes.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "No convertible leave types found. Enable is_convertible in leave type settings.",
        results,
      };
    }

    const employees = await leaveConversionModel.getActiveEmployees();
    results.total_processed = employees.length;

    const employeesById = new Map();
    for (const emp of employees) {
      if (!employeesById.has(emp.id)) {
        employeesById.set(emp.id, []);
      }
      employeesById.get(emp.id).push(emp);
    }

    for (const [empId, empBalances] of employeesById) {
      try {
        const empInfo = empBalances[0];
        if (!empInfo.basic_salary) {
          results.skipped.push({
            employee_id: empId,
            employee_code: empInfo.employee_code,
            reason: "No salary information found",
          });
          continue;
        }

        const daily_rate = empInfo.daily_rate || (empInfo.basic_salary / (empInfo.working_days_per_month || 26));
        let employeeConverted = false;

        for (const ct of convertibleTypes) {
          const balance = empBalances.find(b => b.leave_type_code === ct.code);
          if (!balance) continue;

          const unusedDays = Math.max(0, (balance.total_days || 0) + (balance.carried_over_days || 0) + (balance.adjusted_days || 0) - (balance.used_days || 0));

          if (unusedDays <= 0) {
            results.skipped.push({
              employee_id: empId,
              employee_code: empInfo.employee_code,
              leave_type: ct.code,
              reason: `No unused ${ct.code} leave`,
            });
            continue;
          }

          const alreadyConverted = await leaveConversionModel.exists(
            empId, year, ct.code, client,
          );

          if (alreadyConverted) {
            results.skipped.push({
              employee_id: empId,
              employee_code: empInfo.employee_code,
              leave_type: ct.code,
              reason: `Already converted ${ct.code} for this year`,
            });
            continue;
          }

          let convertible_days = Math.min(unusedDays, ct.max_convertible_days || 999);

          if (enforce_sil && sil_min_days > 0) {
            convertible_days = Math.max(convertible_days, sil_min_days);
          }

          const amount = convertible_days * daily_rate * conversion_rate;

          if (amount <= 0) {
            results.skipped.push({
              employee_id: empId,
              employee_code: empInfo.employee_code,
              leave_type: ct.code,
              reason: "Conversion amount is zero",
            });
            continue;
          }

          await leaveConversionModel.create(
            {
              employee_id: empId,
              year: year,
              leave_type: ct.code,
              days_converted: convertible_days,
              daily_rate: daily_rate,
              conversion_rate: conversion_rate,
              amount: amount,
              processed_by: processed_by,
              remarks: "YEAR-END",
            },
            client,
          );

          results.total_converted++;
          results.total_amount += amount;
          employeeConverted = true;
        }

        const allTypes = await leaveConversionModel.getAllBalanceTypes();
        const resetTypes = allTypes.map(lt => ({
          id: lt.id,
          code: lt.code,
          default_days: lt.default_days || 0,
        }));
        await leaveConversionModel.resetLeaveCredits(empId, resetTypes, client);

      } catch (empError) {
        results.errors.push({
          employee_id: empId,
          employee_code: empInfo?.employee_code || empId,
          error: empError.message,
        });
      }
    }

    await client.query("COMMIT");

    return {
      success: true,
      message: `Year-end conversion completed for ${year}`,
      results: {
        total_processed: results.total_processed,
        total_converted: results.total_converted,
        total_amount: parseFloat(results.total_amount.toFixed(2)),
        errors: results.errors,
        skipped: results.skipped,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      message: "Year-end conversion failed",
      error: err.message,
      results,
    };
  } finally {
    client.release();
  }
};

const processEmployeeLeaveConversion = async (
  employeeId,
  year,
  reason = "RESIGNATION",
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const companySettings = await leaveConversionModel.getCompanySettings();
    const conversion_rate = companySettings?.conversion_rate || 1;

    const convertibleTypes = await leaveConversionModel.getAllConvertibleTypes();

    if (convertibleTypes.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "No convertible leave types configured",
      };
    }

    const empBalances = await pool.query(
      `
      SELECT
        e.id, e.first_name, e.last_name, e.employee_code,
        es.basic_salary, es.daily_rate, es.working_days_per_month,
        elb.total_days, elb.used_days, elb.carried_over_days, elb.adjusted_days,
        lt.code AS leave_type_code, lt.default_days, lt.max_convertible_days
      FROM employees e
      LEFT JOIN employee_salary es ON es.employee_id = e.id
      LEFT JOIN employee_leave_balances elb ON elb.employee_id = e.id
        AND elb.year = $1
      LEFT JOIN leave_types lt ON lt.id = elb.leave_type_id
      WHERE e.id = $2
      ORDER BY lt.sort_order
      `,
      [year, employeeId],
    );

    if (empBalances.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Employee not found or no leave balances",
      };
    }

    const emp = empBalances.rows[0];
    if (!emp.basic_salary) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Employee has no salary information",
      };
    }

    const daily_rate = emp.daily_rate || (emp.basic_salary / (emp.working_days_per_month || 26));

    for (const ct of convertibleTypes) {
      const balance = empBalances.rows.find(b => b.leave_type_code === ct.code);
      if (!balance) continue;

      const alreadyConverted = await leaveConversionModel.exists(
        employeeId, year, ct.code,
      );
      if (alreadyConverted) continue;

      const unusedDays = Math.max(0, (balance.total_days || 0) + (balance.carried_over_days || 0) + (balance.adjusted_days || 0) - (balance.used_days || 0));
      if (unusedDays <= 0) continue;

      const convertible_days = Math.min(unusedDays, ct.max_convertible_days || 999);
      const amount = convertible_days * daily_rate * conversion_rate;

      if (amount <= 0) continue;

      await leaveConversionModel.create(
        {
          employee_id: parseInt(employeeId),
          year: year,
          leave_type: ct.code,
          days_converted: convertible_days,
          daily_rate: daily_rate,
          conversion_rate: conversion_rate,
          amount: amount,
          processed_by: null,
          remarks: reason,
        },
        client,
      );
    }

    const allTypes = await leaveConversionModel.getAllBalanceTypes();
    const resetTypes = allTypes.map(lt => ({
      id: lt.id,
      code: lt.code,
      default_days: 0,
    }));
    await leaveConversionModel.resetLeaveCredits(parseInt(employeeId), resetTypes, client);

    await client.query("COMMIT");

    return {
      success: true,
      message: `Leave conversion processed for ${reason}`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      message: "Conversion failed",
      error: err.message,
    };
  } finally {
    client.release();
  }
};

const getConversionAmountForPayroll = async (employeeId, payrollYear) => {
  try {
    const totalAmount = await leaveConversionModel.getTotalAmountForPayroll(
      employeeId,
      payrollYear,
    );

    return {
      success: true,
      employee_id: employeeId,
      year: payrollYear,
      total_amount: totalAmount,
    };
  } catch (err) {
    return {
      success: false,
      message: "Failed to get conversion amount",
      error: err.message,
      total_amount: 0,
    };
  }
};

const getEmployeeConversionHistory = async (employeeId) => {
  try {
    const history = await leaveConversionModel.getEmployeeHistory(employeeId);

    return {
      success: true,
      employee_id: employeeId,
      history: history,
      total_records: history.length,
    };
  } catch (err) {
    return {
      success: false,
      message: "Failed to get conversion history",
      error: err.message,
      history: [],
    };
  }
};

const getConversionsByYear = async (year) => {
  try {
    const conversions = await leaveConversionModel.getByYear(year);
    return {
      success: true,
      year: year,
      data: conversions,
      total_records: conversions.length,
    };
  } catch (err) {
    return {
      success: false,
      message: "Failed to get conversions",
      error: err.message,
    };
  }
};

const getConversionStatistics = async (year = null) => {
  try {
    const stats = await leaveConversionModel.getStatistics(year);
    return {
      success: true,
      year: year || "all",
      statistics: stats,
    };
  } catch (err) {
    return {
      success: false,
      message: "Failed to get statistics",
      error: err.message,
    };
  }
};

const deleteConversion = async (employeeId, year, leaveType) => {
  try {
    const deleted = await leaveConversionModel.deleteConversion(
      employeeId,
      year,
      leaveType,
    );

    if (deleted) {
      return {
        success: true,
        message: "Conversion deleted successfully",
        data: deleted,
      };
    }

    return {
      success: false,
      message: "Conversion not found",
    };
  } catch (err) {
    return {
      success: false,
      message: "Failed to delete conversion",
      error: err.message,
    };
  }
};

module.exports = {
  processYearEndLeaveConversion,
  processEmployeeLeaveConversion,
  getConversionAmountForPayroll,
  getEmployeeConversionHistory,
  getConversionsByYear,
  getConversionStatistics,
  deleteConversion,
};
