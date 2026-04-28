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

// GET ALL CREDITS (ADMIN/HR_ADMIN)
const getAllCredits = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", department = "" } = req.query;

    const data = await leaveCreditService.getAllCredits(
      parseInt(page),
      parseInt(limit),
      search,
      department
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
const getEmployeeCredits = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const data = await leaveCreditService.getEmployeeCredits(employeeId);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE EMPLOYEE CREDITS (ADMIN/HR_ADMIN)
const updateCredits = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      sick_leave,
      vacation_leave,
      maternity_leave,
      emergency_leave,
    } = req.body;

    const data = await leaveCreditService.updateCredits(employeeId, {
      sick_leave,
      vacation_leave,
      maternity_leave,
      emergency_leave,
    });

    res.json({
      message: "Credits updated successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyCredits,
  getAllCredits,
  getEmployeeCredits,
  updateCredits,
};
