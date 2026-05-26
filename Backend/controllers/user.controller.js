const userService = require("../services/user.service");
const audit = require("../services/audit.service");

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;

    const data = await userService.getUsers(page, limit, search, role);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "users",
      record_id: user.id,
      employee_id: user.employee_id,
      new_values: { username: user.username, role: user.role, employee_id: user.employee_id },
      description: `User created: ${user.username}`,
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const oldValues = await audit.fetchOldValues("users", id);
    const user = await userService.updateUser(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "users",
      record_id: Number(id),
      employee_id: user?.employee_id,
      old_values: oldValues ? { username: oldValues.username, role: oldValues.role } : null,
      new_values: { username: user.username, role: user.role },
      description: `User updated: ${user.username}`,
    });
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const oldValues = await audit.fetchOldValues("users", id);
    await userService.deleteUser(id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "users",
      record_id: Number(id),
      old_values: oldValues ? { username: oldValues.username, role: oldValues.role, employee_id: oldValues.employee_id } : null,
      description: oldValues ? `User deleted: ${oldValues.username}` : `User deleted (id: ${id})`,
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeesWithoutAccounts = async (req, res) => {
  try {
    const employees = await userService.getEmployeesWithoutAccounts();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeName = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await userService.getEmployeeName(employeeId);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getEmployeesWithoutAccounts,
  getEmployeeName,
};
