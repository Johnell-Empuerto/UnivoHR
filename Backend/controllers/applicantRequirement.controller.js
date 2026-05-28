const applicantRequirementService = require("../services/applicantRequirement.service");

const getByApplicantId = async (req, res) => {
  try {
    const requirements = await applicantRequirementService.getByApplicantId(req.params.id);
    res.json(requirements);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const requirement = await applicantRequirementService.create(req.params.id, req.body);
    res.status(201).json(requirement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const requirement = await applicantRequirementService.update(
      req.params.id,
      req.params.requirementId,
      req.body,
    );
    res.json(requirement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await applicantRequirementService.remove(req.params.id, req.params.requirementId);
    res.json({ message: "Requirement deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getByApplicantId,
  create,
  update,
  remove,
};
