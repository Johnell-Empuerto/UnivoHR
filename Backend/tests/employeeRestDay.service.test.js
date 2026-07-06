jest.mock("../models/employeeRestDay.model", () => ({
  getByEmployeeId: jest.fn(),
  getByEmployeeIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeByEmployeeId: jest.fn(),
}));

const employeeRestDayModel = require("../models/employeeRestDay.model");
const {
  getByEmployeeId, getByEmployeeIds, create, update, remove, removeByEmployeeId,
} = require("../services/employeeRestDay.service");

describe("employeeRestDay.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByEmployeeId", () => {
    it("delegates", async () => {
      employeeRestDayModel.getByEmployeeId.mockResolvedValue([{ day_of_week: 0 }]);
      expect(await getByEmployeeId(1)).toEqual([{ day_of_week: 0 }]);
    });
  });

  describe("getByEmployeeIds", () => {
    it("delegates", async () => {
      employeeRestDayModel.getByEmployeeIds.mockResolvedValue([]);
      expect(await getByEmployeeIds([1, 2])).toEqual([]);
    });
  });

  describe("create", () => {
    it("creates with valid day_of_week", async () => {
      employeeRestDayModel.create.mockResolvedValue({ id: 1, day_of_week: 3 });
      expect(await create({ employee_id: 1, day_of_week: 3 })).toEqual({ id: 1, day_of_week: 3 });
    });

    it("throws for day_of_week < 0", () => {
      expect(() => create({ day_of_week: -1 })).toThrow("day_of_week must be between 0 and 6");
    });

    it("throws for day_of_week > 6", () => {
      expect(() => create({ day_of_week: 7 })).toThrow("day_of_week must be between 0 and 6");
    });

    it("throws for null day_of_week", () => {
      expect(() => create({ employee_id: 1 })).toThrow("day_of_week must be between 0 and 6");
    });
  });

  describe("update", () => {
    it("delegates", async () => {
      employeeRestDayModel.update.mockResolvedValue({ id: 1, day_of_week: 2 });
      expect(await update(1, { day_of_week: 2 })).toEqual({ id: 1, day_of_week: 2 });
    });
  });

  describe("remove / removeByEmployeeId", () => {
    it("delegates remove", async () => {
      employeeRestDayModel.remove.mockResolvedValue({ id: 1 });
      expect(await remove(1)).toEqual({ id: 1 });
    });

    it("delegates removeByEmployeeId", async () => {
      employeeRestDayModel.removeByEmployeeId.mockResolvedValue({});
      expect(await removeByEmployeeId(1)).toEqual({});
    });
  });
});
