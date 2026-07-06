jest.mock("../models/recruitmentWorkflow.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStages: jest.fn(),
  getStageById: jest.fn(),
  createStage: jest.fn(),
  updateStage: jest.fn(),
  deleteStage: jest.fn(),
}));
jest.mock("../config/db", () => {
  const mClient = { query: jest.fn(), release: jest.fn() };
  return { query: jest.fn(), connect: jest.fn().mockResolvedValue(mClient) };
});

const model = require("../models/recruitmentWorkflow.model");
const pool = require("../config/db");
const {
  getAll, getById, getWorkflowWithStages, create, update, remove,
  getStages, createStage, updateStage, deleteStage, reorderStages,
} = require("../services/recruitmentWorkflow.service");

describe("recruitmentWorkflow.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getAll", () => {
    it("returns all workflows", async () => {
      model.getAll.mockResolvedValue([{ id: 1, name: "Default" }]);
      expect(await getAll({})).toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("returns workflow when found", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      expect(await getById(1)).toEqual({ id: 1 });
    });
    it("throws when not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Workflow not found");
    });
  });

  describe("getWorkflowWithStages", () => {
    it("returns workflow with stages", async () => {
      model.getById.mockResolvedValue({ id: 1, name: "Default" });
      model.getStages.mockResolvedValue([{ id: 1, name: "Interview", order: 1 }]);
      const result = await getWorkflowWithStages(1);
      expect(result.stages).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("throws when name is empty", async () => {
      await expect(create({ name: "" })).rejects.toThrow("Workflow name is required");
    });
    it("throws when name already exists", async () => {
      model.getByName.mockResolvedValue({ id: 2 });
      await expect(create({ name: "Existing" })).rejects.toThrow("workflow with this name already exists");
    });
    it("creates workflow", async () => {
      model.getByName.mockResolvedValue(null);
      model.create.mockResolvedValue({ id: 1, name: "New" });
      expect(await create({ name: "New" })).toEqual({ id: 1, name: "New" });
    });
  });

  describe("update", () => {
    it("throws when not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Workflow not found");
    });
    it("throws when name conflicts", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.getByName.mockResolvedValue({ id: 2 });
      await expect(update(1, { name: "Taken" })).rejects.toThrow("workflow with this name already exists");
    });
    it("updates workflow", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.getByName.mockResolvedValue(null);
      model.update.mockResolvedValue({ id: 1, name: "Updated" });
      expect(await update(1, { name: "Updated" })).toEqual({ id: 1, name: "Updated" });
    });
  });

  describe("remove", () => {
    it("throws when not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Workflow not found");
    });
    it("throws when assigned to job positions", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ job_position_count: 1, instance_count: 0 }] });
      await expect(remove(1)).rejects.toThrow("Cannot delete workflow: it is assigned to one or more job positions");
    });
    it("throws when in use by applicants", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ job_position_count: 0, instance_count: 1 }] });
      await expect(remove(1)).rejects.toThrow("Cannot delete workflow: it is in use by one or more applicants");
    });
    it("removes workflow", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ job_position_count: 0, instance_count: 0 }] });
      await expect(remove(1)).resolves.toBeUndefined();
      expect(model.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("getStages", () => {
    it("returns stages when workflow exists", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.getStages.mockResolvedValue([{ id: 1 }]);
      expect(await getStages(1)).toHaveLength(1);
    });
    it("throws when workflow not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(getStages(999)).rejects.toThrow("Workflow not found");
    });
  });

  describe("createStage", () => {
    it("throws when workflow not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(createStage(999, { stage_name: "Test", stage_type: "INTERVIEW" })).rejects.toThrow("Workflow not found");
    });
    it("throws when stage name missing", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      await expect(createStage(1, { stage_type: "INTERVIEW" })).rejects.toThrow("Stage name is required");
    });
    it("throws when stage type missing", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      await expect(createStage(1, { stage_name: "Test" })).rejects.toThrow("Stage type is required");
    });
    it("throws when stage type invalid", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      await expect(createStage(1, { stage_name: "Test", stage_type: "INVALID" })).rejects.toThrow("Invalid stage type");
    });
    it("creates stage", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.getStages.mockResolvedValue([]);
      model.createStage.mockResolvedValue({ id: 1, stage_name: "Test" });
      const result = await createStage(1, { stage_name: "Test", stage_type: "INTERVIEW", sequence_order: 1 });
      expect(result.id).toBe(1);
    });
  });

  describe("updateStage", () => {
    it("throws when stage not found", async () => {
      model.getStageById.mockResolvedValue(null);
      await expect(updateStage(999, {})).rejects.toThrow("Stage not found");
    });
    it("updates stage", async () => {
      model.getStageById.mockResolvedValue({ id: 1, workflow_id: 1 });
      model.updateStage.mockResolvedValue({ id: 1 });
      expect(await updateStage(1, { stage_name: "Updated" })).toEqual({ id: 1 });
    });
  });

  describe("deleteStage", () => {
    it("throws when stage not found", async () => {
      model.getStageById.mockResolvedValue(null);
      await expect(deleteStage(999)).rejects.toThrow("Stage not found");
    });
    it("throws when stage has usage", async () => {
      model.getStageById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ count: 1 }] });
      await expect(deleteStage(1)).rejects.toThrow("Cannot delete stage: it has already been used");
    });
    it("deletes stage", async () => {
      model.getStageById.mockResolvedValue({ id: 1 });
      pool.query.mockResolvedValue({ rows: [{ count: 0 }] });
      await expect(deleteStage(1)).resolves.toBeUndefined();
      expect(model.deleteStage).toHaveBeenCalledWith(1);
    });
  });

  describe("reorderStages", () => {
    it("throws when workflow not found", async () => {
      model.getById.mockResolvedValue(null);
      await expect(reorderStages(999, [1])).rejects.toThrow("Workflow not found");
    });
    it("throws when orderedStageIds is empty", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      await expect(reorderStages(1, [])).rejects.toThrow("orderedStageIds must be a non-empty array");
    });
    it("reorders stages", async () => {
      model.getById.mockResolvedValue({ id: 1 });
      model.getStageById.mockResolvedValue({ id: 1, workflow_id: 1 });
      const client = await pool.connect();
      client.query.mockResolvedValue({ rows: [{ id: 1, sequence_order: 1 }] });
      const result = await reorderStages(1, [1]);
      expect(result).toHaveLength(1);
      expect(client.query).toHaveBeenCalledWith("BEGIN");
      expect(client.query).toHaveBeenCalledWith("COMMIT");
    });
  });
});
