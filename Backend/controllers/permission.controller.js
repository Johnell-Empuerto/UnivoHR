const permissionModel = require("../models/permission.model");
const userModel = require("../models/user.model");
const { ALL_PERMISSIONS, PERMISSION_GROUPS, EMPLOYEE_DEFAULT_PERMISSIONS } = require("../constants/permissions");
const { ROLES } = require("../constants/roles");
const audit = require("../services/audit.service");

const getAllPermissions = async (req, res) => {
  try {
    res.json({
      allPermissions: ALL_PERMISSIONS,
      groups: PERMISSION_GROUPS,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Failed to fetch permissions" });
  }
};

const getUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = await permissionModel.getUserPermissions(id);
    res.json({ userId: Number(id), permissions });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({ message: "Failed to fetch user permissions" });
  }
};

const setUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "permissions must be an array" });
    }
    const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Invalid permission keys: ${invalid.join(", ")}` });
    }
    const oldPerms = await permissionModel.getUserPermissions(id);
    await permissionModel.setUserPermissions(id, permissions);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "user_permissions",
      record_id: Number(id),
      description: `Permissions updated for user ${id}: ${oldPerms.length} → ${permissions.length} permissions`,
    });
    res.json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error setting user permissions:", error);
    res.status(500).json({ message: "Failed to update permissions" });
  }
};

const resetUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === ROLES.ADMIN) {
      audit.auditLog(req, {
        action: "UPDATE",
        table_name: "user_permissions",
        record_id: Number(id),
        description: `Attempted to reset ADMIN permissions for user ${id} (username: ${user.username}) — blocked`,
      });
      return res.json({ message: "ADMIN permissions cannot be reset. ADMIN always has full access." });
    }
    if (user.role === ROLES.EMPLOYEE) {
      await permissionModel.setUserPermissions(id, EMPLOYEE_DEFAULT_PERMISSIONS);
      audit.auditLog(req, {
        action: "UPDATE",
        table_name: "user_permissions",
        record_id: Number(id),
        description: `Permissions reset to Employee Default for user ${id} (username: ${user.username})`,
      });
      return res.json({ message: "Permissions reset to Employee Default" });
    }
    await permissionModel.resetUserPermissions(id);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "user_permissions",
      record_id: Number(id),
      description: `Permissions cleared for user ${id} (username: ${user.username})`,
    });
    res.json({ message: "Permissions reset" });
  } catch (error) {
    console.error("Error resetting user permissions:", error);
    res.status(500).json({ message: "Failed to reset permissions" });
  }
};

module.exports = {
  getAllPermissions,
  getUserPermissions,
  setUserPermissions,
  resetUserPermissions,
};
