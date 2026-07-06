jest.mock("../models/kpiEvaluation.model", () => ({
  checkExistingEvaluation: jest.fn(),
  createEvaluation: jest.fn(),
  getEvaluationById: jest.fn(),
  getEvaluationsByEmployee: jest.fn(),
  getEvaluationsByEvaluator: jest.fn(),
  getEvaluationsForHr: jest.fn(),
  getScoresByEvaluationId: jest.fn(),
  updateEvaluation: jest.fn(),
  upsertScore: jest.fn(),
  getActiveHRUserIds: jest.fn(),
  getUserIdByEmployeeIds: jest.fn(),
  getHistoryForHr: jest.fn(),
  getPendingCountByEvaluator: jest.fn(),
  bulkCreateEvaluations: jest.fn(),
  getUserIdsByEmployeeIds: jest.fn(),
}));
jest.mock("../models/kpiTemplate.model", () => ({
  getItemsByTemplateId: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({
  regularizeEmployee: jest.fn(),
  updateEmployeeStatusToTerminated: jest.fn(),
}));
jest.mock("../utils/logger", () => ({ error: jest.fn() }));

const model = require("../models/kpiEvaluation.model");
const templateModel = require("../models/kpiTemplate.model");
const employeeModel = require("../models/employee.model");
const {
  assign, getById, getMyEvaluations, getMyAssignments, getHrView,
  saveScores, submit, saveSelfEvaluation, hrApprove, hrReject,
  getHistory, getPendingCount,
} = require("../services/kpiEvaluation.service");

describe("kpiEvaluation.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("assign", () => {
    it("throws when employee missing", async () => {
      await expect(assign({})).rejects.toThrow("Employee is required");
    });
    it("throws when evaluator missing", async () => {
      await expect(assign({ employee_id: 1 })).rejects.toThrow("Evaluator is required");
    });
    it("throws when template missing", async () => {
      await expect(assign({ employee_id: 1, evaluator_id: 2 })).rejects.toThrow("Template is required");
    });
    it("throws when employee equals evaluator", async () => {
      await expect(assign({ employee_id: 1, evaluator_id: 1, template_id: 1 })).rejects.toThrow("cannot be the same");
    });
    it("throws when duplicate exists", async () => {
      model.checkExistingEvaluation.mockResolvedValue({ id: 1 });
      await expect(assign({ employee_id: 1, evaluator_id: 2, template_id: 1, evaluation_period_start: "2026-01-01", evaluation_period_end: "2026-03-31" }))
        .rejects.toThrow("already exists");
    });
    it("creates evaluation", async () => {
      model.checkExistingEvaluation.mockResolvedValue(null);
      model.createEvaluation.mockResolvedValue({ id: 1 });
      model.getUserIdsByEmployeeIds.mockResolvedValue([{ id: 1, employee_id: 1 }, { id: 2, employee_id: 2 }]);
      const result = await assign({ employee_id: 1, evaluator_id: 2, template_id: 1 });
      expect(result.id).toBe(1);
    });
  });

  describe("getById", () => {
    it("returns evaluation with scores and items", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, template_id: 1 });
      model.getScoresByEvaluationId.mockResolvedValue([{ id: 1, score: 4 }]);
      templateModel.getItemsByTemplateId.mockResolvedValue([{ id: 1 }]);
      const result = await getById(1);
      expect(result.scores).toHaveLength(1);
      expect(result.items).toHaveLength(1);
    });
    it("throws when not found", async () => {
      model.getEvaluationById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Evaluation not found");
    });
  });

  describe("getMyEvaluations", () => {
    it("returns employee evaluations", async () => {
      model.getEvaluationsByEmployee.mockResolvedValue([{ id: 1 }]);
      expect(await getMyEvaluations(1, "Draft", 1, 10)).toHaveLength(1);
    });
  });

  describe("getMyAssignments", () => {
    it("returns evaluator assignments", async () => {
      model.getEvaluationsByEvaluator.mockResolvedValue([{ id: 1 }]);
      expect(await getMyAssignments(1, null, 1, 10)).toHaveLength(1);
    });
  });

  describe("getHrView", () => {
    it("returns HR view", async () => {
      model.getEvaluationsForHr.mockResolvedValue([{ id: 1 }]);
      expect(await getHrView("", "", 1, 10)).toHaveLength(1);
    });
  });

  describe("saveScores", () => {
    it("throws when evaluation not found", async () => {
      model.getEvaluationById.mockResolvedValue(null);
      await expect(saveScores(1, 1, {})).rejects.toThrow("Evaluation not found");
    });
    it("throws when not the assigned evaluator", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 2 });
      await expect(saveScores(1, 1, {})).rejects.toThrow("You are not the assigned evaluator");
    });
    it("throws when evaluation not editable", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 1, status: "Submitted" });
      await expect(saveScores(1, 1, {})).rejects.toThrow("not editable");
    });
    it("throws on invalid score", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 1, status: "Draft" });
      await expect(saveScores(1, 1, { scores: [{ manager_score: -1 }] })).rejects.toThrow("non-negative");
    });
    it("saves scores successfully", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 1, status: "Draft" });
      model.updateEvaluation.mockResolvedValue({});
      model.upsertScore.mockResolvedValue({});
      model.getEvaluationById.mockResolvedValueOnce({ id: 1, evaluator_id: 1, status: "In Progress" })
        .mockResolvedValueOnce({ id: 1, evaluator_id: 1, status: "In Progress" });
      const result = await saveScores(1, 1, { scores: [{ template_item_id: 1, manager_score: 4, weight: 50 }] });
      expect(result.status).toBe("In Progress");
    });
  });

  describe("submit", () => {
    it("throws when evaluation not found", async () => {
      model.getEvaluationById.mockResolvedValue(null);
      await expect(submit(1, 1, {})).rejects.toThrow("Evaluation not found");
    });
    it("throws when not the evaluator", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 2 });
      await expect(submit(1, 1, {})).rejects.toThrow("You are not the assigned evaluator");
    });
    it("throws when no scores exist", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 1 });
      model.getScoresByEvaluationId.mockResolvedValue([]);
      await expect(submit(1, 1, {})).rejects.toThrow("No scores saved");
    });
    it("throws on invalid recommendation", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, evaluator_id: 1 });
      model.getScoresByEvaluationId.mockResolvedValue([{ weighted_score: 80 }]);
      await expect(submit(1, 1, { recommendation: "Invalid" })).rejects.toThrow("Invalid recommendation");
    });
    it("submits evaluation", async () => {
      model.getEvaluationById.mockResolvedValueOnce({ id: 1, evaluator_id: 1, employee_name: "John", evaluator_name: "Jane" });
      model.getScoresByEvaluationId.mockResolvedValue([{ weighted_score: 80 }]);
      model.updateEvaluation.mockResolvedValue({});
      model.getEvaluationById.mockResolvedValueOnce({ id: 1, status: "Submitted", final_score: 80 });
      model.getActiveHRUserIds.mockResolvedValue([]);
      const result = await submit(1, 1, { recommendation: "Regularize" });
      expect(result.status).toBe("Submitted");
      expect(result.final_score).toBe(80);
    });
  });

  describe("saveSelfEvaluation", () => {
    it("throws when evaluation not found", async () => {
      model.getEvaluationById.mockResolvedValue(null);
      await expect(saveSelfEvaluation(1, 1, {})).rejects.toThrow("Evaluation not found");
    });
    it("throws when not the employee", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, employee_id: 2 });
      await expect(saveSelfEvaluation(1, 1, {})).rejects.toThrow("not your evaluation");
    });
    it("saves self evaluation", async () => {
      model.getEvaluationById.mockResolvedValueOnce({ id: 1, employee_id: 1, status: "Draft", evaluator_id: 2 });
      model.updateEvaluation.mockResolvedValue({});
      model.getEvaluationById.mockResolvedValueOnce({ id: 1, status: "In Progress" });
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      const result = await saveSelfEvaluation(1, 1, { self_evaluation: "Good" });
      expect(result.status).toBe("In Progress");
    });
  });

  describe("hrApprove", () => {
    it("throws when evaluation not found", async () => {
      model.getEvaluationById.mockResolvedValue(null);
      await expect(hrApprove(1, {})).rejects.toThrow("Evaluation not found");
    });
    it("throws when not submitted", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, status: "Draft" });
      await expect(hrApprove(1, {})).rejects.toThrow("must be in Submitted status");
    });
    it("approves with regularization", async () => {
      model.getEvaluationById
        .mockResolvedValueOnce({ id: 1, status: "Submitted", recommendation: "Regularize", employee_id: 1, employee_name: "John" })
        .mockResolvedValueOnce({ id: 1, status: "Approved" });
      model.updateEvaluation.mockResolvedValue({});
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      const result = await hrApprove(1, {});
      expect(result.status).toBe("Approved");
      expect(employeeModel.regularizeEmployee).toHaveBeenCalledWith(1);
    });
    it("approves with termination", async () => {
      model.getEvaluationById
        .mockResolvedValueOnce({ id: 1, status: "Submitted", recommendation: "Terminate", employee_id: 1, employee_name: "John" })
        .mockResolvedValueOnce({ id: 1, status: "Approved" });
      model.updateEvaluation.mockResolvedValue({});
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      const result = await hrApprove(1, { termination_date: "2026-06-01", termination_reason: "Poor performance" });
      expect(result.status).toBe("Approved");
      expect(employeeModel.updateEmployeeStatusToTerminated).toHaveBeenCalledWith(1, "2026-06-01", "Poor performance");
    });
    it("throws when termination date missing", async () => {
      model.getEvaluationById.mockResolvedValue({ id: 1, status: "Submitted", recommendation: "Terminate" });
      await expect(hrApprove(1, {})).rejects.toThrow("Termination date is required");
    });
  });

  describe("hrReject", () => {
    it("rejects evaluation", async () => {
      model.getEvaluationById
        .mockResolvedValueOnce({ id: 1, status: "Submitted", employee_id: 1, employee_name: "John" })
        .mockResolvedValueOnce({ id: 1, status: "Completed" });
      model.updateEvaluation.mockResolvedValue({});
      model.getUserIdsByEmployeeIds.mockResolvedValue([]);
      const result = await hrReject(1, { hr_comments: "Fix scores" });
      expect(result.status).toBe("Completed");
    });
  });

  describe("getHistory", () => {
    it("returns history filtered by search", async () => {
      model.getHistoryForHr.mockResolvedValue([{ id: 1 }]);
      expect(await getHistory(null, 1, 10, "search")).toHaveLength(1);
    });
    it("returns history for employee", async () => {
      model.getEvaluationsByEmployee.mockResolvedValue([{ id: 1 }]);
      expect(await getHistory(1, 1, 10, "")).toHaveLength(1);
    });
    it("returns all history when no filters", async () => {
      model.getHistoryForHr.mockResolvedValue([{ id: 1 }]);
      expect(await getHistory(null, 1, 10, "")).toHaveLength(1);
    });
  });

  describe("getPendingCount", () => {
    it("returns pending count", async () => {
      model.getPendingCountByEvaluator.mockResolvedValue(3);
      expect(await getPendingCount(1)).toBe(3);
    });
  });
});
