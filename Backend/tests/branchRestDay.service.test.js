jest.mock("../models/branchRestDay.model", () => ({
  getByBranchId: jest.fn(),
  getAllByBranchIds: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  setActive: jest.fn(),
}));

const branchRestDayModel = require("../models/branchRestDay.model");
const {
  getByBranchId, getAllByBranchIds, getAll, create, remove, setActive,
} = require("../services/branchRestDay.service");

describe("branchRestDay.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByBranchId", () => {
    it("delegates", async () => {
      branchRestDayModel.getByBranchId.mockResolvedValue([{ day_of_week: 0 }]);
      expect(await getByBranchId(1)).toEqual([{ day_of_week: 0 }]);
    });
  });

  describe("getAllByBranchIds", () => {
    it("delegates", async () => {
      branchRestDayModel.getAllByBranchIds.mockResolvedValue([]);
      expect(await getAllByBranchIds([1, 2])).toEqual([]);
    });
  });

  describe("getAll", () => {
    it("delegates", async () => {
      branchRestDayModel.getAll.mockResolvedValue([]);
      expect(await getAll()).toEqual([]);
    });
  });

  describe("create", () => {
    it("creates with valid day_of_week", async () => {
      branchRestDayModel.create.mockResolvedValue({ id: 1, day_of_week: 3 });
      expect(await create({ branch_id: 1, day_of_week: 3 })).toEqual({ id: 1, day_of_week: 3 });
    });

    it("throws for day_of_week < 0", () => {
      expect(() => create({ day_of_week: -1 })).toThrow("day_of_week must be between 0 and 6");
    });

    it("throws for day_of_week > 6", () => {
      expect(() => create({ day_of_week: 7 })).toThrow("day_of_week must be between 0 and 6");
    });

    it("throws for null day_of_week", () => {
      expect(() => create({ branch_id: 1 })).toThrow("day_of_week must be between 0 and 6");
    });
  });

  describe("remove", () => {
    it("delegates", async () => {
      branchRestDayModel.remove.mockResolvedValue({ id: 1 });
      expect(await remove(1)).toEqual({ id: 1 });
    });
  });

  describe("setActive", () => {
    it("delegates", async () => {
      branchRestDayModel.setActive.mockResolvedValue({ id: 1, is_active: true });
      expect(await setActive(1, true)).toEqual({ id: 1, is_active: true });
    });
  });
});
