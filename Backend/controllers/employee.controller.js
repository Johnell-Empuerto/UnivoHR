const employeeService = require("../services/employee.service");
const audit = require("../services/audit.service");

const createEmployee = async (req, res) => {
  try {
    const created = await employeeService.createEmployee(req.body);
    const employee = await employeeService.getEmployeeById(created.id);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employees",
      record_id: employee.id,
      employee_id: employee.id,
      branch_id: employee.branch_id,
      new_values: {
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        department: employee.department,
        position: employee.position,
        branch_id: employee.branch_id,
        status: employee.status,
        employment_status: employee.employment_status,
        probation_period_months: employee.probation_period_months,
        regularization_date: employee.regularization_date,
      },
      description: `Employee created: ${employee.first_name} ${employee.last_name} (${employee.employee_code}) - ${employee.employment_status}`,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "", department = "", position = "" } = req.query;

    const data = await employeeService.getEmployees(
      page,
      limit,
      search,
      status,
      req.allowedBranchIds,
      department,
      position,
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const options = await employeeService.getFilterOptions();
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const oldValues = await audit.fetchOldValues("employees", id);
    await employeeService.updateEmployee(id, req.body);
    const updated = await employeeService.getEmployeeById(id);

    const employmentChanged = oldValues && oldValues.employment_status !== updated.employment_status;

    audit.auditLog(req, {
      action: employmentChanged ? "EMPLOYMENT_STATUS_CHANGED" : "UPDATE",
      table_name: "employees",
      record_id: Number(id),
      employee_id: updated.id,
      branch_id: updated.branch_id,
      old_values: oldValues ? {
        employee_code: oldValues.employee_code,
        first_name: oldValues.first_name,
        last_name: oldValues.last_name,
        department: oldValues.department,
        position: oldValues.position,
        status: oldValues.status,
        branch_id: oldValues.branch_id,
        employment_status: oldValues.employment_status,
        probation_period_months: oldValues.probation_period_months,
        regularization_date: oldValues.regularization_date,
      } : null,
      new_values: {
        employee_code: updated.employee_code,
        first_name: updated.first_name,
        last_name: updated.last_name,
        department: updated.department,
        position: updated.position,
        status: updated.status,
        branch_id: updated.branch_id,
        employment_status: updated.employment_status,
        probation_period_months: updated.probation_period_months,
        regularization_date: updated.regularization_date,
      },
      description: employmentChanged
        ? `Employment status changed: ${updated.first_name} ${updated.last_name} - ${oldValues?.employment_status} → ${updated.employment_status}`
        : `Employee updated: ${updated.first_name} ${updated.last_name} (${updated.employee_code})`,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDueForRegularization = async (req, res) => {
  try {
    const employees = await employeeService.getProbationaryEmployeesDueForRegularization(req.allowedBranchIds);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const oldValues = await audit.fetchOldValues("employees", id);
    const employee = await employeeService.approveRegularization(id);

    audit.auditLog(req, {
      action: "REGULARIZATION_APPROVED",
      table_name: "employees",
      record_id: Number(id),
      employee_id: employee.id,
      branch_id: employee.branch_id,
      old_values: {
        employment_status: oldValues?.employment_status,
        probation_period_months: oldValues?.probation_period_months,
        regularization_date: oldValues?.regularization_date,
      },
      new_values: {
        employment_status: employee.employment_status,
        probation_period_months: employee.probation_period_months,
        regularization_date: employee.regularization_date,
      },
      description: `Regularization approved: ${employee.first_name} ${employee.last_name} (${employee.employee_code})`,
    });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEmploymentStats = async (req, res) => {
  try {
    const stats = await employeeService.getEmploymentStats(req.allowedBranchIds);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const deleted = await employeeService.deleteEmployee(id);

    audit.auditLog(req, {
      action: "DELETE",
      table_name: "employees",
      record_id: Number(id),
      employee_id: deleted.id,
      branch_id: deleted.branch_id,
      old_values: {
        employee_code: deleted.employee_code,
        first_name: deleted.first_name,
        last_name: deleted.last_name,
      },
      description: `Employee deleted: ${deleted.first_name} ${deleted.last_name} (${deleted.employee_code})`,
    });

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, employee_code, employee_name } = req.query;
    const result = await employeeService.searchEmployees({ page, limit, search, employee_code, employee_name });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getDueForRegularization,
  approveRegularization,
  getEmploymentStats,
  getFilterOptions,
  searchEmployees,
};
