const express = require("express");
const router = express.Router();
const controller = require("../controllers/hrForm.controller");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

const ADMIN_ONLY = [ROLES.ADMIN, ROLES.HR_USER];

router.get("/my-assignments", authenticate, controller.getMyAssignments);
router.get("/assignments/all", authenticate, authorize(ADMIN_ONLY), controller.getAllAssignments);
router.get("/assignments/:assignmentId", authenticate, controller.getAssignmentById);
router.post("/assignments/:assignmentId/submit", authenticate, controller.submitForm);
router.get("/submissions/all", authenticate, authorize(ADMIN_ONLY), controller.getSubmissions);
router.get("/submissions/:submissionId", authenticate, controller.getSubmissionById);
router.patch("/submissions/:submissionId/review", authenticate, authorize(ADMIN_ONLY), controller.reviewSubmission);
router.put("/fields/:fieldId", authenticate, authorize(ADMIN_ONLY), controller.editField);
router.delete("/fields/:fieldId", authenticate, authorize(ADMIN_ONLY), controller.removeField);
router.get("/", authenticate, authorize(ADMIN_ONLY), controller.getAllForms);
router.post("/", authenticate, authorize(ADMIN_ONLY), controller.createForm);
router.get("/:formId/fields", authenticate, authorize(ADMIN_ONLY), controller.getFields);
router.post("/:formId/fields", authenticate, authorize(ADMIN_ONLY), controller.addField);
router.get("/:id", authenticate, controller.getFormById);
router.patch("/:id", authenticate, authorize(ADMIN_ONLY), controller.updateForm);
router.delete("/:id", authenticate, authorize(ADMIN_ONLY), controller.deleteForm);
router.post("/:id/assign", authenticate, authorize(ADMIN_ONLY), controller.assignForm);

module.exports = router;
