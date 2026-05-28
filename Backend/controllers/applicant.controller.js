const applicantService = require("../services/applicant.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const { page, limit, search, status, job_position_id } = req.query;
    const result = await applicantService.getAll(page, limit, search, status, job_position_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const applicant = await applicantService.getById(req.params.id);
    res.json(applicant);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const applicant = await applicantService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { first_name: applicant.first_name, last_name: applicant.last_name, job_position_id: applicant.job_position_id, status: applicant.status },
      description: `Applicant created: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.status(201).json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("applicants", req.params.id);
    const applicant = await applicantService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: applicant.id,
      old_values: oldValues ? { status: oldValues.status, rating: oldValues.rating } : null,
      new_values: { status: applicant.status, rating: applicant.rating },
      description: `Applicant updated: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const applicant = await applicantService.updateStatus(req.params.id, req.body.status);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { status: applicant.status },
      description: `Applicant status updated to ${applicant.status}: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json(applicant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const applicant = await applicantService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "applicants",
      record_id: applicant.id,
      new_values: { first_name: applicant.first_name, last_name: applicant.last_name },
      description: `Applicant deleted: ${applicant.first_name} ${applicant.last_name}`,
    });
    res.json({ message: "Applicant deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const convertToEmployee = async (req, res) => {
  try {
    const employee = await applicantService.convertToEmployee(req.params.id, req.body);

    if (!employee.linked) {
      audit.auditLog(req, {
        action: "INSERT",
        table_name: "employees",
        record_id: employee.id,
        new_values: { employee_code: employee.employee_code, first_name: employee.first_name, last_name: employee.last_name, status: "ACTIVE" },
        description: `Employee created from applicant: ${employee.first_name} ${employee.last_name} (${employee.employee_code})`,
      });
    }

    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicants",
      record_id: req.params.id,
      new_values: { status: "Completed", employee_id: employee.id },
      description: `Applicant #${req.params.id} converted to employee #${employee.id}`,
    });

    res.status(201).json(employee);
  } catch (error) {
    const msg = error.message || "";
    if (msg.includes("foreign key constraint")) {
      return res.status(400).json({ message: "Unable to link applicant to employee. Please refresh and try again." });
    }
    if (msg.includes("already been converted")) {
      return res.status(400).json({ message: "This applicant has already been converted to an employee." });
    }
    res.status(400).json({ message: msg });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  convertToEmployee,
  updateStatus,
};
