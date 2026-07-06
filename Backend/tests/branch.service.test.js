jest.mock("../models/branch.model", () => ({
  getAll: jest.fn(),
  getActive: jest.fn(),
  getById: jest.fn(),
  getByCode: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  setActive: jest.fn(),
  countEmployees: jest.fn(),
  removeIfUnused: jest.fn(),
}));

const branchModel = require("../models/branch.model");
const {
  getAll, getActive, getById, create, update, setActive, remove,
} = require("../services/branch.service");

describe("branch.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to branchModel.getAll", async () => {
      branchModel.getAll.mockResolvedValue([{ id: 1, name: "Main" }]);
      expect(await getAll()).toEqual([{ id: 1, name: "Main" }]);
    });
  });

  describe("getActive", () => {
    it("delegates to branchModel.getActive", async () => {
      branchModel.getActive.mockResolvedValue([{ id: 1 }]);
      expect(await getActive()).toEqual([{ id: 1 }]);
    });
  });

  describe("getById", () => {
    it("returns branch when found", async () => {
      branchModel.getById.mockResolvedValue({ id: 1, name: "Main" });
      expect(await getById(1)).toEqual({ id: 1, name: "Main" });
    });

    it("throws when branch not found", async () => {
      branchModel.getById.mockResolvedValue(null);
      await expect(getById(999)).rejects.toThrow("Branch not found");
    });
  });

  describe("create", () => {
    it("creates branch with valid data", async () => {
      branchModel.getByCode.mockResolvedValue(null);
      branchModel.create.mockResolvedValue({ id: 1, code: "BR001", name: "Main", timezone: "Asia/Manila" });

      const result = await create({ code: "br001", name: "  Main  " });

      expect(result.code).toBe("BR001");
      expect(branchModel.create).toHaveBeenCalledWith({
        code: "BR001",
        name: "Main",
        timezone: "Asia/Manila",
      });
    });

    it("throws when code is empty", async () => {
      await expect(create({ code: "", name: "Main" })).rejects.toThrow("Branch code is required");
    });

    it("throws when name is empty", async () => {
      await expect(create({ code: "BR001", name: "" })).rejects.toThrow("Branch name is required");
    });

    it("throws when code already exists", async () => {
      branchModel.getByCode.mockResolvedValue({ id: 2 });
      await expect(create({ code: "BR001", name: "Main" })).rejects.toThrow("Branch code already exists");
    });

    it("throws for invalid timezone", async () => {
      branchModel.getByCode.mockResolvedValue(null);
      await expect(create({ code: "BR001", name: "Main", timezone: "Bad/Zone" })).rejects.toThrow("Invalid timezone");
    });
  });

  describe("update", () => {
    it("updates branch with valid data", async () => {
      branchModel.getById.mockResolvedValue({ id: 1, code: "BR001", name: "Old", timezone: "Asia/Manila" });
      branchModel.getByCode.mockResolvedValue(null);
      branchModel.update.mockResolvedValue({ id: 1, code: "BR002", name: "New" });

      const result = await update(1, { code: "br002", name: "New" });

      expect(result.code).toBe("BR002");
    });

    it("throws when branch not found", async () => {
      branchModel.getById.mockResolvedValue(null);
      await expect(update(999, { name: "New" })).rejects.toThrow("Branch not found");
    });

    it("throws when duplicate code exists on different branch", async () => {
      branchModel.getById.mockResolvedValue({ id: 1, code: "BR001", timezone: "Asia/Manila" });
      branchModel.getByCode.mockResolvedValue({ id: 2, code: "BR002" });

      await expect(update(1, { code: "BR002" })).rejects.toThrow("Branch code already exists");
    });

    it("allows same code on same branch", async () => {
      branchModel.getById.mockResolvedValue({ id: 1, code: "BR001", timezone: "Asia/Manila" });
      branchModel.getByCode.mockResolvedValue({ id: 1, code: "BR001" });
      branchModel.update.mockResolvedValue({ id: 1 });

      const result = await update(1, { code: "BR001" });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe("setActive", () => {
    it("activates branch", async () => {
      branchModel.getById.mockResolvedValue({ id: 1 });
      branchModel.setActive.mockResolvedValue({ id: 1, is_active: true });

      const result = await setActive(1, true);
      expect(result.is_active).toBe(true);
    });

    it("throws when deactivating branch with employees", async () => {
      branchModel.getById.mockResolvedValue({ id: 1 });
      branchModel.countEmployees.mockResolvedValue(5);

      await expect(setActive(1, false)).rejects.toThrow("employee(s) are assigned");
    });

    it("deactivates branch with no employees", async () => {
      branchModel.getById.mockResolvedValue({ id: 1 });
      branchModel.countEmployees.mockResolvedValue(0);
      branchModel.setActive.mockResolvedValue({ id: 1, is_active: false });

      const result = await setActive(1, false);
      expect(result.is_active).toBe(false);
    });
  });

  describe("remove", () => {
    it("removes unused branch", async () => {
      branchModel.removeIfUnused.mockResolvedValue({ id: 1 });
      expect(await remove(1)).toEqual({ id: 1 });
    });

    it("throws when branch not found or has dependencies", async () => {
      branchModel.removeIfUnused.mockResolvedValue(null);
      await expect(remove(999)).rejects.toThrow("Branch not found");
    });
  });
});
