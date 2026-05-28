const applicantRequirementModel = require("../models/applicantRequirement.model");
const applicantModel = require("../models/applicant.model");

const VALID_STATUSES = ["Pending", "Completed", "Rejected"];

const getByApplicantId = async (applicantId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantRequirementModel.getByApplicantId(applicantId);
};

const create = async (applicantId, data) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  if (!data.requirement_name || !data.requirement_name.trim()) {
    throw new Error("Requirement name is required");
  }
  const status = data.status || "Pending";
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid status. Must be Pending, Completed, or Rejected");
  }
  return await applicantRequirementModel.create({
    applicant_id: applicantId,
    requirement_name: data.requirement_name.trim(),
    status,
    remarks: data.remarks || null,
  });
};

const update = async (applicantId, requirementId, data) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");

  const existing = await applicantRequirementModel.getById(requirementId);
  if (!existing) throw new Error("Requirement not found");
  if (Number(existing.applicant_id) !== Number(applicantId)) {
    throw new Error("Requirement does not belong to this applicant");
  }

  const payload = {
    requirement_name: data.requirement_name !== undefined ? data.requirement_name.trim() : existing.requirement_name,
    status: data.status !== undefined ? data.status : existing.status,
    remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
    verified_date: existing.verified_date,
  };

  if (!VALID_STATUSES.includes(payload.status)) {
    throw new Error("Invalid status. Must be Pending, Completed, or Rejected");
  }

  if (payload.status === "Completed" && !existing.verified_date) {
    payload.verified_date = new Date().toISOString().split("T")[0];
  }

  return await applicantRequirementModel.update(requirementId, payload);
};

const remove = async (applicantId, requirementId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");

  const existing = await applicantRequirementModel.getById(requirementId);
  if (!existing) throw new Error("Requirement not found");
  if (Number(existing.applicant_id) !== Number(applicantId)) {
    throw new Error("Requirement does not belong to this applicant");
  }

  return await applicantRequirementModel.remove(requirementId);
};

const hasUncompletedRequirements = async (applicantId) => {
  const requirements = await applicantRequirementModel.getByApplicantId(applicantId);
  if (requirements.length === 0) return false;
  return requirements.some((r) => r.status !== "Completed");
};

module.exports = {
  getByApplicantId,
  create,
  update,
  remove,
  hasUncompletedRequirements,
};
