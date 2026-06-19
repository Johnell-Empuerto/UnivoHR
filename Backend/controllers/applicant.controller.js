const applicantService = require("../services/applicant.service");
const applicantWorkflowService = require("../services/applicantWorkflow.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    let { page, limit, search, status, job_position_id } = req.query;

    // Normalize status: treat falsy or "all" as no filter
    if (!status || status === "all" || status === "null") {
      status = "";
    }

    // Normalize/validate job_position_id: treat falsy or "all" as no filter
    if (!job_position_id || job_position_id === "all" || job_position_id === "null") {
      job_position_id = "";
    } else {
      const parsed = parseInt(job_position_id, 10);
      if (isNaN(parsed) || String(parsed) !== job_position_id.trim()) {
        return res.status(400).json({ message: "Invalid job_position_id filter." });
      }
      job_position_id = String(parsed);
    }

    const result = await applicantService.getAll(page, limit, search, status, job_position_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const applicant = await applicantService.getById(req.params.id);
    res.json(applicant);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const applicant = await applicantService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { first_name: applicant.first_name, last_name: applicant.last_name, job_position_id: applicant.job_position_id, status: applicant.status },
      description: `Applicant created: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.status(201).json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("applicants", req.params.id);
    const applicant = await applicantService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: applicant.id,
      old_values: oldValues ? { status: oldValues.status, rating: oldValues.rating } : null,
      new_values: { status: applicant.status, rating: applicant.rating },
      description: `Applicant updated: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const applicant = await applicantService.updateStatus(req.params.id, req.body.status);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { status: applicant.status },
      description: `Applicant status updated to ${applicant.status}: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const applicant = await applicantService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { first_name: applicant.first_name, last_name: applicant.last_name },
      description: `Applicant deleted: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json({ message: "Applicant deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const repairStageRecords = async (req, res) => {
  try {
    const result = await applicantService.repairApplicantStageRecords(req.params.id);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: req.params.id,
      new_values: { repaired: true, interviews_created: result.interviews_created, approval_created: result.approval_created },
      description: `Stage records repaired for applicant #${req.params.id}: ${result.interviews_created.length} interview(s), approval=${result.approval_created}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getWorkflowTimeline = async (req, res) => {
  try {
    const timeline = await applicantWorkflowService.getApplicantWorkflowTimeline(req.params.id);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const convertToEmployee = async (req, res) => {
  try {
    const employee = await applicantService.convertToEmployee(req.params.id, req.body);

    if (!employee.linked) {
      audit.auditLog(req, {
        action: "INSERT",
        table_name: "employees",
        record_id: employee.id,
        new_values: { employee_code: employee.employee_code, first_name: employee.first_name, last_name: employee.last_name, status: "ACTIVE" },
        description: `Employee created from applicant: ${employee.first_name} ${employee.last_name} (${employee.employee_code})`,
      });
    }

    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: req.params.id,
      new_values: { status: "Completed", employee_id: employee.id },
      description: `Applicant #${req.params.id} converted to employee #${employee.id}`,
    });

    res.status(201).json(employee);
  } catch (error) {
    const msg = error.message || "";
    if (msg.includes("foreign key constraint")) {
      return res.status(400).json({ message: "Unable to link applicant to employee. Please refresh and try again." });
    }
    if (msg.includes("already been converted")) {
      return res.status(400).json({ message: "This applicant has already been converted to an employee." });
    }
    res.status(400).json({ message: msg });
  }
};

const updateWorkflowStage = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.updateStageRecord(stageRecordId, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_records",
      record_id: stageRecordId,
      new_values: req.body,
      description: `Workflow stage record #${stageRecordId} updated`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const completeWorkflowStage = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.completeStage(stageRecordId, req.body, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_records",
      record_id: stageRecordId,
      new_values: { status: "COMPLETED", ...req.body },
      description: `Workflow stage #${stageRecordId} completed`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const moveToNextStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStageRecordId } = req.body;
    if (!currentStageRecordId) return res.status(400).json({ message: "currentStageRecordId is required" });
    const result = await applicantWorkflowService.moveToNextStage(id, currentStageRecordId, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_workflow_instances",
      record_id: result.new_stage_record?.workflow_instance_id,
      new_values: { current_stage_id: result.next_stage_id },
      description: `Applicant #${id} moved to next workflow stage`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const failApplicantWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStageRecordId } = req.body;
    if (!currentStageRecordId) return res.status(400).json({ message: "currentStageRecordId is required" });
    const result = await applicantWorkflowService.failWorkflow(id, currentStageRecordId, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_workflow_instances",
      record_id: id,
      new_values: { status: "FAILED" },
      description: `Applicant #${id} workflow failed`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const skipWorkflowStage = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.skipStage(stageRecordId, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_records",
      record_id: stageRecordId,
      new_values: { status: "SKIPPED" },
      description: `Workflow stage #${stageRecordId} skipped`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStageApproval = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.getStageApproval(stageRecordId);
    if (!result) return res.json(null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPendingApproval = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.createPendingStageApprovalIfNeeded(stageRecordId);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_stage_approvals",
      record_id: result.id,
      new_values: { decision: "PENDING" },
      description: `Dynamic approval created for stage record #${stageRecordId}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const approveStage = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const { comments } = req.body;
    const result = await applicantWorkflowService.approveStage(stageRecordId, comments, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_approvals",
      record_id: stageRecordId,
      new_values: { decision: "APPROVED" },
      description: `Dynamic approval approved for stage record #${stageRecordId}`,
    });
    res.json(result);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

const rejectStage = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const { comments } = req.body;
    const result = await applicantWorkflowService.rejectStage(stageRecordId, comments, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_approvals",
      record_id: stageRecordId,
      new_values: { decision: "REJECTED" },
      description: `Dynamic approval rejected for stage record #${stageRecordId}`,
    });
    res.json(result);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

const assignApproval = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.assignApprovalStage(stageRecordId, req.body, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_approvals",
      record_id: stageRecordId,
      new_values: { assigned_user_id: req.body.assigned_user_id, assigned_employee_id: req.body.assigned_employee_id, scheduled_at: req.body.scheduled_at },
      description: `Approval assigned for stage record #${stageRecordId}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getMyApprovalAssignments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const employeeId = req.user?.employee_id;
    const result = await applicantWorkflowService.getMyApprovalAssignments(userId, employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyWorkflowStageAssignments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const employeeId = req.user?.employee_id;
    const result = await applicantWorkflowService.getMyWorkflowStageAssignments(userId, employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPossibleApprovers = async (req, res) => {
  try {
    const result = await applicantWorkflowService.getPossibleApprovers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssignableUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);
    const result = await applicantWorkflowService.getAssignableUsers(Number(page), safeLimit, search);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rollbackToStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_stage_id, reason } = req.body;
    if (!target_stage_id) return res.status(400).json({ message: "Target stage ID is required." });
    if (!reason || !reason.trim()) return res.status(400).json({ message: "Correction reason is required." });
    const result = await applicantWorkflowService.rollbackToStage(Number(id), Number(target_stage_id), reason, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_workflow_instances",
      record_id: Number(id),
      new_values: { target_stage_id, reason },
      description: `Admin rollback: applicant #${id} rolled back to stage #${target_stage_id}. Reason: ${reason}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const correctStageResult = async (req, res) => {
  try {
    const { stageRecordId } = req.params;
    const result = await applicantWorkflowService.correctStageResult(Number(stageRecordId), req.body, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_stage_records",
      record_id: Number(stageRecordId),
      old_values: result.old_values,
      new_values: result.new_values,
      description: `Admin correction: stage #${stageRecordId} corrected. Reason: ${req.body.correction_reason}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const failDynamicApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ message: "Failure reason is required." });
    const result = await applicantWorkflowService.failDynamicApplicant(Number(id), reason, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_workflow_instances",
      record_id: Number(id),
      new_values: { status: "FAILED", reason },
      description: `Admin force-fail: applicant #${id} failed. Reason: ${reason}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createStageRecord = async (req, res) => {
  try {
    const { id, workflowStageId } = req.params;
    const result = await applicantWorkflowService.createStageRecord(Number(id), Number(workflowStageId), req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_stage_records",
      record_id: result.id,
      new_values: { workflow_stage_id: workflowStageId, status: result.status, assigned_user_id: req.body.assigned_user_id, scheduled_at: req.body.scheduled_at },
      description: `Stage record created/scheduled for applicant #${id}, workflow stage #${workflowStageId}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  convertToEmployee,
  updateStatus,
  repairStageRecords,
  getWorkflowTimeline,
  updateWorkflowStage,
  completeWorkflowStage,
  moveToNextStage,
  failApplicantWorkflow,
  skipWorkflowStage,
  getStageApproval,
  createPendingApproval,
  approveStage,
  rejectStage,
  assignApproval,
  getMyApprovalAssignments,
  getMyWorkflowStageAssignments,
  getPossibleApprovers,
  getAssignableUsers,
  rollbackToStage,
  correctStageResult,
  failDynamicApplicant,
  createStageRecord,
};
