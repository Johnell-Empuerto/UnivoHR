const applicantApprovalService = require("../services/applicantApproval.service");
const audit = require("../services/audit.service");

const getByApplicantId = async (req, res, next) => {
  try {
    const approvals = await applicantApprovalService.getByApplicantId(req.params.applicantId);
    res.json(approvals);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res) => {
  try {
    const approval = await applicantApprovalService.create({ ...req.body, applicant_id: req.params.applicantId });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_approvals",
      record_id: approval.id,
      new_values: { applicant_id: approval.applicant_id, approval_type: approval.approval_type, decision: approval.decision },
      description: `Approval request created for applicant #${approval.applicant_id}: ${approval.approval_type}`,
    });
    res.status(201).json(approval);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("applicant_approvals", req.params.id);
    if (!req.body.approved_by && (req.body.decision === "APPROVED" || req.body.decision === "REJECTED")) {
      req.body.approved_by = req.user?.employee_id || req.body.approved_by;
    }
    const approval = await applicantApprovalService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_approvals",
      record_id: approval.id,
      old_values: oldValues ? { decision: oldValues.decision } : null,
      new_values: { decision: approval.decision, comments: approval.comments },
      description: `Approval #${approval.id} decision: ${approval.decision}`,
    });
    res.json(approval);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getByApplicantId,
  create,
  update,
};
