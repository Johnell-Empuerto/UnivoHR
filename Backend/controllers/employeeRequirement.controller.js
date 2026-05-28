const employeeRequirementService = require("../services/employeeRequirement.service");
const audit = require("../services/audit.service");

const getByOnboardingId = async (req, res) => {
  try {
    const requirements = await employeeRequirementService.getByOnboardingId(req.params.onboardingId);
    res.json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const requirement = await employeeRequirementService.create({ ...req.body, onboarding_id: req.params.onboardingId });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_requirements",
      record_id: requirement.id,
      new_values: { onboarding_id: requirement.onboarding_id, requirement_name: requirement.requirement_name, status: requirement.status },
      description: `Requirement added to onboarding #${requirement.onboarding_id}: ${requirement.requirement_name}`,
    });
    res.status(201).json(requirement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const requirement = await employeeRequirementService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_requirements",
      record_id: requirement.id,
      new_values: { status: requirement.status, requirement_name: requirement.requirement_name },
      description: `Requirement #${requirement.id} updated to ${requirement.status}`,
    });
    res.json(requirement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const requirement = await employeeRequirementService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "employee_requirements",
      record_id: requirement.id,
      new_values: { requirement_name: requirement.requirement_name },
      description: `Requirement deleted: ${requirement.requirement_name}`,
    });
    res.json({ message: "Requirement deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getByOnboardingId,
  create,
  update,
  remove,
};
