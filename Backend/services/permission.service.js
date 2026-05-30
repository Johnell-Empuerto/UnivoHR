const permissionModel = require("../models/permission.model");
const { ALL_PERMISSIONS } = require("../constants/permissions");

const getEffectivePermissions = async (user) => {
  if (user.role === "ADMIN") {
    return [...ALL_PERMISSIONS];
  }
  return await permissionModel.getUserPermissions(user.id);
};

const hasPermission = async (user, permissionKey) => {
  if (user.role === "ADMIN") {
    return true;
  }
  return await permissionModel.hasUserPermission(user.id, permissionKey);
};

module.exports = {
  getEffectivePermissions,
  hasPermission,
};
