const shiftModel = require("../models/shift.model");
const rotationGroupModel = require("../models/rotationGroup.model");
const rotationPatternModel = require("../models/rotationPattern.model");
const rotationGroupAssignmentModel = require("../models/rotationGroupAssignment.model");

const getGroups = async () => rotationGroupModel.getAll();
const getGroupById = async (id) => rotationGroupModel.getById(id);
const createGroup = async (data) => rotationGroupModel.create(data);
const updateGroup = async (id, data) => rotationGroupModel.update(id, data);
const deleteGroup = async (id) => rotationGroupModel.remove(id);
const getGroupMembers = async (groupId) => rotationGroupModel.getMembers(groupId);
const getEmployeeAssignments = async (employeeId) => rotationGroupModel.getEmployeeAssignments(employeeId);
const assignEmployeeToGroup = async (employeeId, groupId, effectiveDate) =>
  rotationGroupModel.assignEmployeeToGroup(employeeId, groupId, effectiveDate);
const removeEmployeeFromGroup = async (employeeId, effectiveDate) =>
  rotationGroupModel.removeEmployeeFromGroup(employeeId, effectiveDate);

const getPatterns = async () => rotationPatternModel.getAll();
const getPatternById = async (id) => rotationPatternModel.getById(id);
const createPattern = async (data) => rotationPatternModel.create(data);
const updatePattern = async (id, data) => rotationPatternModel.update(id, data);
const deletePattern = async (id) => rotationPatternModel.remove(id);

const getAssignments = async () => rotationGroupAssignmentModel.getAll();
const createAssignment = async (data) => rotationGroupAssignmentModel.create(data);
const deleteAssignment = async (id) => rotationGroupAssignmentModel.remove(id);

const resolveEmployeeShift = async (employeeId, date) => {
  const directShift = await shiftModel.getEmployeeShiftForDate(employeeId, date);
  if (directShift) return directShift;

  const empGroup = await rotationGroupModel.getEmployeeGroupAssignment(employeeId, date);
  if (!empGroup) return null;

  const assignment = await rotationGroupAssignmentModel.getEffectiveAssignment(empGroup.rotation_group_id, date);
  if (!assignment) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const dateStr = new Date(date).toLocaleDateString("en-CA");
  const target = new Date(dateStr);
  const effDate = new Date(assignment.effective_date).toLocaleDateString("en-CA");
  const effective = new Date(effDate);
  const daysSinceStart = Math.floor((target - effective) / msPerDay);
  const dayOffset = ((daysSinceStart % assignment.cycle_days) + assignment.cycle_days) % assignment.cycle_days;

  const step = await rotationPatternModel.getStep(assignment.pattern_id, dayOffset);
  if (!step || step.is_rest_day) return null;

  return shiftModel.getById(step.shift_id);
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  getEmployeeAssignments,
  assignEmployeeToGroup,
  removeEmployeeFromGroup,
  getPatterns,
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  getAssignments,
  createAssignment,
  deleteAssignment,
  resolveEmployeeShift,
};
