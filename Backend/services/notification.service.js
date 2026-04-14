const model = require("../models/notification.model");
const { getIO } = require("../config/socket");
const redisClient = require("../config/redis");

const notify = async ({
  user_id,
  type,
  title,
  message,
  reference_id,
  meta,
}) => {
  if (!user_id) return null;

  const notification = await model.createNotification({
    user_id,
    type,
    title,
    message,
    reference_id,
    meta,
  });

  try {
    const io = getIO();

    // UPDATE REDIS unread count
    const redisKey = `unread:${user_id}`;

    let unreadCount = await redisClient.get(redisKey);

    if (unreadCount === null) {
      // fallback to DB
      unreadCount = await model.getUnreadCount(user_id);
    } else {
      unreadCount = parseInt(unreadCount) + 1;
    }

    await redisClient.set(redisKey, unreadCount);

    if (io) {
      io.to(`user_${user_id}`).emit("notification", notification);
      io.to(`user_${user_id}`).emit("unread_count", unreadCount);
    }
  } catch (err) {
    console.error("Socket notification failed:", err.message);
  }

  return notification;
};

const getMyNotifications = async (user_id, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const notifications = await model.getByUser(user_id, limit, offset);
  const totalCount = await model.getTotalCount(user_id);
  const unreadCount = await model.getUnreadCount(user_id);

  return {
    data: notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    unreadCount,
  };
};

//  ADD THIS METHOD - Handles Redis caching for unread count
const getUnreadCount = async (user_id) => {
  const redisKey = `unread:${user_id}`;

  let unreadCount = await redisClient.get(redisKey);

  if (unreadCount === null) {
    // Cache miss - get from database
    unreadCount = await model.getUnreadCount(user_id);
    // Store in Redis with TTL (1 hour)
    await redisClient.set(redisKey, unreadCount, "EX", 3600);
  } else {
    unreadCount = parseInt(unreadCount);
  }

  return unreadCount;
};

const markAsRead = async (id, user_id) => {
  const notification = await model.markAsRead(id, user_id);

  const redisKey = `unread:${user_id}`;

  let unreadCount = await redisClient.get(redisKey);

  if (unreadCount !== null) {
    unreadCount = Math.max(0, parseInt(unreadCount) - 1);
    await redisClient.set(redisKey, unreadCount);
  } else {
    unreadCount = await model.getUnreadCount(user_id);
  }

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${user_id}`).emit("unread_count", unreadCount);
    }
  } catch (err) {}

  return notification;
};

const markAllAsRead = async (user_id) => {
  const notifications = await model.markAllAsRead(user_id);

  const redisKey = `unread:${user_id}`;
  await redisClient.set(redisKey, 0);

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${user_id}`).emit("unread_count", 0);
    }
  } catch (err) {}

  return notifications;
};

module.exports = {
  notify,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
