jest.mock("../models/hrForm.model", () => ({
  getAllForms: jest.fn(), getFormById: jest.fn(), getFieldsByFormId: jest.fn(),
  createForm: jest.fn(), updateForm: jest.fn(), deleteForm: jest.fn(), hasAssignments: jest.fn(),
  createField: jest.fn(), updateField: jest.fn(), hasFieldAnswers: jest.fn(), deleteField: jest.fn(),
  bulkCreateAssignments: jest.fn(), bulkAssignAllMatching: jest.fn(),
  getAllAssignments: jest.fn(), getAssignmentById: jest.fn(), updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(), hasSubmission: jest.fn(),
  getMyAssignments: jest.fn(), getAnswersByAssignmentId: jest.fn(),
  getSubmissionByAssignmentId: jest.fn(), upsertAnswer: jest.fn(),
  createSubmission: jest.fn(), updateAssignmentStatus: jest.fn(),
  getSubmissions: jest.fn(), getSubmissionById: jest.fn(),
  updateSubmissionReview: jest.fn(),
  getUserIdsByEmployeeIds: jest.fn(), getActiveHRUserIds: jest.fn(),
}));
jest.mock("../services/queue.service", () => ({ addBulkAssignmentJob: jest.fn() }));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../utils/inputSanitizer", () => ({ cleanPlainText: jest.fn((t) => t) }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const model = require("../models/hrForm.model");
const queueService = require("../services/queue.service");
const {
  getAllForms, getFormById, createForm, updateForm, deleteForm,
  getFields, addField, editField, removeField,
  assignForm, getAllAssignments, getMyAssignments, getAssignmentById,
  editAssignment, removeAssignment,
  submitForm, getSubmissions, getSubmissionById, reviewSubmission,
} = require("../services/hrForm.service");

describe("hrForm.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllForms", () => {
    it("returns all forms from model", async () => {
      model.getAllForms.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const result = await getAllForms("", 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getFormById", () => {
    it("returns form with fields", async () => {
      model.getFormById.mockResolvedValue({ id: 1, title: "Test" });
      model.getFieldsByFormId.mockResolvedValue([{ id: 1, label: "Name" }]);
      const result = await getFormById(1);
      expect(result.title).toBe("Test");
      expect(result.fields).toHaveLength(1);
    });

    it("throws when form not found", async () => {
      model.getFormById.mockResolvedValue(null);
      await expect(getFormById(999)).rejects.toThrow("Form not found");
    });
  });

  describe("createForm", () => {
    it("creates form with userId", async () => {
      model.createForm.mockResolvedValue({ id: 1, title: "New Form" });
      const result = await createForm({ title: "New Form" }, 1);
      expect(result.title).toBe("New Form");
    });

    it("throws when title is empty", async () => {
      await expect(createForm({ title: "" }, 1)).rejects.toThrow("Form title is required");
    });
  });

  describe("updateForm", () => {
    it("updates existing form", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      model.updateForm.mockResolvedValue({ id: 1, title: "Updated" });
      const result = await updateForm(1, { title: "Updated" });
      expect(result.title).toBe("Updated");
    });

    it("throws when form not found", async () => {
      model.getFormById.mockResolvedValue(null);
      await expect(updateForm(999, { title: "X" })).rejects.toThrow("Form not found");
    });
  });

  describe("deleteForm", () => {
    it("deletes form with no assignments", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      model.hasAssignments.mockResolvedValue(false);
      model.deleteForm.mockResolvedValue();
      await expect(deleteForm(1)).resolves.toBeUndefined();
    });

    it("throws when form has assignments", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      model.hasAssignments.mockResolvedValue(true);
      await expect(deleteForm(1)).rejects.toThrow("Cannot delete form with existing assignments");
    });
  });

  describe("getFields", () => {
    it("returns fields for formId", async () => {
      model.getFieldsByFormId.mockResolvedValue([{ id: 1 }]);
      const result = await getFields(1);
      expect(result).toHaveLength(1);
    });
  });

  describe("addField", () => {
    it("adds field with valid type", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      model.createField.mockResolvedValue({ id: 1, label: "Name", field_type: "text" });
      const result = await addField(1, { label: "Name", field_type: "text" });
      expect(result.field_type).toBe("text");
    });

    it("throws with invalid field type", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      await expect(addField(1, { label: "Bad", field_type: "invalid" })).rejects.toThrow("Invalid field type");
    });
  });

  describe("editField", () => {
    it("updates field", async () => {
      model.updateField.mockResolvedValue({ id: 1, label: "Updated" });
      const result = await editField(1, { label: "Updated" });
      expect(result.label).toBe("Updated");
    });
  });

  describe("removeField", () => {
    it("removes field with no answers", async () => {
      model.hasFieldAnswers.mockResolvedValue(false);
      model.deleteField.mockResolvedValue();
      await expect(removeField(1)).resolves.toBeUndefined();
    });

    it("throws when field has answers", async () => {
      model.hasFieldAnswers.mockResolvedValue(true);
      await expect(removeField(1)).rejects.toThrow("Cannot delete field with submitted answers");
    });
  });

  describe("assignForm", () => {
    it("queues bulk assignment when employee count exceeds threshold", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      queueService.addBulkAssignmentJob.mockResolvedValue();
      const empIds = Array.from({ length: 51 }, (_, i) => i + 1);
      const result = await assignForm({ form_id: 1, employee_ids: empIds }, 1);
      expect(result.queued).toBe(true);
      expect(queueService.addBulkAssignmentJob).toHaveBeenCalled();
    });

    it("creates assignments directly for small employee list", async () => {
      model.getFormById.mockResolvedValue({ id: 1 });
      model.bulkCreateAssignments.mockResolvedValue({ created_count: 1, created_employee_ids: [5] });
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      const result = await assignForm({ form_id: 1, employee_ids: [5] }, 1);
      expect(result.created_count).toBe(1);
    });
  });

  describe("getAllAssignments", () => {
    it("returns assignments from model", async () => {
      model.getAllAssignments.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await getAllAssignments("", 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getMyAssignments", () => {
    it("returns my assignments from model", async () => {
      model.getMyAssignments.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await getMyAssignments(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getAssignmentById", () => {
    it("returns assignment for ADMIN", async () => {
      model.getAssignmentById.mockResolvedValue({ id: 1, form_id: 1, employee_id: 5 });
      model.getFieldsByFormId.mockResolvedValue([]);
      model.getAnswersByAssignmentId.mockResolvedValue([]);
      model.getSubmissionByAssignmentId.mockResolvedValue(null);
      const result = await getAssignmentById(1, 1, "ADMIN", 5);
      expect(result.id).toBe(1);
    });

    it("throws for non-ADMIN not assigned", async () => {
      model.getAssignmentById.mockResolvedValue({ id: 1, form_id: 1, employee_id: 5 });
      await expect(getAssignmentById(1, 1, "USER", 999)).rejects.toThrow("You are not assigned to this form");
    });
  });

  describe("editAssignment", () => {
    it("edits pending assignment", async () => {
      model.getAssignmentById.mockResolvedValue({ id: 1, status: "Pending" });
      model.updateAssignment.mockResolvedValue({ id: 1 });
      await expect(editAssignment(1, {})).resolves.toBeDefined();
    });
  });

  describe("removeAssignment", () => {
    it("removes pending assignment", async () => {
      model.getAssignmentById.mockResolvedValue({ id: 1, status: "Pending" });
      model.hasSubmission.mockResolvedValue(false);
      await expect(removeAssignment(1)).resolves.toBeUndefined();
    });
  });

  describe("submitForm", () => {
    it("submits form successfully", async () => {
      model.getAssignmentById.mockResolvedValue({ id: 1, form_id: 1, employee_id: 5, status: "Pending" });
      model.createSubmission.mockResolvedValue({ id: 1, employee_name: "John" });
      model.updateAssignmentStatus.mockResolvedValue();
      model.getFormById.mockResolvedValue({ id: 1, title: "Test" });
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      model.getActiveHRUserIds.mockResolvedValue([]);

      const result = await submitForm(1, 1, 5, { answers: [] });
      expect(result.id).toBe(1);
    });
  });

  describe("getSubmissions", () => {
    it("returns submissions from model", async () => {
      model.getSubmissions.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await getSubmissions("", 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getSubmissionById", () => {
    it("returns submission with fields and answers", async () => {
      model.getSubmissionById.mockResolvedValue({ id: 1, form_id: 1, assignment_id: 1, employee_name: "John" });
      model.getAssignmentById.mockResolvedValue({ id: 1 });
      model.getFieldsByFormId.mockResolvedValue([]);
      model.getAnswersByAssignmentId.mockResolvedValue([]);

      const result = await getSubmissionById(1);
      expect(result.id).toBe(1);
      expect(result).toHaveProperty("fields");
      expect(result).toHaveProperty("answers");
    });
  });

  describe("reviewSubmission", () => {
    it("reviews submission successfully", async () => {
      model.getSubmissionById.mockResolvedValue({ id: 1, employee_id: 5, form_title: "Test" });
      model.updateSubmissionReview.mockResolvedValue({ id: 1 });
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);

      const result = await reviewSubmission(1, 1, { remarks: "Good" });
      expect(result.id).toBe(1);
    });
  });
});
