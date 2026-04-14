const service = require("../services/leaveConversion.service");
const historyLeaveService = require("../services/historyLeave.service");
const leaveTypeModel = require("../models/leaveType.model");
const pool = require("../config/db");

// ==========================================
// EXISTING FUNCTIONS (Leave Types & Settings)
// ==========================================

// GET LEAVE TYPES
const getLeaveTypes = async (req, res) => {
  try {
    const data = await service.getLeaveTypes?.() || await leaveTypeModel.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE LEAVE TYPE
const updateLeaveType = async (req, res) => {
  try {
    const data = await service.updateLeaveType?.(req.params.id, req.body) || await leaveTypeModel.update(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SETTINGS
const getSettings = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT enforce_sil, sil_min_days, conversion_rate
      FROM company_settings
      LIMIT 1
    `);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE SETTINGS
const updateSettings = async (req, res) => {
  try {
    const { enforce_sil, sil_min_days, conversion_rate } = req.body;
    const result = await pool.query(
      `
      UPDATE company_settings
      SET
        enforce_sil = COALESCE($1, enforce_sil),
        sil_min_days = COALESCE($2, sil_min_days),
        conversion_rate = COALESCE($3, conversion_rate)
      RETURNING *
      `,
      [enforce_sil, sil_min_days, conversion_rate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SAVE ALL (Transaction)
const saveAll = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { leaveTypes, settings } = req.body;

    // Update leave types
    if (leaveTypes && Array.isArray(leaveTypes)) {
      for (const type of leaveTypes) {
        await client.query(
          `
          UPDATE leave_types
          SET
            is_convertible = $1,
            max_convertible_days = $2
          WHERE id = $3
          `,
          [type.is_convertible, type.max_convertible_days, type.id]
        );
      }
    }

    // Update settings
    if (settings) {
      await client.query(
        `
        UPDATE company_settings
        SET
          enforce_sil = COALESCE($1, enforce_sil),
          sil_min_days = COALESCE($2, sil_min_days),
          conversion_rate = COALESCE($3, conversion_rate)
        `,
        [settings.enforce_sil, settings.sil_min_days, settings.conversion_rate]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Saved successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// NEW FUNCTIONS - YEAR-END CONVERSION SYSTEM
// ==========================================

// TRIGGER YEAR-END CONVERSION (Manual trigger via API)
const triggerYearEndConversion = async (req, res) => {
  try {
    const { year, processed_by } = req.body;

    if (!year) {
      return res.status(400).json({
        message: "Year is required",
      });
    }

    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      return res.status(400).json({
        message: "Year cannot be in the future",
      });
    }

    console.log(
      `[API] Triggering year-end conversion for ${year} by user ${req.user?.id || processed_by || "SYSTEM"}`
    );

    const result = await service.processYearEndLeaveConversion(
      year,
      req.user?.id || processed_by
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("[Trigger Year-End] Error:", err.message);
    res.status(500).json({
      message: "Failed to trigger year-end conversion",
      error: err.message,
    });
  }
};

// PROCESS RESIGNATION CONVERSION
const processResignationConversion = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year, reason } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const conversionYear = year || new Date().getFullYear();
    const conversionReason = reason || "RESIGNATION";

    console.log(
      `[API] Processing resignation conversion for employee ${employee_id}`
    );

    const result = await service.processEmployeeLeaveConversion(
      employee_id,
      conversionYear,
      conversionReason
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("[Resignation Conversion] Error:", err.message);
    res.status(500).json({
      message: "Failed to process resignation conversion",
      error: err.message,
    });
  }
};

// GET CONVERSION AMOUNT FOR PAYROLL
const getPayrollAmount = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { year } = req.query;

    if (!employee_id) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const payrollYear = year
      ? parseInt(year)
      : new Date().getFullYear() - 1;

    const result = await service.getConversionAmountForPayroll(
      employee_id,
      payrollYear
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("[Payroll Amount] Error:", err.message);
    res.status(500).json({
      message: "Failed to get payroll amount",
      error: err.message,
    });
  }
};

// GET EMPLOYEE CONVERSION HISTORY
const getConversionHistory = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    const result = await service.getEmployeeConversionHistory(employee_id);

    res.status(200).json(result);
  } catch (err) {
    console.error("[Conversion History] Error:", err.message);
    res.status(500).json({
      message: "Failed to get conversion history",
      error: err.message,
    });
  }
};

// GET CONVERSIONS BY YEAR
const getConversionsByYear = async (req, res) => {
  try {
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        message: "Year is required",
      });
    }

    const result = await service.getConversionsByYear(parseInt(year));

    res.status(200).json(result);
  } catch (err) {
    console.error("[Get By Year] Error:", err.message);
    res.status(500).json({
      message: "Failed to get conversions",
      error: err.message,
    });
  }
};

// GET CONVERSION STATISTICS
const getConversionStats = async (req, res) => {
  try {
    const { year } = req.query;

    const result = await service.getConversionStatistics(
      year ? parseInt(year) : null
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("[Statistics] Error:", err.message);
    res.status(500).json({
      message: "Failed to get statistics",
      error: err.message,
    });
  }
};

// DELETE CONVERSION (Admin only)
const deleteConversion = async (req, res) => {
  try {
    const { employee_id, year, leave_type } = req.params;

    if (!employee_id || !year || !leave_type) {
      return res.status(400).json({
        message: "Employee ID, year, and leave type are required",
      });
    }

    const result = await service.deleteConversion(
      employee_id,
      parseInt(year),
      leave_type
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (err) {
    console.error("[Delete Conversion] Error:", err.message);
    res.status(500).json({
      message: "Failed to delete conversion",
      error: err.message,
    });
  }
};

// ==========================================
// HISTORY LEAVE ENDPOINTS (existing functionality)
// ==========================================

const getHistoryLeave = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const year = req.query.year || null;

    const result = await historyLeaveService.getAll(page, limit, search, year);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistoryLeaveSummary = async (req, res) => {
  try {
    const result = await historyLeaveService.getSummary();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistoryLeaveYearlySummary = async (req, res) => {
  try {
    const result = await historyLeaveService.getYearlySummary();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistoryLeaveAvailableYears = async (req, res) => {
  try {
    const result = await historyLeaveService.getAvailableYears();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistoryLeaveEmployeeSummary = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const result = await historyLeaveService.getEmployeeSummary(employee_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // Existing functions
  getLeaveTypes,
  updateLeaveType,
  getSettings,
  updateSettings,
  saveAll,

  // History leave functions
  getHistoryLeave,
  getHistoryLeaveSummary,
  getHistoryLeaveYearlySummary,
  getHistoryLeaveAvailableYears,
  getHistoryLeaveEmployeeSummary,

  // New year-end conversion functions
  triggerYearEndConversion,
  processResignationConversion,
  getPayrollAmount,
  getConversionHistory,
  getConversionsByYear,
  getConversionStats,
  deleteConversion,
};
