const express = require("express");
const router = express.Router();
const controller = require("../controllers/kpiEvaluation.controller");
const authorize = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");
const authenticate = require("../middleware/auth.middleware");

const ADMIN_ONLY = [ROLES.ADMIN, ROLES.HR_USER];

router.get("/my-evaluations", authenticate, controller.getMyEvaluations);
router.get("/my-assignments", authenticate, controller.getMyAssignments);
router.get("/pending-count", authenticate, controller.getPendingCount);
router.get("/history", authenticate, controller.getHistory);
router.get("/hr-view", authenticate, authorize(ADMIN_ONLY), controller.getHrView);
router.post("/assign", authenticate, authorize(ADMIN_ONLY), controller.assign);
router.post("/bulk-assign", authenticate, authorize(ADMIN_ONLY), controller.bulkAssign);
router.get("/:id", authenticate, controller.getById);
router.post("/:id/scores", authenticate, controller.saveScores);
router.post("/:id/submit", authenticate, controller.submit);
router.post("/:id/self-evaluation", authenticate, controller.saveSelfEvaluation);
router.post("/:id/approve", authenticate, authorize(ADMIN_ONLY), controller.hrApprove);
router.post("/:id/reject", authenticate, authorize(ADMIN_ONLY), controller.hrReject);

module.exports = router;
