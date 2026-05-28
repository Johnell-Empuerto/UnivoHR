const employeeOnboardingService = require("../services/employeeOnboarding.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await employeeOnboardingService.getAll(page, limit, search, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const onboarding = await employeeOnboardingService.getById(req.params.id);
    res.json(onboarding);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const onboarding = await employeeOnboardingService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_onboarding",
      record_id: onboarding.id,
      new_values: { employee_id: onboarding.employee_id, applicant_id: onboarding.applicant_id, status: onboarding.status },
      description: `Onboarding created for employee #${onboarding.employee_id}`,
    });
    res.status(201).json(onboarding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const onboarding = await employeeOnboardingService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_onboarding",
      record_id: onboarding.id,
      new_values: { status: onboarding.status, notes: onboarding.notes },
      description: `Onboarding #${onboarding.id} updated to ${onboarding.status}`,
    });
    res.json(onboarding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
};
