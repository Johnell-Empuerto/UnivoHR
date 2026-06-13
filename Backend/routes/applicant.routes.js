const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicant.controller");
const authenticate = require("../middleware/auth.middleware");
const requirePermission = require("../middleware/permission.middleware");

router.put("/workflow-stages/:stageRecordId", authenticate, requirePermission("recruitment.applicants.manage"), controller.updateWorkflowStage);
router.post("/workflow-stages/:stageRecordId/complete", authenticate, requirePermission("recruitment.applicants.manage"), controller.completeWorkflowStage);
router.post("/workflow-stages/:stageRecordId/skip", authenticate, requirePermission("recruitment.applicants.manage"), controller.skipWorkflowStage);
router.get("/workflow-stages/:stageRecordId/approval", authenticate, requirePermission("recruitment.view"), controller.getStageApproval);
router.post("/workflow-stages/:stageRecordId/approval/pending", authenticate, requirePermission("recruitment.applicants.manage"), controller.createPendingApproval);
router.post("/workflow-stages/:stageRecordId/approval/assign", authenticate, requirePermission("recruitment.approvals.manage"), controller.assignApproval);
router.post("/workflow-stages/:stageRecordId/approval/approve", authenticate, controller.approveStage);
router.post("/workflow-stages/:stageRecordId/approval/reject", authenticate, controller.rejectStage);
router.post("/:id/workflow-stages/move-next", authenticate, requirePermission("recruitment.applicants.manage"), controller.moveToNextStage);
router.post("/:id/workflow-stages/fail", authenticate, requirePermission("recruitment.applicants.manage"), controller.failApplicantWorkflow);

router.get("/workflow-approvals/my-assignments", authenticate, controller.getMyApprovalAssignments);
router.get("/workflow-stages/my-assignments", authenticate, controller.getMyWorkflowStageAssignments);
router.get("/possible-approvers", authenticate, controller.getPossibleApprovers);

router.post("/:id/workflow/rollback", authenticate, requirePermission("recruitment.applicants.manage"), controller.rollbackToStage);
router.post("/workflow-stages/:stageRecordId/correct-result", authenticate, requirePermission("recruitment.applicants.manage"), controller.correctStageResult);
router.post("/:id/workflow/admin-fail", authenticate, requirePermission("recruitment.applicants.manage"), controller.failDynamicApplicant);
router.post("/:id/workflow-stages/:workflowStageId/create-record", authenticate, requirePermission("recruitment.applicants.manage"), controller.createStageRecord);

router.get("/", authenticate, requirePermission("recruitment.view"), controller.getAll);
router.get("/:id", authenticate, requirePermission("recruitment.view"), controller.getById);
router.get("/:id/workflow-timeline", authenticate, requirePermission("recruitment.view"), controller.getWorkflowTimeline);
router.post("/", authenticate, requirePermission("recruitment.applicants.manage"), controller.create);
router.put("/:id", authenticate, requirePermission("recruitment.applicants.manage"), controller.update);
router.delete("/:id", authenticate, requirePermission("recruitment.applicants.manage"), controller.remove);
router.patch("/:id/status", authenticate, requirePermission("recruitment.applicants.manage"), controller.updateStatus);
router.post("/:id/convert", authenticate, requirePermission("recruitment.applicants.manage"), controller.convertToEmployee);
router.post("/:id/repair-stage-records", authenticate, requirePermission("recruitment.applicants.manage"), controller.repairStageRecords);

module.exports = router;
