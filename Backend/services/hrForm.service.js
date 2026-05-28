const model = require("../models/hrForm.model");

const getAllForms = async (search, page, limit) => {
  return await model.getAllForms(search, page, limit);
};

const getFormById = async (id) => {
  const form = await model.getFormById(id);
  if (!form) throw new Error("Form not found");
  const fields = await model.getFieldsByFormId(id);
  return { ...form, fields };
};

const createForm = async (data, userId) => {
  if (!data.title || !data.title.trim()) throw new Error("Form title is required");
  return await model.createForm({ ...data, created_by: userId });
};

const updateForm = async (id, data) => {
  const existing = await model.getFormById(id);
  if (!existing) throw new Error("Form not found");
  return await model.updateForm(id, data);
};

const deleteForm = async (id) => {
  const existing = await model.getFormById(id);
  if (!existing) throw new Error("Form not found");
  await model.deleteForm(id);
};

const getFields = async (formId) => {
  return await model.getFieldsByFormId(formId);
};

const addField = async (formId, data) => {
  const existing = await model.getFormById(formId);
  if (!existing) throw new Error("Form not found");
  if (!data.label || !data.label.trim()) throw new Error("Field label is required");
  const validTypes = ["text", "textarea", "number", "date", "dropdown", "radio", "checkbox", "rating"];
  if (!validTypes.includes(data.field_type)) throw new Error("Invalid field type");
  return await model.createField({ ...data, form_id: formId });
};

const editField = async (fieldId, data) => {
  if (!data.label || !data.label.trim()) throw new Error("Field label is required");
  return await model.updateField(fieldId, data);
};

const removeField = async (fieldId) => {
  await model.deleteField(fieldId);
};

const assignForm = async (data, userId) => {
  if (!data.form_id) throw new Error("Form is required");
  if (!data.employee_ids || data.employee_ids.length === 0) throw new Error("No employees selected");
  const form = await model.getFormById(data.form_id);
  if (!form) throw new Error("Form not found");
  const assignments = data.employee_ids.map((empId) => ({
    form_id: data.form_id,
    employee_id: empId,
    due_date: data.due_date || null,
  }));
  return await model.bulkCreateAssignments(assignments, userId);
};

const getAllAssignments = async (search, page, limit) => {
  return await model.getAllAssignments(search, page, limit);
};

const getMyAssignments = async (employeeId) => {
  return await model.getMyAssignments(employeeId);
};

const getAssignmentById = async (assignmentId, userId, userRole, employeeId) => {
  const assignment = await model.getAssignmentById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  const isHr = userRole === "ADMIN" || userRole === "HR_ADMIN";
  if (!isHr && Number(assignment.employee_id) !== Number(employeeId)) {
    throw new Error("You are not assigned to this form");
  }
  const fields = await model.getFieldsByFormId(assignment.form_id);
  const answers = await model.getAnswersByAssignmentId(assignmentId);
  const submission = await model.getSubmissionByAssignmentId(assignmentId);
  return { ...assignment, fields, answers, submission };
};

const submitForm = async (assignmentId, userId, employeeId, data) => {
  const assignment = await model.getAssignmentById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  if (Number(assignment.employee_id) !== Number(employeeId)) throw new Error("You are not assigned to this form");
  if (assignment.status !== "Pending") throw new Error("Form already submitted or reviewed");

  for (const ans of data.answers || []) {
    await model.upsertAnswer(assignmentId, ans.field_id, ans.answer);
  }

  const submission = await model.createSubmission({
    assignment_id: assignmentId,
    employee_id: employeeId,
    form_id: assignment.form_id,
  });

  await model.updateAssignmentStatus(assignmentId, "Submitted", new Date().toISOString());
  return submission;
};

const getSubmissions = async (search, page, limit) => {
  return await model.getSubmissions(search, page, limit);
};

const getSubmissionById = async (submissionId) => {
  const submission = await model.getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  const assignment = await model.getAssignmentById(submission.assignment_id);
  const fields = await model.getFieldsByFormId(submission.form_id);
  const answers = await model.getAnswersByAssignmentId(submission.assignment_id);
  return { ...submission, fields, answers, employee_name: submission.employee_name };
};

const reviewSubmission = async (submissionId, userId, data) => {
  const submission = await model.getSubmissionById(submissionId);
  if (!submission) throw new Error("Submission not found");
  return await model.updateSubmissionReview(submissionId, userId, data.remarks);
};

module.exports = {
  getAllForms, getFormById, createForm, updateForm, deleteForm,
  getFields, addField, editField, removeField,
  assignForm, getAllAssignments, getMyAssignments, getAssignmentById,
  submitForm, getSubmissions, getSubmissionById, reviewSubmission,
};
