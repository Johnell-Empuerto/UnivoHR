const applicantApprovalModel = require("../models/applicantApproval.model");
const applicantModel = require("../models/applicant.model");
const notificationService = require("./notification.service");

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
  const approval = await applicantApprovalModel.create(data);

  const applicantName = `${applicant.first_name} ${applicant.last_name}`;
  if (data.approved_by) {
    applicantModel.getUserIdsByEmployeeIds([data.approved_by]).then(users => {
      if (users.length > 0) {
        notificationService.notify({
          user_id: users[0].id,
          type: "RECRUITMENT",
          title: "Approval Required",
          message: `${applicantName} requires your ${data.approval_type} approval`,
          reference_id: data.applicant_id,
        }).catch(err => console.error("[RECRUITMENT] Notification error:", err));
      }
    });
  }

  return approval;
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
    await applicantModel.updateStatus(approval.applicant_id, "Completed");
  } else if (data.decision === "REJECTED") {
    await applicantModel.updateStatus(approval.applicant_id, "Fail");
  }

  if (data.decision) {
    const applicant = await applicantModel.getById(existing.applicant_id);
    const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : `Applicant #${existing.applicant_id}`;
    applicantModel.getActiveHRUserIds().then(userIds => {
      if (userIds.length === 0) return;
      const promises = userIds.map(uid =>
        notificationService.notify({
          user_id: uid,
          type: "RECRUITMENT",
          title: `Applicant ${data.decision.charAt(0) + data.decision.slice(1).toLowerCase()}`,
          message: `${applicantName} was ${data.decision.toLowerCase()} on ${existing.approval_type}`,
          reference_id: existing.applicant_id,
        })
      );
      Promise.all(promises).catch(err => console.error("[RECRUITMENT] Notification error:", err));
    });
  }

  return approval;
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
};
