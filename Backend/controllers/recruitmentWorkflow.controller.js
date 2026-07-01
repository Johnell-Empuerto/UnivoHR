const workflowService = require("../services/recruitmentWorkflow.service");
const audit = require("../services/audit.service");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, is_active, branch_id, job_position_id } = req.query;
    const result = await workflowService.getAll({ page, limit, search, is_active, branch_id, job_position_id });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res) => {
  try {
    const includeStages = req.query.include_stages === "true";
    const workflow = includeStages
      ? await workflowService.getWorkflowWithStages(req.params.id)
      : await workflowService.getById(req.params.id);
    res.json(workflow);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const workflow = await workflowService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "recruitment_workflows",
      record_id: workflow.id,
      new_values: { name: workflow.name, is_default: workflow.is_default, is_active: workflow.is_active },
      description: `Recruitment workflow created: ${workflow.name}`,
    });
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "recruitment_workflows",
      record_id: workflow.id,
      new_values: { name: workflow.name, is_active: workflow.is_active },
      description: `Recruitment workflow updated: ${workflow.name}`,
    });
    res.json(workflow);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const workflow = await workflowService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "recruitment_workflows",
      record_id: workflow.id,
      new_values: { name: workflow.name },
      description: `Recruitment workflow deleted: ${workflow.name}`,
    });
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getStages = async (req, res) => {
  try {
    const stages = await workflowService.getStages(req.params.id);
    res.json(stages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createStage = async (req, res) => {
  try {
    const stage = await workflowService.createStage(req.params.id, req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "recruitment_workflow_stages",
      record_id: stage.id,
      new_values: { stage_name: stage.stage_name, stage_type: stage.stage_type, sequence_order: stage.sequence_order },
      description: `Stage "${stage.stage_name}" created for workflow #${req.params.id}`,
    });
    res.status(201).json(stage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateStage = async (req, res) => {
  try {
    const stage = await workflowService.updateStage(req.params.stageId, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "recruitment_workflow_stages",
      record_id: stage.id,
      new_values: { stage_name: stage.stage_name, stage_type: stage.stage_type, sequence_order: stage.sequence_order },
      description: `Stage #${stage.id} updated: ${stage.stage_name}`,
    });
    res.json(stage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteStage = async (req, res) => {
  try {
    const stage = await workflowService.deleteStage(req.params.stageId);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "recruitment_workflow_stages",
      record_id: stage.id,
      new_values: { stage_name: stage.stage_name },
      description: `Stage "${stage.stage_name}" deleted from workflow #${stage.workflow_id}`,
    });
    res.json({ message: "Stage deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const reorderStages = async (req, res) => {
  try {
    const stages = await workflowService.reorderStages(req.params.id, req.body.orderedStageIds);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "recruitment_workflow_stages",
      record_id: null,
      new_values: { reordered: true, workflow_id: req.params.id },
      description: `Stages reordered for workflow #${req.params.id}`,
    });
    res.json(stages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
};
