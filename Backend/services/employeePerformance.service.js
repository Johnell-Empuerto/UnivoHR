const model = require("../models/employeePerformance.model");
const employeeModel = require("../models/employee.model");

const getSummary = async (employeeId) => {
  const summary = await model.getPerformanceSummary(employeeId);
  const latest = await model.getLatestEvaluation(employeeId);

  return {
    latestScore: summary?.latest_score ? parseFloat(summary.latest_score) : null,
    averageScore: summary?.average_score ? parseFloat(summary.average_score) : null,
    completedEvaluations: parseInt(summary?.completed_count || 0),
    pendingEvaluations: parseInt(summary?.pending_count || 0),
    employmentStatus: summary?.employment_status || "Unknown",
    latestEvaluation: latest
      ? {
          finalScore: parseFloat(latest.final_score),
          recommendation: latest.recommendation,
          templateName: latest.template_name,
          evaluatorName: latest.evaluator_name,
          periodStart: latest.evaluation_period_start,
          periodEnd: latest.evaluation_period_end,
          managerComments: latest.manager_comments,
          hrComments: latest.hr_comments,
        }
      : null,
  };
};

const getProbationInfo = async (employeeId) => {
  const employee = await employeeModel.getEmployeeById(employeeId);
  if (!employee) throw new Error("Employee not found");

  const latest = await model.getLatestEvaluation(employeeId);
  const regularizationReadiness = deriveReadiness(latest);

  let expectedDate = null;
  let daysRemaining = null;
  if (employee.hired_date) {
    expectedDate = new Date(employee.hired_date);
    const probationMonths = employee.probation_period_months ?? 6;
    expectedDate.setMonth(expectedDate.getMonth() + probationMonths);
    const today = new Date();
    daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;
  }

  return {
    employmentStatus: employee.employment_status || "Probationary",
    hiredDate: employee.hired_date,
    expectedRegularizationDate: expectedDate ? expectedDate.toISOString().split("T")[0] : null,
    daysRemaining,
    latestEvaluation: latest
      ? {
          finalScore: parseFloat(latest.final_score),
          recommendation: latest.recommendation,
          evaluatorName: latest.evaluator_name,
          periodStart: latest.evaluation_period_start,
          periodEnd: latest.evaluation_period_end,
          hrComments: latest.hr_comments,
        }
      : null,
    regularizationReadiness,
  };
};

const deriveReadiness = (latest) => {
  if (!latest) return "No Evaluation Yet";
  if (!latest.recommendation) return "Needs Improvement";
  if (latest.recommendation === "Regularize") return "Recommended for Regularization";
  if (latest.recommendation === "Extend Probation") return "Probation Extension Recommended";
  if (latest.recommendation === "Training") return "Needs Improvement";
  if (latest.recommendation === "Warning") return "Needs Improvement";
  if (latest.recommendation === "Terminate") return "Not Recommended";
  return "Needs Improvement";
};

module.exports = { getSummary, getProbationInfo };
