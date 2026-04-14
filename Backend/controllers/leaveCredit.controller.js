const leaveCreditService = require("../services/leaveCredit.service");

const getMyCredits = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    const data = await leaveCreditService.getMyCredits(employeeId);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyCredits,
};
