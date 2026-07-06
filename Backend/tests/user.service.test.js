jest.mock("../models/user.model", () => ({
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getEmployeesWithoutAccounts: jest.fn(),
  getEmployeeName: jest.fn(),
  findUserByEmail: jest.fn(),
  usernameExists: jest.fn(),
  updatePassword: jest.fn(),
}));
jest.mock("../models/permission.model", () => ({
  setUserPermissions: jest.fn(),
}));
jest.mock("../services/userCache.service", () => ({
  normalizeUsername: jest.fn(),
  invalidateUserCache: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const userModel = require("../models/user.model");
const permissionModel = require("../models/permission.model");
const bcrypt = require("bcrypt");
const userCacheService = require("../services/userCache.service");
const {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  getEmployeesWithoutAccounts, getEmployeeName, getUserByEmail, resetPassword,
} = require("../services/user.service");

describe("user.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("returns paginated users from model", async () => {
      userModel.getUsers.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const result = await getUsers(1, 10, "", "ADMIN");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getUserById", () => {
    it("returns user from model", async () => {
      userModel.getUserById.mockResolvedValue({ id: 1, username: "admin" });
      const result = await getUserById(1);
      expect(result.username).toBe("admin");
    });
  });

  describe("createUser", () => {
    it("creates user with hashed password and assigns permissions for non-ADMIN", async () => {
      userCacheService.normalizeUsername.mockImplementation((u) => u.toLowerCase());
      userModel.usernameExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue("hashed_pass");
      userModel.createUser.mockResolvedValue({ id: 1, username: "jdoe", role: "USER" });

      const result = await createUser({ username: "JDOE", password: "secret", role: "USER", employee_id: 1 });

      expect(result.id).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith("secret", 10);
      expect(userModel.createUser).toHaveBeenCalledWith({
        username: "jdoe",
        password_hash: "hashed_pass",
        role: "USER",
        employee_id: 1,
      });
      expect(permissionModel.setUserPermissions).toHaveBeenCalled();
    });

    it("throws when username exists", async () => {
      userCacheService.normalizeUsername.mockReturnValue("existing");
      userModel.usernameExists.mockResolvedValue(true);

      await expect(createUser({ username: "existing", password: "secret", role: "USER" }))
        .rejects.toThrow("Username already exists");
    });
  });

  describe("updateUser", () => {
    it("updates user and invalidates cache on password change", async () => {
      userCacheService.normalizeUsername.mockImplementation((u) => u.toLowerCase());
      userModel.getUserById.mockResolvedValue({ id: 1, username: "jdoe" });
      userModel.usernameExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue("new_hashed");
      userModel.updateUser.mockResolvedValue({ id: 1, username: "jdoe" });

      const result = await updateUser(1, { username: "jdoe", password: "newpass", role: "USER" });

      expect(userCacheService.invalidateUserCache).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("deleteUser", () => {
    it("deletes user from model", async () => {
      userModel.deleteUser.mockResolvedValue({ id: 1 });
      const result = await deleteUser(1);
      expect(result.id).toBe(1);
    });
  });

  describe("getEmployeesWithoutAccounts", () => {
    it("returns employees from model", async () => {
      userModel.getEmployeesWithoutAccounts.mockResolvedValue([{ id: 1 }]);
      const result = await getEmployeesWithoutAccounts();
      expect(result).toHaveLength(1);
    });
  });

  describe("getEmployeeName", () => {
    it("returns employee name from model", async () => {
      userModel.getEmployeeName.mockResolvedValue({ first_name: "John" });
      const result = await getEmployeeName(1);
      expect(result.first_name).toBe("John");
    });
  });

  describe("getUserByEmail", () => {
    it("returns user by email from model", async () => {
      userModel.findUserByEmail.mockResolvedValue({ id: 1, email: "a@b.com" });
      const result = await getUserByEmail("a@b.com");
      expect(result.email).toBe("a@b.com");
    });
  });

  describe("resetPassword", () => {
    it("resets password and invalidates cache", async () => {
      userModel.getUserById.mockResolvedValue({ id: 1, username: "jdoe" });
      bcrypt.hash.mockResolvedValue("new_hashed");
      userModel.updatePassword.mockResolvedValue({ id: 1 });

      const result = await resetPassword(1, "newpass");
      expect(result.id).toBe(1);
      expect(userCacheService.invalidateUserCache).toHaveBeenCalledWith("jdoe");
    });
  });
});
