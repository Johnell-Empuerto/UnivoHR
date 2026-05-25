const pool = require("../config/db");
const finalPayService = require("../services/finalPay.service");
const { getUserBranchIds } = require("../utils/branchAccess");

// Get employees eligible for final pay
const getEmployeesForFinalPay = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let allowedBranchIds = null;
    if (req.user.role !== "ADMIN") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const result = await finalPayService.getEmployeesForFinalPay(
      parseInt(page),
      parseInt(limit),
      search,
      allowedBranchIds,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate final pay (preview) — with branch access
const calculateFinalPay = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const empResult = await pool.query(`SELECT branch_id FROM employees WHERE id = $1`, [employeeId]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const empBranch = empResult.rows[0].branch_id;
      if (!empBranch || !assigned.includes(empBranch)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const result = await finalPayService.calculateFinalPay(employeeId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Process final pay — with branch access
const processFinalPay = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const empResult = await pool.query(`SELECT branch_id FROM employees WHERE id = $1`, [employeeId]);
      if (empResult.rows.length === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const empBranch = empResult.rows[0].branch_id;
      if (!empBranch || !assigned.includes(empBranch)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const processedBy = req.user.id;
    const result = await finalPayService.processFinalPay(employeeId, processedBy);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get final pay history — with branch access
const getFinalPayHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    let allowedBranchIds = null;
    if (req.user.role !== "ADMIN") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const result = await finalPayService.getFinalPayHistory(
      page,
      limit,
      search,
      allowedBranchIds,
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get final pay by ID — with branch access
const getFinalPayById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await finalPayService.getFinalPayById(id);

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const empResult = await pool.query(`SELECT branch_id FROM employees WHERE id = $1`, [result.employee_id]);
      const empBranch = empResult.rows[0]?.branch_id;
      if (!empBranch || !assigned.includes(empBranch)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download final pay slip — with branch access
const downloadFinalPaySlip = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await finalPayService.getFinalPayById(id);

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const empResult = await pool.query(`SELECT branch_id FROM employees WHERE id = $1`, [record.employee_id]);
      const empBranch = empResult.rows[0]?.branch_id;
      if (!empBranch || !assigned.includes(empBranch)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    await finalPayService.downloadFinalPaySlip(id, res);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEmployeesForFinalPay,
  calculateFinalPay,
  processFinalPay,
  getFinalPayHistory,
  getFinalPayById,
  downloadFinalPaySlip,
};
