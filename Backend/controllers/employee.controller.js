const employeeService = require("../services/employee.service");

// CREATE
const createEmployee = async (req, res) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  GET (Pagination + Search + Status Filter)
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const data = await employeeService.getEmployees(
      page,
      limit,
      search,
      status,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await employeeService.updateEmployee(id, req.body);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee,
};
