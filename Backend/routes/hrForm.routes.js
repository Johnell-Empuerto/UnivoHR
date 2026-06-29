const express = require("express");
const router = express.Router();
const controller = require("../controllers/hrForm.controller");
const requirePermission = require("../middleware/permission.middleware");
const authenticate = require("../middleware/auth.middleware");

router.get("/my-assignments", authenticate, controller.getMyAssignments);
router.get("/assignments/all", authenticate, requirePermission("forms.view"), controller.getAllAssignments);
router.get("/assignments/:assignmentId", authenticate, controller.getAssignmentById);
router.put("/assignments/:assignmentId", authenticate, requirePermission("forms.builder.manage"), controller.editAssignment);
router.delete("/assignments/:assignmentId", authenticate, requirePermission("forms.builder.manage"), controller.removeAssignment);
router.post("/assignments/:assignmentId/submit", authenticate, controller.submitForm);
router.get("/submissions/all", authenticate, requirePermission("forms.view"), controller.getSubmissions);
router.get("/submissions/:submissionId", authenticate, requirePermission("forms.submissions.view"), controller.getSubmissionById);
router.patch("/submissions/:submissionId/review", authenticate, requirePermission("forms.builder.manage"), controller.reviewSubmission);
router.put("/fields/:fieldId", authenticate, requirePermission("forms.builder.manage"), controller.editField);
router.delete("/fields/:fieldId", authenticate, requirePermission("forms.builder.manage"), controller.removeField);
router.get("/", authenticate, requirePermission("forms.view"), controller.getAllForms);
router.post("/", authenticate, requirePermission("forms.builder.manage"), controller.createForm);
router.get("/:formId/fields", authenticate, requirePermission("forms.view"), controller.getFields);
router.post("/:formId/fields", authenticate, requirePermission("forms.builder.manage"), controller.addField);
router.get("/:id", authenticate, controller.getFormById);
router.patch("/:id", authenticate, requirePermission("forms.builder.manage"), controller.updateForm);
router.delete("/:id", authenticate, requirePermission("forms.builder.manage"), controller.deleteForm);
router.post("/:id/assign", authenticate, requirePermission("forms.builder.manage"), controller.assignForm);

module.exports = router;
