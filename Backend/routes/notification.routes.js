const express = require("express");
const router = express.Router();
const controller = require("../controllers/notification.controller");
const authenticate = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

router.get("/", controller.getMyNotifications);
router.get("/unread-count", controller.getUnreadCount);
router.put("/:id/read", controller.markAsRead);
router.put("/read-all", controller.markAllAsRead);

module.exports = router;
