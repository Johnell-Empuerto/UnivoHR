jest.mock("../models/permission.model", () => ({
  getUserPermissions: jest.fn(),
  hasUserPermission: jest.fn(),
}));

jest.mock("../constants/permissions", () => ({
  ALL_PERMISSIONS: ["employee.read", "employee.write", "payroll.read"],
}));

const permissionModel = require("../models/permission.model");
const { getEffectivePermissions, hasPermission } = require("../services/permission.service");

describe("permission.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEffectivePermissions", () => {
    it("returns all permissions for ADMIN", async () => {
      const user = { id: 1, role: "ADMIN" };
      const permissions = await getEffectivePermissions(user);
      expect(permissions).toEqual(["employee.read", "employee.write", "payroll.read"]);
    });

    it("delegates to model for non-ADMIN", async () => {
      const user = { id: 2, role: "USER" };
      permissionModel.getUserPermissions.mockResolvedValue(["employee.read"]);

      const permissions = await getEffectivePermissions(user);
      expect(permissions).toEqual(["employee.read"]);
      expect(permissionModel.getUserPermissions).toHaveBeenCalledWith(2);
    });
  });

  describe("hasPermission", () => {
    it("returns true for ADMIN", async () => {
      const user = { id: 1, role: "ADMIN" };
      const result = await hasPermission(user, "any.permission");
      expect(result).toBe(true);
    });

    it("delegates to model for non-ADMIN", async () => {
      const user = { id: 2, role: "USER" };
      permissionModel.hasUserPermission.mockResolvedValue(false);

      const result = await hasPermission(user, "employee.write");
      expect(result).toBe(false);
      expect(permissionModel.hasUserPermission).toHaveBeenCalledWith(2, "employee.write");
    });
  });
});
