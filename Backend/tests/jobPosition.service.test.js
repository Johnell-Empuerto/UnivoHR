jest.mock("../models/jobPosition.model", () => ({
  getAll: jest.fn(),
  getAllActive: jest.fn(),
  getById: jest.fn(),
  getByTitle: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  isUsedByApplicants: jest.fn(),
}));

const jobPositionModel = require("../models/jobPosition.model");
const {
  getAll, getAllActive, getById, create, update, remove,
} = require("../services/jobPosition.service");

describe("jobPosition.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates", async () => {
      jobPositionModel.getAll.mockResolvedValue([{ id: 1, title: "Engineer" }]);
      expect(await getAll(1, 10, "", "active")).toEqual([{ id: 1, title: "Engineer" }]);
    });
  });

  describe("getAllActive", () => {
    it("delegates", async () => {
      jobPositionModel.getAllActive.mockResolvedValue([{ id: 1 }]);
      expect(await getAllActive()).toEqual([{ id: 1 }]);
    });
  });

  describe("getById", () => {
    it("returns position when found", async () => {
      jobPositionModel.getById.mockResolvedValue({ id: 1, title: "Engineer" });
      expect(await getById(1)).toEqual({ id: 1, title: "Engineer" });
    });

    it("throws when not found", async () => {
      jobPositionModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Job position not found");
    });
  });

  describe("create", () => {
    it("creates with valid title", async () => {
      jobPositionModel.getByTitle.mockResolvedValue(null);
      jobPositionModel.create.mockResolvedValue({ id: 1, title: "Engineer" });

      const result = await create({ title: "Engineer" });
      expect(result.id).toBe(1);
    });

    it("throws when title is empty", async () => {
      await expect(create({ title: "" })).rejects.toThrow("Job title is required");
    });

    it("throws when title already exists", async () => {
      jobPositionModel.getByTitle.mockResolvedValue({ id: 2, title: "Engineer" });
      await expect(create({ title: "Engineer" })).rejects.toThrow("already exists");
    });
  });

  describe("update", () => {
    it("updates with valid data", async () => {
      jobPositionModel.getById.mockResolvedValue({ id: 1, title: "Old" });
      jobPositionModel.getByTitle.mockResolvedValue(null);
      jobPositionModel.update.mockResolvedValue({ id: 1, title: "Engineer" });

      const result = await update(1, { title: "Engineer" });
      expect(result.title).toBe("Engineer");
    });

    it("throws when not found", async () => {
      jobPositionModel.getById.mockResolvedValue(null);
      await expect(update(999, { title: "New" })).rejects.toThrow("Job position not found");
    });

    it("throws on duplicate title", async () => {
      jobPositionModel.getById.mockResolvedValue({ id: 1, title: "Old" });
      jobPositionModel.getByTitle.mockResolvedValue({ id: 2, title: "Engineer" });

      await expect(update(1, { title: "Engineer" })).rejects.toThrow("already exists");
    });
  });

  describe("remove", () => {
    it("removes unused position", async () => {
      jobPositionModel.getById.mockResolvedValue({ id: 1 });
      jobPositionModel.isUsedByApplicants.mockResolvedValue(false);
      jobPositionModel.remove.mockResolvedValue({ id: 1 });

      expect(await remove(1)).toEqual({ id: 1 });
    });

    it("throws when not found", async () => {
      jobPositionModel.getById.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Job position not found");
    });

    it("throws when used by applicants", async () => {
      jobPositionModel.getById.mockResolvedValue({ id: 1 });
      jobPositionModel.isUsedByApplicants.mockResolvedValue(true);

      await expect(remove(1)).rejects.toThrow("Cannot delete position that is assigned to applicants");
    });
  });
});
