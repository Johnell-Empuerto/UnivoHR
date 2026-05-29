const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const userCacheService = require("./userCache.service");

const getUsers = async (page, limit, search, role) => {
  return await userModel.getUsers(page, limit, search, role);
};

const getUserById = async (id) => {
  return await userModel.getUserById(id);
};

const createUser = async (data) => {
  const normalizedUsername = userCacheService.normalizeUsername(data.username);

  // Check if username already exists
  const exists = await userModel.usernameExists(normalizedUsername);
  if (exists) {
    throw new Error("Username already exists");
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  const userData = {
    username: normalizedUsername,
    password_hash: hashedPassword,
    role: data.role,
    employee_id: data.employee_id,
  };

  return await userModel.createUser(userData);
};

const updateUser = async (id, data) => {
  const existing = await userModel.getUserById(id);
  const normalizedUsername = userCacheService.normalizeUsername(data.username);

  // Check if username already exists (excluding current user)
  const exists = await userModel.usernameExists(normalizedUsername, id);
  if (exists) {
    throw new Error("Username already exists");
  }

  const updateData = {
    username: normalizedUsername,
    role: data.role,
  };

  const passwordChanging =
    data.password && data.password.trim() !== "";

  // Only hash and update password if provided
  if (passwordChanging) {
    const saltRounds = 10;
    updateData.password_hash = await bcrypt.hash(data.password, saltRounds);
  }

  const result = await userModel.updateUser(id, updateData);

  if (existing?.username) {
    const usernameChanging =
      normalizedUsername &&
      normalizedUsername !==
        userCacheService.normalizeUsername(existing.username);

    if (passwordChanging || usernameChanging) {
      await userCacheService.invalidateUserCache(existing.username);
    }
    if (usernameChanging && normalizedUsername) {
      await userCacheService.invalidateUserCache(normalizedUsername);
    }
  }

  return result;
};

const deleteUser = async (id) => {
  return await userModel.deleteUser(id);
};

const getEmployeesWithoutAccounts = async () => {
  return await userModel.getEmployeesWithoutAccounts();
};

const getEmployeeName = async (employeeId) => {
  return await userModel.getEmployeeName(employeeId);
};

const getUserByEmail = async (email) => {
  return await userModel.findUserByEmail(email);
};

const resetPassword = async (userId, newPassword) => {
  const existing = await userModel.getUserById(userId);
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  const result = await userModel.updatePassword(userId, hashedPassword);

  if (existing?.username) {
    await userCacheService.invalidateUserCache(existing.username);
  }

  return result;
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getEmployeesWithoutAccounts,
  getEmployeeName,
  getUserByEmail,
  resetPassword,
};
