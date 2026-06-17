const model = require("../models/hrForm.model");
const queueService = require("./queue.service");
const notificationService = require("./notification.service");
const { cleanPlainText } = require("../utils/inputSanitizer");

const BULK_THRESHOLD = 50;

const notifyAssignedEmployees = (form, createdEmployeeIds, assignedByUserId) => {
  if (createdEmployeeIds.length === 0) return;
  model.getUserIdsByEmployeeIds(createdEmployeeIds).then(userRows => {
    const promises = userRows
      .filter(row => row.id !== assignedByUserId)
      .map(row => notificationService.notify({
        user_id: row.id,
        type: "HR_FORM",
        title: "New Form Assigned",
        message: `You have been assigned a new form: ${form.title}`,
        reference_id: form.id,
        meta: { form_id: form.id, form_title: form.title },
      }));
    return Promise.all(promises);
  }).catch(err => console.error("[HR Form] Failed to send assignment notifications:", err));
};

const notifyHRFormSubmitted = (form, employeeName, submitterUserId) => {
  model.getActiveHRUserIds().then(userIds => {
    const promises = userIds
      .filter(id => id !== submitterUserId)
      .map(id => notificationService.notify({
        user_id: id,
        type: "HR_FORM",
        title: "Form Submitted",
        message: `${employeeName} submitted form: ${form.title}`,
        reference_id: form.id,
        meta: { form_id: form.id, form_title: form.title },
      }));
    return Promise.all(promises);
  }).catch(err => console.error("[HR Form] Failed to send submission notifications:", err));
};

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
  const inUse = await model.hasAssignments(id);
  if (inUse) throw new Error("Cannot delete form with existing assignments. Deactivate it instead.");
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
  const hasAnswers = await model.hasFieldAnswers(fieldId);
  if (hasAnswers) throw new Error("Cannot delete field with submitted answers.");
  await model.deleteField(fieldId);
};

const assignForm = async (data, userId) => {
  if (!data.form_id) throw new Error("Form is required");
  const form = await model.getFormById(data.form_id);
  if (!form) throw new Error("Form not found");

  if (data.assign_all_matching) {
    const result = await model.bulkAssignAllMatching({
      form_id: data.form_id,
      search: data.search || "",
      due_date: data.due_date || null,
      assigned_by: userId,
    });
    if (result.created_count > 0) {
      notifyAssignedEmployees(form, result.created_employee_ids, userId);
    }
    return result;
  }

  if (!data.employee_ids || data.employee_ids.length === 0) throw new Error("No employees selected");
  const { form_id, employee_ids, due_date } = data;
  if (employee_ids.length > BULK_THRESHOLD) {
    await queueService.addBulkAssignmentJob(form_id, employee_ids, userId, due_date || null);
    return { queued: true, employee_count: employee_ids.length, message: `Assignment queued for ${employee_ids.length} employees` };
  }
  const assignments = employee_ids.map((empId) => ({
    form_id,
    employee_id: empId,
    due_date: due_date || null,
  }));
  const result = await model.bulkCreateAssignments(assignments, userId);
  if (result.created_count > 0) {
    notifyAssignedEmployees(form, result.created_employee_ids, userId);
  }
  return result;
};

const getAllAssignments = async (search, page, limit) => {
  return await model.getAllAssignments(search, page, limit);
};

const getMyAssignments = async (employeeId, page = 1, limit = 10) => {
  return await model.getMyAssignments(employeeId, page, limit);
};

const getAssignmentById = async (assignmentId, userId, userRole, employeeId) => {
  const assignment = await model.getAssignmentById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");
  const isHr = userRole === "ADMIN";
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
    await model.upsertAnswer(
      assignmentId,
      ans.field_id,
      typeof ans.answer === "string" ? cleanPlainText(ans.answer) : ans.answer,
    );
  }

  const submission = await model.createSubmission({
    assignment_id: assignmentId,
    employee_id: employeeId,
    form_id: assignment.form_id,
  });

  await model.updateAssignmentStatus(assignmentId, "Submitted", new Date().toISOString());

  const form = await model.getFormById(assignment.form_id);
  const employeeName = submission.employee_name || `Employee #${employeeId}`;
  notifyHRFormSubmitted(form || assignment, employeeName, userId);

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
  const result = await model.updateSubmissionReview(
    submissionId,
    userId,
    data.remarks ? cleanPlainText(data.remarks) : data.remarks,
  );

  model.getUserIdsByEmployeeIds([submission.employee_id]).then(userRows => {
    if (userRows.length > 0 && userRows[0].id !== userId) {
      notificationService.notify({
        user_id: userRows[0].id,
        type: "HR_FORM",
        title: "Form Reviewed",
        message: `Your submission for ${submission.form_title || "form"} has been reviewed.${data.remarks ? ` Remarks: ${data.remarks}` : ""}`,
        reference_id: submission.form_id,
        meta: { form_id: submission.form_id, form_title: submission.form_title },
      }).catch(err => console.error("[HR Form] Failed to send review notification:", err));
    }
  }).catch(err => console.error("[HR Form] Failed to lookup user for review notification:", err));

  return result;
};

module.exports = {
  getAllForms, getFormById, createForm, updateForm, deleteForm,
  getFields, addField, editField, removeField,
  assignForm, getAllAssignments, getMyAssignments, getAssignmentById,
  submitForm, getSubmissions, getSubmissionById, reviewSubmission,
};
