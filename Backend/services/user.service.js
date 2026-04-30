const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

const getUsers = async (page, limit, search, role) => {
  return await userModel.getUsers(page, limit, search, role);
};

const getUserById = async (id) => {
  return await userModel.getUserById(id);
};

const createUser = async (data) => {
  // Check if username already exists
  const exists = await userModel.usernameExists(data.username);
  if (exists) {
    throw new Error("Username already exists");
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  const userData = {
    username: data.username,
    password_hash: hashedPassword,
    role: data.role,
    employee_id: data.employee_id,
  };

  return await userModel.createUser(userData);
};

const updateUser = async (id, data) => {
  // Check if username already exists (excluding current user)
  const exists = await userModel.usernameExists(data.username, id);
  if (exists) {
    throw new Error("Username already exists");
  }

  const updateData = {
    username: data.username,
    role: data.role,
  };

  // Only hash and update password if provided
  if (data.password && data.password.trim() !== "") {
    const saltRounds = 10;
    updateData.password_hash = await bcrypt.hash(data.password, saltRounds);
  }

  return await userModel.updateUser(id, updateData);
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
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  return await userModel.updatePassword(userId, hashedPassword);
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
