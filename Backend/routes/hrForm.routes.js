const express = require("express");
const router = express.Router();
const controller = require("../controllers/hrForm.controller");
const authorize = require("../middleware/role.middleware");
const ROLES = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

router.get("/my-assignments", authenticate, controller.getMyAssignments);

router.get("/assignments/all", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getAllAssignments);
router.get("/assignments/:assignmentId", authenticate, controller.getAssignmentById);
router.post("/assignments/:assignmentId/submit", authenticate, controller.submitForm);

router.get("/submissions/all", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getSubmissions);
router.get("/submissions/:submissionId", authenticate, controller.getSubmissionById);
router.patch("/submissions/:submissionId/review", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.reviewSubmission);

router.put("/fields/:fieldId", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.editField);
router.delete("/fields/:fieldId", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.removeField);

router.get("/", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getAllForms);
router.post("/", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.createForm);

router.get("/:formId/fields", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.getFields);
router.post("/:formId/fields", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.addField);

router.get("/:id", authenticate, controller.getFormById);
router.patch("/:id", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.updateForm);
router.delete("/:id", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.deleteForm);
router.post("/:id/assign", authenticate, authorize([ROLES.ADMIN, ROLES.HR_ADMIN]), controller.assignForm);

module.exports = router;
