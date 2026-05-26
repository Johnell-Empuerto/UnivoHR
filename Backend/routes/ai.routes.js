const express = require("express");
const router = express.Router();

const controller = require("../controllers/ai.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const aiAccess = require("../middleware/aiAccess.middleware");

const ROLES = require("../constants/roles");
const ALL_ROLES = [ROLES.ADMIN, ROLES.HR_ADMIN, ROLES.HR, ROLES.EMPLOYEE];

// Feature flag: disable all AI chatbot endpoints when AI_CHATBOT_ENABLED=false
router.use((req, res, next) => {
  if (process.env.AI_CHATBOT_ENABLED !== "true") {
    return res.status(404).json({ message: "AI Assistant is currently disabled." });
  }
  next();
});

router.post("/chat", authenticate, authorize(ALL_ROLES), aiAccess, controller.chat);
router.get("/sessions", authenticate, authorize(ALL_ROLES), controller.getSessions);
router.get("/sessions/:sessionId/messages", authenticate, authorize(ALL_ROLES), controller.getMessages);
router.delete("/sessions/:sessionId", authenticate, authorize(ALL_ROLES), controller.deleteSession);
router.post("/feedback", authenticate, authorize(ALL_ROLES), controller.submitFeedback);

module.exports = router;
