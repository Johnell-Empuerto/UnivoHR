jest.mock("../models/notification.model", () => ({
  createNotification: jest.fn(),
  getByUser: jest.fn(),
  getTotalCount: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
}));

jest.mock("../config/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("../config/socket", () => ({
  getIO: jest.fn(),
}));

jest.mock("../utils/logger", () => ({ error: jest.fn() }));

const model = require("../models/notification.model");
const redisClient = require("../config/redis");
const { getIO } = require("../config/socket");
const {
  notify, getMyNotifications, getUnreadCount, markAsRead,
} = require("../services/notification.service");

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("notify", () => {
    it("creates notification and emits socket event", async () => {
      model.createNotification.mockResolvedValue({ id: 1, title: "Test" });
      redisClient.get.mockResolvedValue("5");
      redisClient.set.mockResolvedValue("OK");
      getIO.mockReturnValue({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      });

      const result = await notify({
        user_id: 1,
        type: "INFO",
        title: "Test",
        message: "Hello",
        reference_id: null,
        meta: {},
      });

      expect(result).toEqual({ id: 1, title: "Test" });
      expect(redisClient.set).toHaveBeenCalledWith("unread:1", 6, "EX", 3600);

      const io = getIO();
      expect(io.to).toHaveBeenCalledWith("user_1");
      expect(io.emit).toHaveBeenCalledWith("notification", { id: 1, title: "Test" });
    });

    it("returns null when user_id is falsy", async () => {
      const result = await notify({ user_id: null, type: "INFO" });
      expect(result).toBeNull();
      expect(model.createNotification).not.toHaveBeenCalled();
    });

    it("falls back to DB when Redis unread is null", async () => {
      model.createNotification.mockResolvedValue({ id: 1 });
      redisClient.get.mockResolvedValue(null);
      model.getUnreadCount.mockResolvedValue(3);
      redisClient.set.mockResolvedValue("OK");
      getIO.mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() });

      await notify({ user_id: 1, type: "INFO", title: "T", message: "M" });

      expect(model.getUnreadCount).toHaveBeenCalledWith(1);
      expect(redisClient.set).toHaveBeenCalledWith("unread:1", 3, "EX", 3600);
    });

    it("does not crash when socket fails", async () => {
      model.createNotification.mockResolvedValue({ id: 1 });
      redisClient.get.mockResolvedValue("5");
      redisClient.set.mockResolvedValue("OK");
      getIO.mockImplementation(() => { throw new Error("Socket error"); });

      const result = await notify({ user_id: 1, type: "INFO", title: "T", message: "M" });

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("getMyNotifications", () => {
    it("returns paginated notifications", async () => {
      model.getByUser.mockResolvedValue([{ id: 1, title: "Notif" }]);
      model.getTotalCount.mockResolvedValue(25);
      model.getUnreadCount.mockResolvedValue(5);

      const result = await getMyNotifications(1, 1, 10);

      expect(result.data).toEqual([{ id: 1, title: "Notif" }]);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.unreadCount).toBe(5);
    });

    it("defaults to page 1 and limit 20", async () => {
      model.getByUser.mockResolvedValue([]);
      model.getTotalCount.mockResolvedValue(0);
      model.getUnreadCount.mockResolvedValue(0);

      const result = await getMyNotifications(1);

      expect(model.getByUser).toHaveBeenCalledWith(1, 20, 0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });
  });

  describe("getUnreadCount", () => {
    it("reads from DB and updates Redis cache", async () => {
      model.getUnreadCount.mockResolvedValue(3);
      redisClient.set.mockResolvedValue("OK");

      const result = await getUnreadCount(1);

      expect(result).toBe(3);
      expect(redisClient.set).toHaveBeenCalledWith("unread:1", 3, "EX", 3600);
    });
  });

  describe("markAsRead", () => {
    it("marks notification as read and decrements Redis count", async () => {
      model.markAsRead.mockResolvedValue({ id: 1 });
      redisClient.get.mockResolvedValue("5");
      redisClient.set.mockResolvedValue("OK");
      getIO.mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() });

      const result = await markAsRead(1, 1);

      expect(result).toEqual({ id: 1 });
      expect(redisClient.set).toHaveBeenCalledWith("unread:1", 4, "EX", 3600);
    });

    it("falls back to DB when Redis key is missing (no cache update)", async () => {
      model.markAsRead.mockResolvedValue({ id: 1 });
      redisClient.get.mockResolvedValue(null);
      model.getUnreadCount.mockResolvedValue(2);
      getIO.mockReturnValue({ to: jest.fn().mockReturnThis(), emit: jest.fn() });

      const result = await markAsRead(1, 1);

      expect(result).toEqual({ id: 1 });
      expect(model.getUnreadCount).toHaveBeenCalledWith(1);
      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });
});
