const notificationService = require("../services/notification.service");

const getMyNotifications = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const safePage = Math.max(parseInt(page) || 1, 1);

    const data = await notificationService.getMyNotifications(
      user_id,
      safePage,
      safeLimit,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await notificationService.markAsRead(id, user_id);
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const notifications = await notificationService.markAllAsRead(user_id);
    res.json({ success: true, count: notifications.length });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const unreadCount = await notificationService.getUnreadCount(user_id);

    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
