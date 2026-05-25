const pool = require("../config/db");

const payrollLock = async (req, res, next) => {
  const payrollId = req.params.id;
  if (!payrollId) return next();

  try {
    const result = await pool.query(
      "SELECT status FROM payroll WHERE id = $1",
      [payrollId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payroll not found" });
    }
    if (result.rows[0].status === "LOCKED") {
      return res.status(423).json({
        message: "Payroll is locked and cannot be modified",
      });
    }
    if (result.rows[0].status === "PAID") {
      return res.status(423).json({
        message: "Payroll has already been paid and cannot be modified",
      });
    }
    next();
  } catch {
    res.status(500).json({ message: "Error checking payroll status" });
  }
};

module.exports = payrollLock;
