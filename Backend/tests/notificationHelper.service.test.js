jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../services/notification.service", () => ({
  notify: jest.fn().mockResolvedValue({ id: 1 }),
}));
jest.mock("../utils/logger", () => ({ warn: jest.fn() }));

const pool = require("../config/db");
const notificationService = require("../services/notification.service");
const logger = require("../utils/logger");
const {
  getUserByEmployeeId,
  notifyEmployee,
  getUsersWithPermission,
  getUsersWithAnyPermission,
  notifyUsersWithPermission,
  notifyUsersWithAnyPermission,
} = require("../services/notificationHelper.service");

describe("notificationHelper.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByEmployeeId", () => {
    it("returns user when found", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      const result = await getUserByEmployeeId(5);
      expect(result).toEqual({ id: 1 });
    });

    it("returns null when no user found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getUserByEmployeeId(999);
      expect(result).toBeNull();
    });

    it("returns null for falsy employeeId", async () => {
      const result = await getUserByEmployeeId(null);
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("notifyEmployee", () => {
    it("finds user and sends notification", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await notifyEmployee(5, { title: "Test", message: "Hello" });

      expect(notificationService.notify).toHaveBeenCalledWith({
        title: "Test",
        message: "Hello",
        user_id: 1,
      });
      expect(result).toEqual({ id: 1 });
    });

    it("returns null when employeeId is falsy", async () => {
      const result = await notifyEmployee(null, { title: "Test" });
      expect(result).toBeNull();
      expect(notificationService.notify).not.toHaveBeenCalled();
    });

    it("returns null and warns when no user found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await notifyEmployee(999, { title: "Test" });

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
      expect(notificationService.notify).not.toHaveBeenCalled();
    });
  });

  describe("getUsersWithPermission", () => {
    it("returns user IDs with given permission or ADMIN role", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await getUsersWithPermission("employee.read");

      expect(result).toEqual([1, 2]);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT DISTINCT u.id"),
        ["employee.read"],
      );
    });

    it("returns empty array when no users match", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getUsersWithPermission("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("getUsersWithAnyPermission", () => {
    it("returns user IDs with any of the given permissions", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await getUsersWithAnyPermission(["perm1", "perm2"]);

      expect(result).toEqual([1]);
    });

    it("returns empty array for empty permission keys", async () => {
      const result = await getUsersWithAnyPermission([]);
      expect(result).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("returns empty array for null permission keys", async () => {
      const result = await getUsersWithAnyPermission(null);
      expect(result).toEqual([]);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("notifyUsersWithPermission", () => {
    it("notifies all users with the given permission", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

      const result = await notifyUsersWithPermission("employee.read", {
        title: "Alert",
        message: "Test",
      });

      expect(notificationService.notify).toHaveBeenCalledTimes(2);
      expect(notificationService.notify).toHaveBeenCalledWith({ title: "Alert", message: "Test", user_id: 1 });
      expect(notificationService.notify).toHaveBeenCalledWith({ title: "Alert", message: "Test", user_id: 2 });
    });
  });

  describe("notifyUsersWithAnyPermission", () => {
    it("notifies all users with any of the given permissions", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await notifyUsersWithAnyPermission(["perm1"], {
        title: "Alert",
      });

      expect(notificationService.notify).toHaveBeenCalledWith({ title: "Alert", user_id: 1 });
    });
  });
});
