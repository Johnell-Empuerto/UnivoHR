const leaveConversionModel = require("../models/leaveConversion.model");
const pool = require("../config/db");

/**
 * YEAR-END LEAVE CONVERSION SERVICE
 *
 * Business Rules:
 * - Only Vacation Leave (VL) is convertible
 * - Conversion happens on December 31
 * - Payroll (January 15) reads from leave_conversions table, doesn't calculate
 * - Resignation triggers immediate conversion with remarks = 'RESIGNATION'
 */

// ==========================================
// 1. PROCESS YEAR-END LEAVE CONVERSION
// ==========================================
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

    // Get company settings
    const companySettings = await leaveConversionModel.getCompanySettings();
    const conversion_rate = companySettings?.conversion_rate || 1;
    const enforce_sil = companySettings?.enforce_sil || false;
    const sil_min_days = companySettings?.sil_min_days || 0;

    // Get VL leave type settings
    const vlSettings = await leaveConversionModel.getLeaveTypeSettings("VL");
    const max_convertible_days = vlSettings?.max_convertible_days || 5;
    const is_convertible = vlSettings?.is_convertible || false;

    if (!is_convertible) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Vacation Leave conversion is disabled in leave type settings",
        results,
      };
    }

    // Get all active employees with salary and leave info
    const employees = await leaveConversionModel.getActiveEmployees();
    results.total_processed = employees.length;

    for (const emp of employees) {
      try {
        // Skip if no salary info
        if (!emp.basic_salary) {
          results.skipped.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            reason: "No salary information found",
          });
          continue;
        }

        // Skip if already converted for this year
        const alreadyConverted = await leaveConversionModel.exists(
          emp.id,
          year,
          "VL",
          client
        );

        if (alreadyConverted) {
          results.skipped.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            reason: "Already converted for this year",
          });
          continue;
        }

        // Calculate unused vacation leave
        const vacation_leave = emp.vacation_leave || 0;
        const used_vacation_leave = emp.used_vacation_leave || 0;
        const unused_vl = Math.max(0, vacation_leave - used_vacation_leave);

        if (unused_vl <= 0) {
          results.skipped.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            reason: "No unused vacation leave",
          });
          continue;
        }

        // Calculate convertible days
        let convertible_days = Math.min(unused_vl, max_convertible_days);

        // Apply SIL (Service Incentive Leave) minimum if enforced
        if (enforce_sil && sil_min_days > 0) {
          convertible_days = Math.max(convertible_days, sil_min_days);
        }

        // Calculate daily rate (use existing daily_rate or compute)
        const daily_rate = emp.daily_rate || (emp.basic_salary / (emp.working_days_per_month || 26));

        // Calculate conversion amount
        const amount = convertible_days * daily_rate * conversion_rate;

        if (amount <= 0) {
          results.skipped.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            reason: "Conversion amount is zero",
          });
          continue;
        }

        // Create conversion record
        const conversion = await leaveConversionModel.create(
          {
            employee_id: emp.id,
            year: year,
            leave_type: "VL",
            days_converted: convertible_days,
            daily_rate: daily_rate,
            conversion_rate: conversion_rate,
            amount: amount,
            processed_by: processed_by,
            remarks: "YEAR-END",
          },
          client
        );

        // Reset leave credits for new year
        const leaveTypes = {
          vacation_leave: vlSettings.default_days || 15,
          sick_leave: 15,
          maternity_leave: 60,
          emergency_leave: 5,
          conversion_year: year,
        };

        await leaveConversionModel.resetLeaveCredits(emp.id, leaveTypes, client);

        results.total_converted++;
        results.total_amount += amount;

        console.log(
          `[Year-End Conversion] Employee ${emp.employee_code}: ${convertible_days} days = PHP ${amount.toFixed(2)}`
        );
      } catch (empError) {
        results.errors.push({
          employee_id: emp.id,
          employee_code: emp.employee_code,
          error: empError.message,
        });
        console.error(
          `[Year-End Conversion] Error processing employee ${emp.employee_code}:`,
          empError.message
        );
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
    console.error("[Year-End Conversion] Transaction failed:", err.message);
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

// ==========================================
// 2. PROCESS EMPLOYEE LEAVE CONVERSION (RESIGNATION)
// ==========================================
const processEmployeeLeaveConversion = async (
  employeeId,
  year,
  reason = "RESIGNATION"
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if already converted
    const alreadyConverted = await leaveConversionModel.exists(
      employeeId,
      year,
      "VL"
    );

    if (alreadyConverted) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Employee already has a conversion record for this year",
      };
    }

    // Get employee info
    const employees = await leaveConversionModel.getActiveEmployees();
    const emp = employees.find((e) => e.id === parseInt(employeeId));

    if (!emp) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Employee not found or not active",
      };
    }

    if (!emp.basic_salary) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "Employee has no salary information",
      };
    }

    // Get company settings
    const companySettings = await leaveConversionModel.getCompanySettings();
    const conversion_rate = companySettings?.conversion_rate || 1;

    // Get VL settings
    const vlSettings = await leaveConversionModel.getLeaveTypeSettings("VL");
    const max_convertible_days = vlSettings?.max_convertible_days || 5;

    // Calculate unused vacation leave
    const vacation_leave = emp.vacation_leave || 0;
    const used_vacation_leave = emp.used_vacation_leave || 0;
    const unused_vl = Math.max(0, vacation_leave - used_vacation_leave);

    if (unused_vl <= 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "No unused vacation leave to convert",
        unused_vl: 0,
      };
    }

    // For resignation, convert all unused VL (up to max)
    const convertible_days = Math.min(unused_vl, max_convertible_days);

    // Calculate daily rate
    const daily_rate = emp.daily_rate || (emp.basic_salary / (emp.working_days_per_month || 26));

    // Calculate amount
    const amount = convertible_days * daily_rate * conversion_rate;

    // Create conversion record
    const conversion = await leaveConversionModel.create(
      {
        employee_id: employeeId,
        year: year,
        leave_type: "VL",
        days_converted: convertible_days,
        daily_rate: daily_rate,
        conversion_rate: conversion_rate,
        amount: amount,
        processed_by: null,
        remarks: reason,
      },
      client
    );

    // Reset leave credits
    const leaveTypes = {
      vacation_leave: 0,
      sick_leave: 0,
      maternity_leave: 0,
      emergency_leave: 0,
      conversion_year: year,
    };

    await leaveConversionModel.resetLeaveCredits(employeeId, leaveTypes, client);

    await client.query("COMMIT");

    return {
      success: true,
      message: `Leave conversion processed for ${reason}`,
      data: {
        conversion,
        days_converted: convertible_days,
        daily_rate: daily_rate,
        amount: amount,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(
      `[Resignation Conversion] Error for employee ${employeeId}:`,
      err.message
    );
    return {
      success: false,
      message: "Conversion failed",
      error: err.message,
    };
  } finally {
    client.release();
  }
};

// ==========================================
// 3. GET CONVERSION AMOUNT FOR PAYROLL
// ==========================================
const getConversionAmountForPayroll = async (employeeId, payrollYear) => {
  try {
    const totalAmount = await leaveConversionModel.getTotalAmountForPayroll(
      employeeId,
      payrollYear
    );

    return {
      success: true,
      employee_id: employeeId,
      year: payrollYear,
      total_amount: totalAmount,
    };
  } catch (err) {
    console.error("[Payroll Amount] Error:", err.message);
    return {
      success: false,
      message: "Failed to get conversion amount",
      error: err.message,
      total_amount: 0,
    };
  }
};

// ==========================================
// 4. GET EMPLOYEE CONVERSION HISTORY
// ==========================================
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
    console.error("[Conversion History] Error:", err.message);
    return {
      success: false,
      message: "Failed to get conversion history",
      error: err.message,
      history: [],
    };
  }
};

// ==========================================
// ADDITIONAL HELPER FUNCTIONS
// ==========================================

// Get all conversions for a specific year
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
    console.error("[Get By Year] Error:", err.message);
    return {
      success: false,
      message: "Failed to get conversions",
      error: err.message,
    };
  }
};

// Get conversion statistics
const getConversionStatistics = async (year = null) => {
  try {
    const stats = await leaveConversionModel.getStatistics(year);
    return {
      success: true,
      year: year || "all",
      statistics: stats,
    };
  } catch (err) {
    console.error("[Statistics] Error:", err.message);
    return {
      success: false,
      message: "Failed to get statistics",
      error: err.message,
    };
  }
};

// Delete a specific conversion (admin function)
const deleteConversion = async (employeeId, year, leaveType) => {
  try {
    const deleted = await leaveConversionModel.deleteConversion(
      employeeId,
      year,
      leaveType
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
    console.error("[Delete Conversion] Error:", err.message);
    return {
      success: false,
      message: "Failed to delete conversion",
      error: err.message,
    };
  }
};

module.exports = {
  // Core functions (required)
  processYearEndLeaveConversion,
  processEmployeeLeaveConversion,
  getConversionAmountForPayroll,
  getEmployeeConversionHistory,

  // Helper functions
  getConversionsByYear,
  getConversionStatistics,
  deleteConversion,
};
