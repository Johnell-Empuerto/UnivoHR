jest.mock("../config/db", () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
  };
});
jest.mock("../models/applicant.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  getActiveHRUserIds: jest.fn(),
  getRelatedCounts: jest.fn(),
}));
jest.mock("../models/applicantInterview.model", () => ({
  getByApplicantId: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/applicantApproval.model", () => ({
  getByApplicantId: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/branch.model", () => ({
  getByCode: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({}));
jest.mock("../models/leaveCredit.model", () => ({}));
jest.mock("../services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../services/employeeInit.service", () => ({ initializeNewEmployee: jest.fn() }));
jest.mock("../services/applicantWorkflow.service", () => ({
  resolveWorkflowForCreation: jest.fn(),
  resolveDefaultWorkflow: jest.fn(),
  getStagesForWorkflow: jest.fn(),
  autoInitializeWorkflow: jest.fn(),
}));
jest.mock("../utils/inputSanitizer", () => ({ cleanPlainText: jest.fn((t) => t) }));
jest.mock("../utils/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const pool = require("../config/db");
const applicantModel = require("../models/applicant.model");
const applicantInterviewModel = require("../models/applicantInterview.model");
const applicantApprovalModel = require("../models/applicantApproval.model");
const branchModel = require("../models/branch.model");
const employeeInitService = require("../services/employeeInit.service");
const applicantWorkflowService = require("../services/applicantWorkflow.service");
const {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  remove,
  convertToEmployee,
  generateEmployeeCode,
  getEmployeeCodeSettings,
  autoCreateStageRecords,
  repairApplicantStageRecords,
  hasApprovedHiringApproval,
  evaluateCanConvertToEmployee,
} = require("../services/applicant.service");

describe("applicant.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns paginated applicants", async () => {
      applicantModel.getAll.mockResolvedValue({ data: [{ id: 1 }], pagination: { total: 1 } });
      const result = await getAll(1, 10, "", "", "");
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("returns applicant when found", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, workflow_instance_id: null, status: "Initial" });
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getById(1);
      expect(result.id).toBe(1);
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("create", () => {
    it("creates applicant with job_position_id and workflow", async () => {
      applicantWorkflowService.resolveWorkflowForCreation.mockResolvedValue({
        workflow: { id: 1, name: "Default" },
        stages: [{ id: 1, sequence_order: 1 }],
      });
      applicantModel.create.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      applicantWorkflowService.autoInitializeWorkflow.mockResolvedValue();
      const result = await create({ first_name: "John", last_name: "Doe", job_position_id: 1 });
      expect(result.id).toBe(1);
    });

    it("creates applicant with default workflow when no job_position workflow", async () => {
      applicantWorkflowService.resolveWorkflowForCreation.mockResolvedValue(null);
      applicantWorkflowService.resolveDefaultWorkflow.mockResolvedValue({ id: 2, name: "Default" });
      applicantWorkflowService.getStagesForWorkflow.mockResolvedValue([{ id: 1 }]);
      applicantModel.create.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe" });
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      applicantWorkflowService.autoInitializeWorkflow.mockResolvedValue();
      const result = await create({ first_name: "John", last_name: "Doe", job_position_id: 1 });
      expect(result.id).toBe(1);
    });

    it("throws when first_name missing", async () => {
      await expect(create({ last_name: "Doe" })).rejects.toThrow("First name is required");
    });

    it("throws when last_name missing", async () => {
      await expect(create({ first_name: "John" })).rejects.toThrow("Last name is required");
    });

    it("throws when no workflow resolved", async () => {
      applicantWorkflowService.resolveWorkflowForCreation.mockResolvedValue(null);
      applicantWorkflowService.resolveDefaultWorkflow.mockResolvedValue(null);
      await expect(create({ first_name: "John", last_name: "Doe", job_position_id: 1 })).rejects.toThrow(
        "No recruitment workflow assigned to this job position"
      );
    });
  });

  describe("update", () => {
    it("updates existing applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, status: "Initial" });
      applicantModel.update.mockResolvedValue({ id: 1, first_name: "John Updated" });
      const result = await update(1, { first_name: "John Updated" });
      expect(result.first_name).toBe("John Updated");
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Applicant not found");
    });

    it("throws when setting Completed without approved approval", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, status: "Pending" });
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      await expect(update(1, { status: "Completed" })).rejects.toThrow(
        "Applicant requires an approved hiring approval before marking as Completed"
      );
    });
  });

  describe("updateStatus", () => {
    it("updates status to different value", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, first_name: "John", last_name: "Doe", status: "Initial" });
      applicantModel.updateStatus.mockResolvedValue({ id: 1, status: "Pending" });
      applicantModel.getActiveHRUserIds.mockResolvedValue([]);
      const result = await updateStatus(1, "Pending");
      expect(result.status).toBe("Pending");
    });

    it("returns existing when status is same", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, status: "Initial" });
      const result = await updateStatus(1, "Initial");
      expect(result).toEqual({ id: 1, status: "Initial" });
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(updateStatus(999, "Completed")).rejects.toThrow("Applicant not found");
    });

    it("throws when setting Completed without approved approval", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, status: "Pending" });
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      await expect(updateStatus(1, "Completed")).rejects.toThrow(
        "Applicant requires an approved hiring approval before marking as Completed"
      );
    });
  });

  describe("remove", () => {
    it("removes applicant with no constraints", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, workflow_instance_id: null });
      applicantModel.getRelatedCounts.mockResolvedValue({ interviews: 0, approvals: 0, family: 0, education: 0, experience: 0 });
      applicantModel.remove.mockResolvedValue({ id: 1 });
      await expect(remove(1)).resolves.toBeDefined();
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Applicant not found");
    });

    it("throws when applicant has employee_id", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: 5, workflow_instance_id: null });
      await expect(remove(1)).rejects.toThrow("Cannot delete applicant that has already been converted");
    });

    it("throws when applicant has workflow_instance_id", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, workflow_instance_id: 10 });
      await expect(remove(1)).rejects.toThrow("Cannot delete applicant with active or completed workflow history");
    });

    it("throws when applicant has related records", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, workflow_instance_id: null });
      applicantModel.getRelatedCounts.mockResolvedValue({ interviews: 1, approvals: 0, family: 0, education: 0, experience: 0 });
      await expect(remove(1)).rejects.toThrow("Cannot delete applicant with existing interview");
    });
  });

  describe("getEmployeeCodeSettings", () => {
    it("returns settings from db", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await getEmployeeCodeSettings(pool);
      expect(result.prefix).toBe("EMP");
      expect(result.autoGenerate).toBe("true");
    });

    it("parses settings from db rows", async () => {
      pool.query.mockResolvedValue({
        rows: [
          { key: "employee_code_prefix", value: "CUST" },
          { key: "employee_code_padding", value: "5" },
        ],
      });
      const result = await getEmployeeCodeSettings(pool);
      expect(result.prefix).toBe("CUST");
      expect(result.padding).toBe("5");
    });
  });

  describe("generateEmployeeCode", () => {
    it("generates employee code with defaults", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await generateEmployeeCode();
      expect(result.code).toMatch(/^EMP\d+$/);
    });

    it("throws when auto-generation is disabled", async () => {
      pool.query.mockResolvedValue({
        rows: [{ key: "employee_code_auto_generate", value: "false" }],
      });
      await expect(generateEmployeeCode()).rejects.toThrow("Auto-generation is disabled");
    });
  });

  describe("hasApprovedHiringApproval", () => {
    it("returns true when an APPROVED approval exists", async () => {
      applicantApprovalModel.getByApplicantId.mockResolvedValue([{ decision: "APPROVED" }]);
      const result = await hasApprovedHiringApproval(1);
      expect(result).toBe(true);
    });

    it("returns false when no APPROVED approval exists", async () => {
      applicantApprovalModel.getByApplicantId.mockResolvedValue([{ decision: "PENDING" }]);
      const result = await hasApprovedHiringApproval(1);
      expect(result).toBe(false);
    });

    it("returns false when no approvals", async () => {
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      const result = await hasApprovedHiringApproval(1);
      expect(result).toBe(false);
    });
  });

  describe("evaluateCanConvertToEmployee", () => {
    it("returns false when applicant is null or has employee_id", async () => {
      expect(await evaluateCanConvertToEmployee(null)).toBe(false);
      expect(await evaluateCanConvertToEmployee({ employee_id: 5 })).toBe(false);
    });

    it("returns false when no workflow_instance_id", async () => {
      expect(await evaluateCanConvertToEmployee({ id: 1, employee_id: null, workflow_instance_id: null })).toBe(false);
    });

    it("returns false when workflow instance not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await evaluateCanConvertToEmployee({ id: 1, employee_id: null, workflow_instance_id: 10 });
      expect(result).toBe(false);
    });

    it("returns false when workflow instance not COMPLETED", async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, status: "IN_PROGRESS" }] })
        .mockResolvedValueOnce({ rows: [{ stage_type: "CONVERT_TO_EMPLOYEE" }] })
        .mockResolvedValueOnce({ rows: [{ status: "COMPLETED", recommendation: "PASSED" }] });
      pool.query.mockImplementation(mockQuery);
      const result = await evaluateCanConvertToEmployee({ id: 1, employee_id: null, workflow_instance_id: 10 });
      expect(result).toBe(false);
    });

    it("returns true when workflow fully completed with CONVERT_TO_EMPLOYEE stage", async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, status: "COMPLETED", workflow_id: 5 }] })
        .mockResolvedValueOnce({ rows: [{ stage_type: "CONVERT_TO_EMPLOYEE", id: 10 }] })
        .mockResolvedValueOnce({ rows: [{ status: "COMPLETED", recommendation: "PASSED" }] });
      pool.query.mockImplementation(mockQuery);
      const result = await evaluateCanConvertToEmployee({ id: 1, employee_id: null, workflow_instance_id: 10 });
      expect(result).toBe(true);
    });
  });

  describe("autoCreateStageRecords", () => {
    it("creates interviews based on status index", async () => {
      applicantInterviewModel.getByApplicantId.mockResolvedValue([]);
      applicantInterviewModel.create.mockResolvedValue({});
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      applicantApprovalModel.create.mockResolvedValue({});
      await autoCreateStageRecords(1, "Completed");
      expect(applicantInterviewModel.create).toHaveBeenCalledTimes(3);
      expect(applicantApprovalModel.create).toHaveBeenCalled();
    });

    it("does not create existing interviews", async () => {
      applicantInterviewModel.getByApplicantId.mockResolvedValue([
        { interview_type: "Initial Interview" },
        { interview_type: "Exam Interview" },
        { interview_type: "Final Interview" },
      ]);
      applicantInterviewModel.create.mockResolvedValue({});
      await autoCreateStageRecords(1, "Completed");
      expect(applicantInterviewModel.create).not.toHaveBeenCalled();
    });

    it("does not create approval when one already exists", async () => {
      applicantInterviewModel.getByApplicantId.mockResolvedValue([]);
      applicantApprovalModel.getByApplicantId.mockResolvedValue([{ id: 1 }]);
      applicantApprovalModel.create.mockResolvedValue({});
      await autoCreateStageRecords(1, "Completed");
      expect(applicantApprovalModel.create).not.toHaveBeenCalled();
    });
  });

  describe("repairApplicantStageRecords", () => {
    it("repairs records for hired applicant", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, status: "Completed", employee_id: 5 });
      applicantInterviewModel.getByApplicantId.mockResolvedValue([]);
      applicantInterviewModel.create.mockResolvedValue({});
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      applicantApprovalModel.create.mockResolvedValue({});
      const result = await repairApplicantStageRecords(1);
      expect(result.is_hired).toBe(true);
      expect(result.stage_index).toBe(5);
    });

    it("repairs records for non-hired applicant with no matching stage", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null });
      const result = await repairApplicantStageRecords(1);
      expect(result.is_hired).toBe(false);
      expect(result.stage_index).toBe(0);
    });

    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(repairApplicantStageRecords(999)).rejects.toThrow("Applicant not found");
    });
  });

  describe("convertToEmployee", () => {
    it("throws when applicant not found", async () => {
      applicantModel.getById.mockResolvedValue(null);
      await expect(convertToEmployee(999, {})).rejects.toThrow("Applicant not found");
    });

    it("throws when applicant already has employee_id", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: 5 });
      await expect(convertToEmployee(1, {})).rejects.toThrow("already been converted");
    });

    it("throws when status not Completed and no workflow approval path", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, status: "Pending", workflow_instance_id: null });
      await expect(convertToEmployee(1, {})).rejects.toThrow("Applicant status must be Completed");
    });

    it("throws when no approved hiring approval for Completed status", async () => {
      applicantModel.getById.mockResolvedValue({ id: 1, employee_id: null, status: "Completed", workflow_instance_id: null });
      applicantApprovalModel.getByApplicantId.mockResolvedValue([]);
      await expect(convertToEmployee(1, {})).rejects.toThrow("Applicant requires an approved hiring approval");
    });
  });
});
