const leaveCreditService = require("../services/leaveCredit.service");
const audit = require("../services/audit.service");

const getMyCredits = async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;

    const data = await leaveCreditService.getMyCredits(employeeId);

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAllCredits = async (req, res, next) => {
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
    next(error);
  }
};

const getEmployeeCredits = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const data = await leaveCreditService.getEmployeeCredits(employeeId);

    res.json(data);
  } catch (error) {
    next(error);
  }
};

const updateCredits = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const data = await leaveCreditService.updateCredits(employeeId, req.body);

    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_leave_balances",
      record_id: data?.id || null,
      employee_id: Number(employeeId),
      new_values: req.body,
      description: `Leave credits updated for employee ${employeeId}`,
    });

    res.json({
      message: "Credits updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCredits,
  getAllCredits,
  getEmployeeCredits,
  updateCredits,
};
