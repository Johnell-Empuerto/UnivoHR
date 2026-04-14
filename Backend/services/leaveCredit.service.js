const leaveCreditModel = require("../models/leaveCredit.model");

const getMyCredits = async (employeeId) => {
  let credits = await leaveCreditModel.getByEmployee(employeeId);

  // AUTO CREATE IF NOT EXISTS
  if (!credits) {
    credits = await leaveCreditModel.createDefault(employeeId);
  }

  // Add calculated fields for frontend convenience
  return {
    ...credits,
    sick_leave_remaining: credits.sick_leave - credits.used_sick_leave,
    vacation_leave_remaining:
      credits.vacation_leave - credits.used_vacation_leave,
    maternity_leave_remaining:
      credits.maternity_leave - credits.used_maternity_leave,

    emergency_leave_remaining:
      credits.emergency_leave - credits.used_emergency_leave,
  };
};

module.exports = {
  getMyCredits,
};
