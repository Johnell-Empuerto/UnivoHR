const userService = require("../services/user.service");

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
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
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
