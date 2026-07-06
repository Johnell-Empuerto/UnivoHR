jest.mock("../models/kpiTemplate.model", () => ({
  getAllTemplates: jest.fn(),
  getTemplateById: jest.fn(),
  getTemplateByName: jest.fn(),
  createTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  toggleTemplateActive: jest.fn(),
  isTemplateInUse: jest.fn(),
  deleteTemplate: jest.fn(),
  getItemsByTemplateId: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  isItemInUse: jest.fn(),
  getActiveTemplates: jest.fn(),
}));

const model = require("../models/kpiTemplate.model");
const {
  getAll, getById, create, update, toggleActive, remove,
  getItems, addItem, editItem, removeItem, getActiveTemplates,
} = require("../services/kpiTemplate.service");

describe("kpiTemplate.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getAll", () => {
    it("returns all templates", async () => {
      model.getAllTemplates.mockResolvedValue([{ id: 1, name: "KPI" }]);
      const result = await getAll("search", 1, 10);
      expect(result).toHaveLength(1);
      expect(model.getAllTemplates).toHaveBeenCalledWith("search", 1, 10);
    });
  });

  describe("getById", () => {
    it("returns template with items when found", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1, name: "KPI" });
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1, kpi_name: "KPI 1" }]);
      const result = await getById(1);
      expect(result.name).toBe("KPI");
      expect(result.items).toHaveLength(1);
    });

    it("throws when not found", async () => {
      model.getTemplateById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Template not found");
    });
  });

  describe("create", () => {
    it("throws when name is empty", async () => {
      await expect(create({ name: "" })).rejects.toThrow("Template name is required");
    });

    it("throws when name already exists", async () => {
      model.getTemplateByName.mockResolvedValue({ id: 2 });
      await expect(create({ name: "Existing" })).rejects.toThrow("template with this name already exists");
    });

    it("creates template successfully", async () => {
      model.getTemplateByName.mockResolvedValue(null);
      model.createTemplate.mockResolvedValue({ id: 1, name: "New" });
      const result = await create({ name: "New", created_by: 1 });
      expect(result.id).toBe(1);
    });
  });

  describe("update", () => {
    it("throws when template not found", async () => {
      model.getTemplateById.mockResolvedValue(null);
      await expect(update(999, {})).rejects.toThrow("Template not found");
    });

    it("throws when new name conflicts", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1, name: "Old" });
      model.getTemplateByName.mockResolvedValue({ id: 2 });
      await expect(update(1, { name: "Taken" })).rejects.toThrow("template with this name already exists");
    });

    it("updates template successfully", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      model.getTemplateByName.mockResolvedValue(null);
      model.updateTemplate.mockResolvedValue({ id: 1, name: "Updated" });
      const result = await update(1, { name: "Updated" });
      expect(result.name).toBe("Updated");
    });
  });

  describe("toggleActive", () => {
    it("throws when template not found", async () => {
      model.getTemplateById.mockResolvedValue(null);
      await expect(toggleActive(999)).rejects.toThrow("Template not found");
    });

    it("toggles active status", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1, is_active: false });
      model.toggleTemplateActive.mockResolvedValue({ id: 1, is_active: true });
      const result = await toggleActive(1);
      expect(result.is_active).toBe(true);
      expect(model.toggleTemplateActive).toHaveBeenCalledWith(1, true);
    });
  });

  describe("remove", () => {
    it("throws when template not found", async () => {
      model.getTemplateById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Template not found");
    });

    it("throws when template is in use", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      model.isTemplateInUse.mockResolvedValue(true);
      await expect(remove(1)).rejects.toThrow("Cannot delete template that is already used in evaluations");
    });

    it("removes template successfully", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      model.isTemplateInUse.mockResolvedValue(false);
      await expect(remove(1)).resolves.toBeUndefined();
      expect(model.deleteTemplate).toHaveBeenCalledWith(1);
    });
  });

  describe("getItems", () => {
    it("returns items for template", async () => {
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1 }]);
      expect(await getItems(1)).toHaveLength(1);
    });
  });

  describe("addItem", () => {
    it("throws when template not found", async () => {
      model.getTemplateById.mockResolvedValue(null);
      await expect(addItem(999, {})).rejects.toThrow("Template not found");
    });

    it("throws when kpi name is empty", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      await expect(addItem(1, { kpi_name: "", weight: 50 })).rejects.toThrow("KPI name is required");
    });

    it("throws when weight is negative", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      await expect(addItem(1, { kpi_name: "Test", weight: -1 })).rejects.toThrow("Weight must be a non-negative number");
    });

    it("throws when weight exceeds 100", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      await expect(addItem(1, { kpi_name: "Test", weight: 101 })).rejects.toThrow("Individual item weight cannot exceed 100");
    });

    it("throws when total weight exceeds 100", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      model.createItem.mockResolvedValue({ id: 1, weight: 60 });
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1, weight: 60 }, { id: 2, weight: 50 }]);
      await expect(addItem(1, { kpi_name: "KPI", weight: 60 })).rejects.toThrow("Total weight exceeds 100");
    });

    it("adds item successfully", async () => {
      model.getTemplateById.mockResolvedValue({ id: 1 });
      model.createItem.mockResolvedValue({ id: 1, kpi_name: "KPI", weight: 50 });
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1, weight: 50 }]);
      const result = await addItem(1, { kpi_name: "KPI", weight: 50 });
      expect(result.id).toBe(1);
    });
  });

  describe("editItem", () => {
    it("throws when kpi name is empty", async () => {
      await expect(editItem(1, { kpi_name: "", weight: 50 })).rejects.toThrow("KPI name is required");
    });

    it("throws when weight is negative", async () => {
      await expect(editItem(1, { kpi_name: "Test", weight: -1 })).rejects.toThrow("Weight must be a non-negative number");
    });

    it("throws when weight exceeds 100", async () => {
      await expect(editItem(1, { kpi_name: "Test", weight: 101 })).rejects.toThrow("Individual item weight cannot exceed 100");
    });

    it("throws when total weight exceeds 100", async () => {
      model.updateItem.mockResolvedValue({ id: 1, template_id: 1, weight: 80 });
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1, weight: 80 }, { id: 2, weight: 30 }]);
      await expect(editItem(1, { kpi_name: "KPI", weight: 80 })).rejects.toThrow("Total weight exceeds 100");
    });

    it("edits item successfully", async () => {
      model.updateItem.mockResolvedValue({ id: 1, template_id: 1, weight: 50 });
      model.getItemsByTemplateId.mockResolvedValue([{ id: 1, weight: 50 }]);
      const result = await editItem(1, { kpi_name: "KPI", weight: 50 });
      expect(result.id).toBe(1);
    });
  });

  describe("removeItem", () => {
    it("throws when item is in use", async () => {
      model.isItemInUse.mockResolvedValue(true);
      await expect(removeItem(1)).rejects.toThrow("Cannot delete this KPI item because it is already used in evaluation scores");
    });

    it("removes item successfully", async () => {
      model.isItemInUse.mockResolvedValue(false);
      await expect(removeItem(1)).resolves.toBeUndefined();
      expect(model.deleteItem).toHaveBeenCalledWith(1);
    });
  });

  describe("getActiveTemplates", () => {
    it("returns active templates", async () => {
      model.getActiveTemplates.mockResolvedValue([{ id: 1, is_active: true }]);
      expect(await getActiveTemplates()).toHaveLength(1);
    });
  });
});
