const employeeRequirementModel = require("../models/employeeRequirement.model");
const employeeOnboardingModel = require("../models/employeeOnboarding.model");

const getByOnboardingId = async (onboardingId) => {
  const onboarding = await employeeOnboardingModel.getById(onboardingId);
  if (!onboarding) throw new Error("Onboarding record not found");
  return await employeeRequirementModel.getByOnboardingId(onboardingId);
};

const getById = async (id) => {
  const req = await employeeRequirementModel.getById(id);
  if (!req) throw new Error("Requirement not found");
  return req;
};

const create = async (data) => {
  if (!data.onboarding_id) throw new Error("Onboarding ID is required");
  if (!data.requirement_name || !data.requirement_name.trim()) throw new Error("Requirement name is required");
  const onboarding = await employeeOnboardingModel.getById(data.onboarding_id);
  if (!onboarding) throw new Error("Onboarding record not found");
  return await employeeRequirementModel.create(data);
};

const update = async (id, data) => {
  const existing = await employeeRequirementModel.getById(id);
  if (!existing) throw new Error("Requirement not found");
  return await employeeRequirementModel.update(id, data);
};

const remove = async (id) => {
  const existing = await employeeRequirementModel.getById(id);
  if (!existing) throw new Error("Requirement not found");
  return await employeeRequirementModel.remove(id);
};

module.exports = {
  getByOnboardingId,
  getById,
  create,
  update,
  remove,
};
