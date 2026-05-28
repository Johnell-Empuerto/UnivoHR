const model = require("../models/kpiEvaluation.model");
const templateModel = require("../models/kpiTemplate.model");
const employeeModel = require("../models/employee.model");

const VALID_STATUSES = ["Draft", "In Progress", "Submitted", "Completed", "Approved"];
const VALID_RECOMMENDATIONS = ["Regularize", "Extend Probation", "Training", "Warning", "Terminate"];

const assign = async (data) => {
  if (!data.employee_id) throw new Error("Employee is required");
  if (!data.evaluator_id) throw new Error("Evaluator is required");
  if (!data.template_id) throw new Error("Template is required");
  if (data.employee_id === data.evaluator_id) throw new Error("Employee and evaluator cannot be the same");

  const existing = await model.checkExistingEvaluation(
    data.employee_id, data.template_id, data.evaluation_period_start, data.evaluation_period_end,
  );
  if (existing) throw new Error("An active evaluation already exists for this employee with the same template and period");

  return await model.createEvaluation(data);
};

const getById = async (id) => {
  const evalData = await model.getEvaluationById(id);
  if (!evalData) throw new Error("Evaluation not found");
  const scores = await model.getScoresByEvaluationId(id);
  const items = await templateModel.getItemsByTemplateId(evalData.template_id);
  return { ...evalData, scores, items };
};

const getMyEvaluations = async (employeeId, status) => {
  return await model.getEvaluationsByEmployee(employeeId, status);
};

const getMyAssignments = async (evaluatorId, status, page, limit) => {
  return await model.getEvaluationsByEvaluator(evaluatorId, status, page, limit);
};

const getHrView = async (search, status, page, limit) => {
  return await model.getEvaluationsForHr(search, status, page, limit);
};

const saveScores = async (evaluationId, evaluatorId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (Number(evalData.evaluator_id) !== Number(evaluatorId)) throw new Error("You are not the assigned evaluator for this evaluation");
  if (evalData.status !== "Draft" && evalData.status !== "In Progress") throw new Error("Evaluation is not editable");

  await model.updateEvaluation(evaluationId, { status: "In Progress" });

  for (const score of data.scores || []) {
    const weight = score.weight || 0;
    const managerScore = score.manager_score || 0;
    const weightedScore = (managerScore / 5) * weight;
    await model.upsertScore({
      evaluation_id: evaluationId,
      template_item_id: score.template_item_id,
      manager_score: managerScore,
      weighted_score: Math.round(weightedScore * 100) / 100,
      remarks: score.remarks || null,
    });
  }
  return await model.getEvaluationById(evaluationId);
};

const submit = async (evaluationId, evaluatorId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (Number(evalData.evaluator_id) !== Number(evaluatorId)) throw new Error("You are not the assigned evaluator");

  const scores = await model.getScoresByEvaluationId(evaluationId);
  if (scores.length === 0) throw new Error("No scores saved. Please score at least one KPI item.");

  const totalWeighted = scores.reduce((s, sc) => s + parseFloat(sc.weighted_score || 0), 0);
  const finalScore = Math.round(totalWeighted * 100) / 100;

  const updates = {
    status: "Submitted",
    manager_comments: data.manager_comments || null,
    final_score: finalScore,
    recommendation: data.recommendation || null,
  };
  if (updates.recommendation && !VALID_RECOMMENDATIONS.includes(updates.recommendation)) {
    throw new Error("Invalid recommendation");
  }

  await model.updateEvaluation(evaluationId, updates);
  return await model.getEvaluationById(evaluationId);
};

const saveSelfEvaluation = async (evaluationId, employeeId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (Number(evalData.employee_id) !== Number(employeeId)) throw new Error("This is not your evaluation");

  await model.updateEvaluation(evaluationId, {
    self_evaluation: data.self_evaluation || null,
    status: evalData.status === "Draft" ? "In Progress" : evalData.status,
  });
  return await model.getEvaluationById(evaluationId);
};

const hrApprove = async (evaluationId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (evalData.status !== "Submitted") throw new Error("Evaluation must be in Submitted status to approve");

  const updates = {
    status: "Approved",
    hr_approved: true,
    hr_approval_date: new Date().toISOString().split("T")[0],
    hr_comments: data.hr_comments || null,
  };

  await model.updateEvaluation(evaluationId, updates);

  const rec = evalData.recommendation || data.recommendation;
  if (rec === "Regularize") {
    await employeeModel.updateEmploymentStatus(evalData.employee_id, "Regular");
  } else if (rec === "Terminate") {
    if (!data.termination_date) throw new Error("Termination date is required for termination");
    await employeeModel.updateEmployeeStatusToTerminated(
      evalData.employee_id,
      data.termination_date,
      data.termination_reason || null,
    );
  }

  return await model.getEvaluationById(evaluationId);
};

const hrReject = async (evaluationId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (evalData.status !== "Submitted") throw new Error("Evaluation must be in Submitted status");

  await model.updateEvaluation(evaluationId, {
    status: "Completed",
    hr_approved: false,
    hr_comments: data.hr_comments || null,
  });
  return await model.getEvaluationById(evaluationId);
};

const getHistory = async (employeeId, page = 1, limit = 10) => {
  return await model.getEvaluationsByEmployee(employeeId, "Approved");
};

const getPendingCount = async (evaluatorId) => {
  return await model.getPendingCountByEvaluator(evaluatorId);
};

const bulkAssign = async (data, createdBy) => {
  if (!data.employee_ids || data.employee_ids.length === 0) throw new Error("No employees selected");
  if (!data.evaluator_id) throw new Error("Evaluator is required");
  if (!data.template_id) throw new Error("Template is required");
  if (!data.evaluation_period_start || !data.evaluation_period_end) throw new Error("Evaluation period is required");

  const evaluations = data.employee_ids.map((empId) => ({
    employee_id: empId,
    evaluator_id: data.evaluator_id,
    template_id: data.template_id,
    evaluation_period_start: data.evaluation_period_start,
    evaluation_period_end: data.evaluation_period_end,
  }));

  return await model.bulkCreateEvaluations(evaluations, createdBy);
};

module.exports = {
  assign, getById, getMyEvaluations, getMyAssignments, getHrView,
  saveScores, submit, saveSelfEvaluation, hrApprove, hrReject,
  getHistory, getPendingCount,
};
