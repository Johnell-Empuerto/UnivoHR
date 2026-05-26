const express = require("express");
const router = express.Router();

const controller = require("../controllers/ai.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const aiAccess = require("../middleware/aiAccess.middleware");

const ROLES = require("../constants/roles");
const ALL_ROLES = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE];

router.post("/chat", authenticate, authorize(ALL_ROLES), aiAccess, controller.chat);
router.get("/sessions", authenticate, authorize(ALL_ROLES), controller.getSessions);
router.get("/sessions/:sessionId/messages", authenticate, authorize(ALL_ROLES), controller.getMessages);
router.delete("/sessions/:sessionId", authenticate, authorize(ALL_ROLES), controller.deleteSession);
router.post("/feedback", authenticate, authorize(ALL_ROLES), controller.submitFeedback);

module.exports = router;
