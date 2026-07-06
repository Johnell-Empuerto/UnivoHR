jest.mock("../models/shift.model", () => ({
  getEmployeeShiftForDate: jest.fn(),
  getById: jest.fn(),
}));
jest.mock("../models/rotationGroup.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getMembers: jest.fn(),
  getEmployeeAssignments: jest.fn(),
  assignEmployeeToGroup: jest.fn(),
  updateEmployeeAssignment: jest.fn(),
  removeEmployeeFromGroup: jest.fn(),
  getEmployeeGroupAssignment: jest.fn(),
}));
jest.mock("../models/rotationPattern.model", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStep: jest.fn(),
}));
jest.mock("../models/rotationGroupAssignment.model", () => ({
  getById: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getEffectiveAssignment: jest.fn(),
}));

const shiftModel = require("../models/shift.model");
const rotationGroupModel = require("../models/rotationGroup.model");
const rotationPatternModel = require("../models/rotationPattern.model");
const rotationGroupAssignmentModel = require("../models/rotationGroupAssignment.model");
const {
  getGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  getGroupMembers, getEmployeeAssignments, assignEmployeeToGroup,
  updateEmployeeAssignment, removeEmployeeFromGroup,
  getPatterns, getPatternById, createPattern, updatePattern, deletePattern,
  getAssignmentById, getAssignments, createAssignment, updateAssignment, deleteAssignment,
  resolveEmployeeShift,
} = require("../services/rotation.service");

describe("rotation.service", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("getGroups", () => {
    it("returns all groups", async () => {
      rotationGroupModel.getAll.mockResolvedValue([{ id: 1 }]);
      expect(await getGroups()).toHaveLength(1);
    });
  });

  describe("getGroupById", () => {
    it("returns group by id", async () => {
      rotationGroupModel.getById.mockResolvedValue({ id: 1 });
      expect(await getGroupById(1)).toEqual({ id: 1 });
    });
  });

  describe("createGroup", () => {
    it("creates group", async () => {
      rotationGroupModel.create.mockResolvedValue({ id: 1, name: "Group A" });
      expect(await createGroup({ name: "Group A" })).toEqual({ id: 1, name: "Group A" });
    });
  });

  describe("updateGroup", () => {
    it("updates group", async () => {
      rotationGroupModel.update.mockResolvedValue({ id: 1, name: "Updated" });
      expect(await updateGroup(1, { name: "Updated" })).toEqual({ id: 1, name: "Updated" });
    });
  });

  describe("deleteGroup", () => {
    it("deletes group", async () => {
      await expect(deleteGroup(1)).resolves.toBeUndefined();
      expect(rotationGroupModel.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("getGroupMembers", () => {
    it("returns members", async () => {
      rotationGroupModel.getMembers.mockResolvedValue([{ employee_id: 1 }]);
      expect(await getGroupMembers(1)).toHaveLength(1);
    });
  });

  describe("getEmployeeAssignments", () => {
    it("returns employee assignments", async () => {
      rotationGroupModel.getEmployeeAssignments.mockResolvedValue([{ id: 1 }]);
      expect(await getEmployeeAssignments(1)).toHaveLength(1);
    });
  });

  describe("assignEmployeeToGroup", () => {
    it("assigns employee", async () => {
      rotationGroupModel.assignEmployeeToGroup.mockResolvedValue({ id: 1 });
      expect(await assignEmployeeToGroup(1, 2, "2026-01-01")).toEqual({ id: 1 });
    });
  });

  describe("updateEmployeeAssignment", () => {
    it("updates assignment", async () => {
      rotationGroupModel.updateEmployeeAssignment.mockResolvedValue({ id: 1 });
      expect(await updateEmployeeAssignment(1, {})).toEqual({ id: 1 });
    });
  });

  describe("removeEmployeeFromGroup", () => {
    it("removes employee from group", async () => {
      await expect(removeEmployeeFromGroup(1, "2026-01-01")).resolves.toBeUndefined();
      expect(rotationGroupModel.removeEmployeeFromGroup).toHaveBeenCalledWith(1, "2026-01-01");
    });
  });

  describe("getPatterns", () => {
    it("returns patterns", async () => {
      rotationPatternModel.getAll.mockResolvedValue([{ id: 1 }]);
      expect(await getPatterns()).toHaveLength(1);
    });
  });

  describe("getPatternById", () => {
    it("returns pattern by id", async () => {
      rotationPatternModel.getById.mockResolvedValue({ id: 1 });
      expect(await getPatternById(1)).toEqual({ id: 1 });
    });
  });

  describe("createPattern", () => {
    it("creates pattern", async () => {
      rotationPatternModel.create.mockResolvedValue({ id: 1 });
      expect(await createPattern({ name: "Pattern A" })).toEqual({ id: 1 });
    });
  });

  describe("updatePattern", () => {
    it("updates pattern", async () => {
      rotationPatternModel.update.mockResolvedValue({ id: 1 });
      expect(await updatePattern(1, {})).toEqual({ id: 1 });
    });
  });

  describe("deletePattern", () => {
    it("deletes pattern", async () => {
      await expect(deletePattern(1)).resolves.toBeUndefined();
      expect(rotationPatternModel.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("getAssignmentById", () => {
    it("returns assignment by id", async () => {
      rotationGroupAssignmentModel.getById.mockResolvedValue({ id: 1 });
      expect(await getAssignmentById(1)).toEqual({ id: 1 });
    });
  });

  describe("getAssignments", () => {
    it("returns all assignments", async () => {
      rotationGroupAssignmentModel.getAll.mockResolvedValue([{ id: 1 }]);
      expect(await getAssignments()).toHaveLength(1);
    });
  });

  describe("createAssignment", () => {
    it("creates assignment", async () => {
      rotationGroupAssignmentModel.create.mockResolvedValue({ id: 1 });
      expect(await createAssignment({})).toEqual({ id: 1 });
    });
  });

  describe("updateAssignment", () => {
    it("updates assignment", async () => {
      rotationGroupAssignmentModel.update.mockResolvedValue({ id: 1 });
      expect(await updateAssignment(1, {})).toEqual({ id: 1 });
    });
  });

  describe("deleteAssignment", () => {
    it("deletes assignment", async () => {
      await expect(deleteAssignment(1)).resolves.toBeUndefined();
      expect(rotationGroupAssignmentModel.remove).toHaveBeenCalledWith(1);
    });
  });

  describe("resolveEmployeeShift", () => {
    it("returns direct shift when found", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue({ id: 1, name: "Morning" });
      const result = await resolveEmployeeShift(1, "2026-01-01");
      expect(result).toEqual({ id: 1, name: "Morning" });
    });

    it("returns null when no direct shift and no group", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue(null);
      rotationGroupModel.getEmployeeGroupAssignment.mockResolvedValue(null);
      const result = await resolveEmployeeShift(1, "2026-01-01");
      expect(result).toBeNull();
    });

    it("returns null when group has no assignment", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue(null);
      rotationGroupModel.getEmployeeGroupAssignment.mockResolvedValue({ rotation_group_id: 1 });
      rotationGroupAssignmentModel.getEffectiveAssignment.mockResolvedValue(null);
      const result = await resolveEmployeeShift(1, "2026-01-01");
      expect(result).toBeNull();
    });

    it("returns shift from rotation pattern step", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue(null);
      rotationGroupModel.getEmployeeGroupAssignment.mockResolvedValue({ rotation_group_id: 1 });
      rotationGroupAssignmentModel.getEffectiveAssignment.mockResolvedValue({
        pattern_id: 1, effective_date: "2026-01-01", cycle_days: 3,
      });
      rotationPatternModel.getStep.mockResolvedValue({ shift_id: 10, is_rest_day: false });
      shiftModel.getById.mockResolvedValue({ id: 10, name: "Morning" });
      const result = await resolveEmployeeShift(1, "2026-01-01");
      expect(result).toEqual({ id: 10, name: "Morning" });
    });

    it("returns null when step is rest day", async () => {
      shiftModel.getEmployeeShiftForDate.mockResolvedValue(null);
      rotationGroupModel.getEmployeeGroupAssignment.mockResolvedValue({ rotation_group_id: 1 });
      rotationGroupAssignmentModel.getEffectiveAssignment.mockResolvedValue({
        pattern_id: 1, effective_date: "2026-01-01", cycle_days: 3,
      });
      rotationPatternModel.getStep.mockResolvedValue({ shift_id: 10, is_rest_day: true });
      const result = await resolveEmployeeShift(1, "2026-01-02");
      expect(result).toBeNull();
    });
  });
});
