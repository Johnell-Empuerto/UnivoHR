jest.mock("../models/employeePerformance.model", () => ({
  getPerformanceSummary: jest.fn(),
  getLatestEvaluation: jest.fn(),
}));
jest.mock("../models/employee.model", () => ({
  getEmployeeById: jest.fn(),
}));

const model = require("../models/employeePerformance.model");
const employeeModel = require("../models/employee.model");
const { getSummary, getProbationInfo } = require("../services/employeePerformance.service");

describe("employeePerformance.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getSummary", () => {
    it("returns performance summary with latest evaluation", async () => {
      model.getPerformanceSummary.mockResolvedValue({
        latest_score: "85.5", average_score: "80.0",
        completed_count: "3", pending_count: "1", employment_status: "REGULAR",
      });
      model.getLatestEvaluation.mockResolvedValue({
        final_score: "90", recommendation: "Regularize", template_name: "Q1",
        evaluator_name: "Manager", evaluation_period_start: "2026-01-01",
        evaluation_period_end: "2026-03-31", manager_comments: "Good", hr_comments: "Ok",
      });
      const result = await getSummary(1);
      expect(result.latestScore).toBe(85.5);
      expect(result.averageScore).toBe(80.0);
      expect(result.completedEvaluations).toBe(3);
      expect(result.latestEvaluation.recommendation).toBe("Regularize");
    });

    it("returns null values when no summary exists", async () => {
      model.getPerformanceSummary.mockResolvedValue(null);
      model.getLatestEvaluation.mockResolvedValue(null);
      const result = await getSummary(1);
      expect(result.latestScore).toBeNull();
      expect(result.latestEvaluation).toBeNull();
      expect(result.completedEvaluations).toBe(0);
    });
  });

  describe("getProbationInfo", () => {
    it("returns probation info for employee", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({
        id: 1, hired_date: "2025-07-01", probation_period_months: 6,
        employment_status: "PROBATIONARY",
      });
      model.getLatestEvaluation.mockResolvedValue({
        final_score: "85", recommendation: "Regularize", template_name: "Q1",
        evaluator_name: "Manager", evaluation_period_start: "2026-01-01",
        evaluation_period_end: "2026-03-31", hr_comments: "Ok", status: "Completed",
      });
      const result = await getProbationInfo(1);
      expect(result.employmentStatus).toBe("PROBATIONARY");
      expect(result.regularizationReadiness).toBe("Recommended for Regularization");
      expect(result.expectedRegularizationDate).toBeDefined();
      expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
      expect(result.latestEvaluation.recommendation).toBe("Regularize");
    });

    it("throws when employee not found", async () => {
      employeeModel.getEmployeeById.mockResolvedValue(null);
      await expect(getProbationInfo(999)).rejects.toThrow("Employee not found");
    });

    it("returns null dates when no hired date", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({ id: 1, employment_status: "PROBATIONARY" });
      model.getLatestEvaluation.mockResolvedValue(null);
      const result = await getProbationInfo(1);
      expect(result.expectedRegularizationDate).toBeNull();
      expect(result.daysRemaining).toBeNull();
      expect(result.regularizationReadiness).toBe("No Evaluation Yet");
    });

    it("derives readiness for each recommendation", async () => {
      employeeModel.getEmployeeById.mockResolvedValue({ id: 1, hired_date: "2025-01-01", probation_period_months: 6, employment_status: "PROBATIONARY" });

      model.getLatestEvaluation.mockResolvedValue({ recommendation: "Extend Probation", final_score: "70" });
      expect((await getProbationInfo(1)).regularizationReadiness).toBe("Probation Extension Recommended");

      model.getLatestEvaluation.mockResolvedValue({ recommendation: "Training", final_score: "70" });
      expect((await getProbationInfo(1)).regularizationReadiness).toBe("Training Recommended");

      model.getLatestEvaluation.mockResolvedValue({ recommendation: "Warning", final_score: "70" });
      expect((await getProbationInfo(1)).regularizationReadiness).toBe("Needs Improvement");

      model.getLatestEvaluation.mockResolvedValue({ recommendation: "Terminate", final_score: "70" });
      expect((await getProbationInfo(1)).regularizationReadiness).toBe("Termination Recommended");
    });
  });
});
