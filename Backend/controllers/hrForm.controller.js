const service = require("../services/hrForm.service");
const audit = require("../services/audit.service");

const getAllForms = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await service.getAllForms(search, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFormById = async (req, res) => {
  try {
    const result = await service.getFormById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createForm = async (req, res) => {
  try {
    const result = await service.createForm(req.body, req.user?.id);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "hr_forms",
      record_id: result.id,
      new_values: { title: result.title, is_active: result.is_active },
      description: `HR form created: ${result.title}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateForm = async (req, res) => {
  try {
    const result = await service.updateForm(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "hr_forms",
      record_id: Number(req.params.id),
      new_values: { title: result.title, is_active: result.is_active },
      description: `HR form updated: ${result.title}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteForm = async (req, res) => {
  try {
    await service.deleteForm(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "hr_forms",
      record_id: Number(req.params.id),
      description: `HR form deleted (id: ${req.params.id})`,
    });
    res.json({ message: "Form deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getFields = async (req, res) => {
  try {
    const result = await service.getFields(req.params.formId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addField = async (req, res) => {
  try {
    const result = await service.addField(req.params.formId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const editField = async (req, res) => {
  try {
    const result = await service.editField(req.params.fieldId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const removeField = async (req, res) => {
  try {
    await service.removeField(req.params.fieldId);
    res.json({ message: "Field deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const assignForm = async (req, res) => {
  try {
    const result = await service.assignForm(req.body, req.user?.id);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "hr_form_assignments",
      record_id: result.id,
      new_values: { form_id: result.form_id, employee_id: result.employee_id, status: result.status, due_date: result.due_date },
      description: `HR form assigned: form ${result.form_id} to employee ${result.employee_id}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllAssignments = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await service.getAllAssignments(search, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getMyAssignments(employeeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const result = await service.getAssignmentById(
      req.params.assignmentId,
      req.user?.id,
      req.user?.role,
      req.user?.employee_id,
    );
    res.json(result);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

const submitForm = async (req, res) => {
  try {
    const result = await service.submitForm(
      req.params.assignmentId,
      req.user?.id,
      req.user?.employee_id,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const result = await service.getSubmissions(search, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubmissionById = async (req, res) => {
  try {
    const result = await service.getSubmissionById(req.params.submissionId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const result = await service.reviewSubmission(req.params.submissionId, req.user?.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "hr_form_submissions",
      record_id: Number(req.params.submissionId),
      new_values: { status: result.status, reviewed_by: req.user?.id },
      description: `HR form submission ${req.params.submissionId} reviewed as ${result.status}`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllForms, getFormById, createForm, updateForm, deleteForm,
  getFields, addField, editField, removeField,
  assignForm, getAllAssignments, getMyAssignments, getAssignmentById,
  submitForm, getSubmissions, getSubmissionById, reviewSubmission,
};
