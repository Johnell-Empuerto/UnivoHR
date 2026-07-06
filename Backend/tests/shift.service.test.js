jest.mock("../config/db", () => ({ query: jest.fn() }));
jest.mock("../models/shift.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getActiveShifts: jest.fn(),
  getEmployeeShiftForDate: jest.fn(),
  assignShift: jest.fn(),
  getAssignments: jest.fn(),
  removeAssignment: jest.fn(),
}));

const pool = require("../config/db");
const shiftModel = require("../models/shift.model");
const {
  getAll, getById, create, update, remove,
  getActiveShifts, getEmployeeShiftForDate,
  assignShift, getAssignments, removeAssignment,
} = require("../services/shift.service");

describe("shift.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to shiftModel.getAll", async () => {
      shiftModel.getAll.mockResolvedValue([{ id: 1, name: "Morning" }]);
      const result = await getAll();
      expect(result).toEqual([{ id: 1, name: "Morning" }]);
    });
  });

  describe("getById", () => {
    it("delegates to shiftModel.getById", async () => {
      shiftModel.getById.mockResolvedValue({ id: 1 });
      const result = await getById(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe("create", () => {
    it("sets is_night_shift for NIGHT type", async () => {
      shiftModel.create.mockResolvedValue({ id: 1, type: "NIGHT" });

      await create({ name: "Night", type: "NIGHT" });

      expect(shiftModel.create).toHaveBeenCalledWith({
        name: "Night",
        type: "NIGHT",
        is_night_shift: true,
        is_flexitime: false,
      });
    });

    it("sets is_flexitime for FLEXITIME type", async () => {
      shiftModel.create.mockResolvedValue({ id: 2, type: "FLEXITIME" });

      await create({ name: "Flexi", type: "FLEXITIME" });

      expect(shiftModel.create).toHaveBeenCalledWith({
        name: "Flexi",
        type: "FLEXITIME",
        is_night_shift: false,
        is_flexitime: true,
      });
    });

    it("preserves explicit is_night_shift/is_flexitime when type is not NIGHT/FLEXITIME", async () => {
      shiftModel.create.mockResolvedValue({ id: 3, type: "REGULAR" });

      await create({ name: "Regular", type: "REGULAR", is_night_shift: true, is_flexitime: false });

      expect(shiftModel.create).toHaveBeenCalledWith({
        name: "Regular",
        type: "REGULAR",
        is_night_shift: true,
        is_flexitime: false,
      });
    });
  });

  describe("update", () => {
    it("enriches is_night_shift/is_flexitime when type is provided", async () => {
      shiftModel.update.mockResolvedValue({ id: 1 });

      await update(1, { name: "Updated", type: "NIGHT" });

      expect(shiftModel.update).toHaveBeenCalledWith(1, {
        name: "Updated",
        type: "NIGHT",
        is_night_shift: true,
        is_flexitime: false,
      });
    });

    it("passes data through unchanged when type is not provided", async () => {
      shiftModel.update.mockResolvedValue({ id: 1 });

      await update(1, { name: "Updated" });

      expect(shiftModel.update).toHaveBeenCalledWith(1, { name: "Updated" });
    });
  });

  describe("remove", () => {
    it("throws 404 when shift not found", async () => {
      shiftModel.getById.mockResolvedValue(null);

      await expect(remove(999)).rejects.toMatchObject({
        message: "Shift not found",
        statusCode: 404,
      });
    });

    it("throws 409 when shift has dependencies", async () => {
      shiftModel.getById.mockResolvedValue({ id: 1 });

      pool.query
        .mockResolvedValueOnce({ rows: [{ cnt: "1" }] }) // assignments
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] }) // attendance
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] }); // rotation

      await expect(remove(1)).rejects.toMatchObject({
        message: "This shift is currently being used and cannot be deleted.",
        statusCode: 409,
      });

      expect(shiftModel.remove).not.toHaveBeenCalled();
    });

    it("deletes shift when no dependencies exist", async () => {
      shiftModel.getById.mockResolvedValue({ id: 1 });

      pool.query
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] })
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] })
        .mockResolvedValueOnce({ rows: [{ cnt: "0" }] });

      shiftModel.remove.mockResolvedValue({ id: 1 });

      const result = await remove(1);
      expect(result).toEqual({ id: 1 });
      expect(shiftModel.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("delegation functions", () => {
    it("getActiveShifts delegates", async () => {
      shiftModel.getActiveShifts.mockResolvedValue([]);
      expect(await getActiveShifts()).toEqual([]);
    });

    it("getEmployeeShiftForDate delegates", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue(null);
      expect(await getEmployeeShiftForDate(1, "2026-07-06")).toBeNull();
    });

    it("assignShift delegates", async () => {
      shiftModel.assignShift.mockResolvedValue({ id: 1 });
      const result = await assignShift(1, 2, "2026-07-06", null);
      expect(result).toEqual({ id: 1 });
    });

    it("getAssignments delegates", async () => {
      shiftModel.getAssignments.mockResolvedValue([]);
      expect(await getAssignments(1)).toEqual([]);
    });

    it("removeAssignment delegates", async () => {
      shiftModel.removeAssignment.mockResolvedValue({ id: 1 });
      expect(await removeAssignment(1)).toEqual({ id: 1 });
    });
  });
});
