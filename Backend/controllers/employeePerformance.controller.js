const service = require("../services/employeePerformance.service");

const getSummary = async (req, res, next) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getSummary(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getProbationInfo = async (req, res, next) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getProbationInfo(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getProbationInfo };
