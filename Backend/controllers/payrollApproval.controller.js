const payrollApprovalModel = require("../models/payrollApproval.model");
const audit = require("../services/audit.service");

const createApprovalRequest = async (req, res, next) => {
  try {
    const { payroll_id, cutoff_start, cutoff_end, branch_id } = req.body;
    const data = await payrollApprovalModel.createApprovalRequest(payroll_id, cutoff_start, cutoff_end, branch_id, req.user.id);
    audit.auditLog(req, {
      action: "CREATE",
      table_name: "payroll_approvals",
      record_id: data.id,
      branch_id,
      description: `Approval request created for payroll ${payroll_id} by user ${req.user.id}`,
    });
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

const getApprovalRequests = async (req, res, next) => {
  try {
    const { branch_id, status } = req.query;
    const data = await payrollApprovalModel.getApprovalRequests(branch_id || null, status || null);
    res.json({ data });
  } catch (err) { next(err); }
};

const reviewApprovalRequest = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const data = await payrollApprovalModel.reviewApprovalRequest(req.params.id, status, req.user.id, remarks);
    audit.auditLog(req, {
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      table_name: "payroll_approvals",
      record_id: Number(req.params.id),
      description: `Approval request ${req.params.id} ${status} by user ${req.user.id}${remarks ? `: ${remarks}` : ""}`,
    });
    res.json({ data });
  } catch (err) { next(err); }
};

module.exports = {
  createApprovalRequest,
  getApprovalRequests,
  reviewApprovalRequest,
};
