const employeeService = require("../services/employee.service");
const audit = require("../services/audit.service");

// CREATE
const createEmployee = async (req, res) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employees",
      record_id: employee.id,
      employee_id: employee.id,
      branch_id: employee.branch_id,
      new_values: { employee_code: employee.employee_code, first_name: employee.first_name, last_name: employee.last_name, department: employee.department, position: employee.position, branch_id: employee.branch_id, status: employee.status },
      description: `Employee created: ${employee.first_name} ${employee.last_name} (${employee.employee_code})`,
    });
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
      req.allowedBranchIds,
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
    const oldValues = await audit.fetchOldValues("employees", id);
    const updated = await employeeService.updateEmployee(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employees",
      record_id: Number(id),
      employee_id: updated.id,
      branch_id: updated.branch_id,
      old_values: oldValues ? { employee_code: oldValues.employee_code, first_name: oldValues.first_name, last_name: oldValues.last_name, department: oldValues.department, position: oldValues.position, status: oldValues.status, branch_id: oldValues.branch_id } : null,
      new_values: { employee_code: updated.employee_code, first_name: updated.first_name, last_name: updated.last_name, department: updated.department, position: updated.position, status: updated.status, branch_id: updated.branch_id },
      description: `Employee updated: ${updated.first_name} ${updated.last_name} (${updated.employee_code})`,
    });
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
