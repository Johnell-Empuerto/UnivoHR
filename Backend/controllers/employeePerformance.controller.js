const service = require("../services/employeePerformance.service");

const getSummary = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getSummary(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProbationInfo = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getProbationInfo(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary, getProbationInfo };
