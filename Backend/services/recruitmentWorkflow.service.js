const workflowModel = require("../models/recruitmentWorkflow.model");
const pool = require("../config/db");

const STAGE_TYPES = [
  "INTERVIEW", "EXAM", "APPROVAL", "DOCUMENT_CHECK",
  "MEDICAL", "BACKGROUND_CHECK", "OFFER", "ONBOARDING",
  "CONVERT_TO_EMPLOYEE", "CUSTOM",
];

const getAll = async (params) => {
  return await workflowModel.getAll(params);
};

const getById = async (id) => {
  const workflow = await workflowModel.getById(id);
  if (!workflow) throw new Error("Workflow not found");
  return workflow;
};

const getWorkflowWithStages = async (id) => {
  const workflow = await getById(id);
  workflow.stages = await workflowModel.getStages(id);
  return workflow;
};

const create = async (data) => {
  if (!data.name || !data.name.trim()) throw new Error("Workflow name is required");
  const existing = await workflowModel.getByName(data.name.trim());
  if (existing) throw new Error("A workflow with this name already exists");
  return await workflowModel.create(data);
};

const update = async (id, data) => {
  const existing = await workflowModel.getById(id);
  if (!existing) throw new Error("Workflow not found");
  if (data.name && data.name.trim()) {
    const duplicate = await workflowModel.getByName(data.name.trim(), id);
    if (duplicate) throw new Error("A workflow with this name already exists");
  }
  return await workflowModel.update(id, data);
};

const remove = async (id) => {
  const existing = await workflowModel.getById(id);
  if (!existing) throw new Error("Workflow not found");

  const usageCheck = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM job_positions WHERE workflow_id = $1) AS job_position_count,
       (SELECT COUNT(*) FROM applicant_workflow_instances WHERE workflow_id = $1) AS instance_count`,
    [id],
  );
  const { job_position_count, instance_count } = usageCheck.rows[0];
  if (parseInt(job_position_count) > 0) {
    throw new Error("Cannot delete workflow: it is assigned to one or more job positions");
  }
  if (parseInt(instance_count) > 0) {
    throw new Error("Cannot delete workflow: it is in use by one or more applicants");
  }

  return await workflowModel.remove(id);
};

const getStages = async (workflowId) => {
  const workflow = await workflowModel.getById(workflowId);
  if (!workflow) throw new Error("Workflow not found");
  return await workflowModel.getStages(workflowId);
};

const createStage = async (workflowId, data) => {
  const workflow = await workflowModel.getById(workflowId);
  if (!workflow) throw new Error("Workflow not found");
  if (!data.stage_name || !data.stage_name.trim()) throw new Error("Stage name is required");
  if (!data.stage_type) throw new Error("Stage type is required");
  if (!STAGE_TYPES.includes(data.stage_type)) {
    throw new Error(`Invalid stage type. Must be one of: ${STAGE_TYPES.join(", ")}`);
  }
  if (data.stage_type === "CONVERT_TO_EMPLOYEE") {
    const existingStages = await workflowModel.getStages(workflowId);
    if (existingStages.some(s => s.stage_type === "CONVERT_TO_EMPLOYEE")) {
      throw new Error("A CONVERT_TO_EMPLOYEE stage already exists in this workflow");
    }
  }
  if (data.sequence_order === undefined || data.sequence_order === null) {
    const stages = await workflowModel.getStages(workflowId);
    data.sequence_order = stages.length > 0 ? Math.max(...stages.map(s => s.sequence_order)) + 1 : 1;
  }
  return await workflowModel.createStage(workflowId, data);
};

const updateStage = async (stageId, data) => {
  const existing = await workflowModel.getStageById(stageId);
  if (!existing) throw new Error("Stage not found");
  if (data.stage_type && !STAGE_TYPES.includes(data.stage_type)) {
    throw new Error(`Invalid stage type. Must be one of: ${STAGE_TYPES.join(", ")}`);
  }
  if (data.stage_type === "CONVERT_TO_EMPLOYEE") {
    const allStages = await workflowModel.getStages(existing.workflow_id);
    if (allStages.some(s => s.stage_type === "CONVERT_TO_EMPLOYEE" && s.id !== stageId)) {
      throw new Error("A CONVERT_TO_EMPLOYEE stage already exists in this workflow");
    }
  }
  return await workflowModel.updateStage(stageId, data);
};

const deleteStage = async (stageId) => {
  const existing = await workflowModel.getStageById(stageId);
  if (!existing) throw new Error("Stage not found");

  const usageCheck = await pool.query(
    `SELECT COUNT(*) AS count FROM applicant_stage_records WHERE workflow_stage_id = $1`,
    [stageId],
  );
  if (parseInt(usageCheck.rows[0].count) > 0) {
    throw new Error("Cannot delete stage: it has already been used by one or more applicant stage records");
  }

  return await workflowModel.deleteStage(stageId);
};

const reorderStages = async (workflowId, orderedStageIds) => {
  const workflow = await workflowModel.getById(workflowId);
  if (!workflow) throw new Error("Workflow not found");
  if (!Array.isArray(orderedStageIds) || orderedStageIds.length === 0) {
    throw new Error("orderedStageIds must be a non-empty array");
  }

  for (const stageId of orderedStageIds) {
    const stage = await workflowModel.getStageById(stageId);
    if (!stage) throw new Error(`Stage with id ${stageId} not found`);
    if (stage.workflow_id !== Number(workflowId)) {
      throw new Error(`Stage ${stageId} does not belong to workflow ${workflowId}`);
    }
  }

  const pool = require("../config/db");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const offset = 1000000;
    for (let i = 0; i < orderedStageIds.length; i++) {
      const tempOrder = -(offset + i);
      await client.query(
        `UPDATE recruitment_workflow_stages SET sequence_order = $1 WHERE id = $2`,
        [tempOrder, orderedStageIds[i]],
      );
    }

    const results = [];
    for (let i = 0; i < orderedStageIds.length; i++) {
      const finalOrder = i + 1;
      const result = await client.query(
        `UPDATE recruitment_workflow_stages SET sequence_order = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [finalOrder, orderedStageIds[i]],
      );
      results.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAll,
  getById,
  getWorkflowWithStages,
  create,
  update,
  remove,
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
};
