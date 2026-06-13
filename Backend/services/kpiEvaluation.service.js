const model = require("../models/kpiEvaluation.model");
const templateModel = require("../models/kpiTemplate.model");
const employeeModel = require("../models/employee.model");
const notificationService = require("./notification.service");

const VALID_STATUSES = ["Draft", "In Progress", "Submitted", "Completed", "Approved"];
const VALID_RECOMMENDATIONS = ["Regularize", "Extend Probation", "Training", "Warning", "Terminate"];

const notifyParty = (userIds, type, title, message, referenceId, meta) => {
  if (userIds.length === 0) return;
  const promises = userIds.map(id => notificationService.notify({
    user_id: id, type, title, message, reference_id: referenceId, meta,
  }));
  Promise.all(promises).catch(err => console.error("[KPI] Notification error:", err));
};

const assign = async (data) => {
  if (!data.employee_id) throw new Error("Employee is required");
  if (!data.evaluator_id) throw new Error("Evaluator is required");
  if (!data.template_id) throw new Error("Template is required");
  if (data.employee_id === data.evaluator_id) throw new Error("Employee and evaluator cannot be the same");

  const existing = await model.checkExistingEvaluation(
    data.employee_id, data.template_id, data.evaluation_period_start, data.evaluation_period_end,
  );
  if (existing) throw new Error("An active evaluation already exists for this employee with the same template and period");

  const evaluation = await model.createEvaluation(data);

  model.getUserIdsByEmployeeIds([data.employee_id, data.evaluator_id]).then(userRows => {
    const period = data.evaluation_period_start && data.evaluation_period_end
      ? `${data.evaluation_period_start} to ${data.evaluation_period_end}` : "";
    for (const row of userRows) {
      const isEmployee = Number(row.employee_id) === Number(data.employee_id);
      notifyParty(
        [row.id], "KPI_EVALUATION",
        "Evaluation Assigned",
        isEmployee
          ? `A performance evaluation has been assigned to you${period ? ` for ${period}` : ""}`
          : `You are assigned to evaluate ${row.employee_name || `Employee #${data.employee_id}`}${period ? ` for ${period}` : ""}`,
        evaluation.id,
        { evaluation_id: evaluation.id, employee_id: data.employee_id, evaluator_id: data.evaluator_id, template_id: data.template_id, period },
      );
    }
  }).catch(err => console.error("[KPI] Failed to send assign notifications:", err));

  return evaluation;
};

const getById = async (id) => {
  const evalData = await model.getEvaluationById(id);
  if (!evalData) throw new Error("Evaluation not found");
  const scores = await model.getScoresByEvaluationId(id);
  const items = await templateModel.getItemsByTemplateId(evalData.template_id);
  return { ...evalData, scores, items };
};

const getMyEvaluations = async (employeeId, status, page, limit) => {
  return await model.getEvaluationsByEmployee(employeeId, status, page, limit);
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
    const managerScore = parseFloat(score.manager_score);
    if (isNaN(managerScore) || managerScore < 0) throw new Error("Score must be a non-negative number");
    if (managerScore > 5) throw new Error("Score cannot exceed 5");
    const weight = parseFloat(score.weight) || 0;
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
  const updated = await model.getEvaluationById(evaluationId);

  model.getActiveHRUserIds().then(userIds => {
    notifyParty(
      userIds, "KPI_EVALUATION",
      "Evaluation Submitted",
      `${evalData.employee_name}'s evaluation has been submitted by ${evalData.evaluator_name} with a score of ${finalScore}`,
      evaluationId,
      { evaluation_id: evaluationId, employee_id: evalData.employee_id, evaluator_id: evalData.evaluator_id, final_score: finalScore },
    );
  }).catch(err => console.error("[KPI] Failed to send submit notification:", err));

  return updated;
};

const saveSelfEvaluation = async (evaluationId, employeeId, data) => {
  const evalData = await model.getEvaluationById(evaluationId);
  if (!evalData) throw new Error("Evaluation not found");
  if (Number(evalData.employee_id) !== Number(employeeId)) throw new Error("This is not your evaluation");

  await model.updateEvaluation(evaluationId, {
    self_evaluation: data.self_evaluation || null,
    status: evalData.status === "Draft" ? "In Progress" : evalData.status,
  });
  const updated = await model.getEvaluationById(evaluationId);

  model.getUserIdsByEmployeeIds([evalData.evaluator_id]).then(userRows => {
    notifyParty(
      userRows.map(r => r.id), "KPI_EVALUATION",
      "Self Evaluation Submitted",
      `${evalData.employee_name} has submitted their self-evaluation`,
      evaluationId,
      { evaluation_id: evaluationId, employee_id: employeeId, evaluator_id: evalData.evaluator_id },
    );
  }).catch(err => console.error("[KPI] Failed to send self-evaluation notification:", err));

  return updated;
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
    await employeeModel.regularizeEmployee(evalData.employee_id);
  } else if (rec === "Terminate") {
    if (!data.termination_date) throw new Error("Termination date is required for termination");
    await employeeModel.updateEmployeeStatusToTerminated(
      evalData.employee_id,
      data.termination_date,
      data.termination_reason || null,
    );
  }

  const updated = await model.getEvaluationById(evaluationId);

  model.getUserIdsByEmployeeIds([evalData.employee_id, evalData.evaluator_id]).then(userRows => {
    notifyParty(
      userRows.map(r => r.id), "KPI_EVALUATION",
      "Evaluation Approved",
      `Performance evaluation for ${evalData.employee_name} has been approved`,
      evaluationId,
      { evaluation_id: evaluationId, employee_id: evalData.employee_id, evaluator_id: evalData.evaluator_id, status: "Approved" },
    );
  }).catch(err => console.error("[KPI] Failed to send approval notification:", err));

  return updated;
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
  const updated = await model.getEvaluationById(evaluationId);

  model.getUserIdsByEmployeeIds([evalData.employee_id, evalData.evaluator_id]).then(userRows => {
    notifyParty(
      userRows.map(r => r.id), "KPI_EVALUATION",
      "Evaluation Returned",
      `Performance evaluation for ${evalData.employee_name} requires revision`,
      evaluationId,
      { evaluation_id: evaluationId, employee_id: evalData.employee_id, evaluator_id: evalData.evaluator_id, status: "Completed" },
    );
  }).catch(err => console.error("[KPI] Failed to send rejection notification:", err));

  return updated;
};

const getHistory = async (employeeId, page = 1, limit = 10, search = "") => {
  if (search) {
    return await model.getHistoryForHr(search, page, limit);
  }
  if (employeeId) {
    return await model.getEvaluationsByEmployee(employeeId, "Approved", page, limit);
  }
  return await model.getHistoryForHr("", page, limit);
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

  const result = await model.bulkCreateEvaluations(evaluations, createdBy);

  if (result.created_count > 0) {
    model.getUserIdsByEmployeeIds(result.created_employee_ids).then(userRows => {
      const period = data.evaluation_period_start && data.evaluation_period_end
        ? `${data.evaluation_period_start} to ${data.evaluation_period_end}` : "";
      notifyParty(
        userRows.map(r => r.id), "KPI_EVALUATION",
        "Evaluation Assigned",
        `A performance evaluation has been assigned to you${period ? ` for ${period}` : ""}`,
        null,
        { evaluator_id: data.evaluator_id, template_id: data.template_id, period },
      );
    }).catch(err => console.error("[KPI] Failed to send bulk assign notifications:", err));
  }

  return result;
};

module.exports = {
  assign, getById, getMyEvaluations, getMyAssignments, getHrView,
  saveScores, submit, saveSelfEvaluation, hrApprove, hrReject,
  getHistory, getPendingCount,
};
