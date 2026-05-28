const applicantApprovalModel = require("../models/applicantApproval.model");
const applicantModel = require("../models/applicant.model");

const getByApplicantId = async (applicantId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantApprovalModel.getByApplicantId(applicantId);
};

const getById = async (id) => {
  const approval = await applicantApprovalModel.getById(id);
  if (!approval) throw new Error("Approval record not found");
  return approval;
};

const create = async (data) => {
  if (!data.applicant_id) throw new Error("Applicant ID is required");
  if (!data.approval_type) throw new Error("Approval type is required");
  const applicant = await applicantModel.getById(data.applicant_id);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantApprovalModel.create(data);
};

const update = async (id, data) => {
  const existing = await applicantApprovalModel.getById(id);
  if (!existing) throw new Error("Approval record not found");

  const payload = {
    approved_by: data.approved_by ?? existing.approved_by,
    approval_type: data.approval_type ?? existing.approval_type,
    decision: data.decision ?? existing.decision,
    comments: data.comments ?? existing.comments,
    decided_at: data.decision ? new Date() : existing.decided_at,
  };

  const approval = await applicantApprovalModel.update(id, payload);

  if (data.decision === "APPROVED") {
    await applicantModel.updateStatus(approval.applicant_id, "APPROVED");
  } else if (data.decision === "REJECTED") {
    await applicantModel.updateStatus(approval.applicant_id, "REJECTED");
  }

  return approval;
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
};
