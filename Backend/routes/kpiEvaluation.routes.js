const express = require("express");
const router = express.Router();
const controller = require("../controllers/kpiEvaluation.controller");
const requirePermission = require("../middleware/permission.middleware");
const authenticate = require("../middleware/auth.middleware");

router.get("/my-evaluations", authenticate, controller.getMyEvaluations);
router.get("/my-assignments", authenticate, controller.getMyAssignments);
router.get("/pending-count", authenticate, controller.getPendingCount);
router.get("/history", authenticate, controller.getHistory);
router.get("/hr-view", authenticate, requirePermission("performance.evaluations.manage"), controller.getHrView);
router.post("/assign", authenticate, requirePermission("performance.evaluations.manage"), controller.assign);
router.post("/bulk-assign", authenticate, requirePermission("performance.evaluations.manage"), controller.bulkAssign);
router.get("/:id", authenticate, controller.getById);
router.post("/:id/scores", authenticate, controller.saveScores);
router.post("/:id/submit", authenticate, controller.submit);
router.post("/:id/self-evaluation", authenticate, controller.saveSelfEvaluation);
router.post("/:id/approve", authenticate, requirePermission("performance.evaluations.manage"), controller.hrApprove);
router.post("/:id/reject", authenticate, requirePermission("performance.evaluations.manage"), controller.hrReject);

module.exports = router;
