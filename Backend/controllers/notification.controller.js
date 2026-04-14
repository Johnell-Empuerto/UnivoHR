const notificationService = require("../services/notification.service");

const getMyNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Ensure limit is reasonable (max 100)
    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const data = await notificationService.getMyNotifications(
      user_id,
      safePage,
      safeLimit,
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await notificationService.markAsRead(id, user_id);
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;

    const notifications = await notificationService.markAllAsRead(user_id);
    res.json({ success: true, count: notifications.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  FIXED: Use service instead of direct model access
const getUnreadCount = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Call service method (which handles Redis + DB)
    const unreadCount = await notificationService.getUnreadCount(user_id);

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
