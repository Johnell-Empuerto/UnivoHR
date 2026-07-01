const rotationService = require("../services/rotation.service");
const audit = require("../services/audit.service");

const getGroups = async (req, res, next) => {
  try {
    const data = await rotationService.getGroups();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const data = await rotationService.getGroupById(req.params.id);
    if (!data) return res.status(404).json({ message: "Rotation group not found" });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const data = await rotationService.createGroup(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "rotation_groups",
      record_id: data.id,
      new_values: { name: data.name, code: data.code, description: data.description },
      description: `Rotation group "${data.name}" created`,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("rotation_groups", req.params.id);
    const data = await rotationService.updateGroup(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Rotation group not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "rotation_groups",
      record_id: data.id,
      old_values: oldValues ? { name: oldValues.name, code: oldValues.code } : null,
      new_values: { name: data.name, code: data.code, description: data.description },
      description: `Rotation group "${data.name}" updated`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("rotation_groups", req.params.id);
    const data = await rotationService.deleteGroup(req.params.id);
    if (!data) return res.status(404).json({ message: "Rotation group not found" });
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "rotation_groups",
      record_id: Number(req.params.id),
      old_values: oldValues ? { name: oldValues.name } : null,
      description: `Rotation group "${data.name}" deleted`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getGroupMembers = async (req, res, next) => {
  try {
    const data = await rotationService.getGroupMembers(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const addGroupMembers = async (req, res, next) => {
  try {
    const { employee_ids, effective_date } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ message: "employee_ids array is required" });
    }
    const effDate = effective_date || new Date().toISOString().split("T")[0];
    const results = [];
    for (const empId of employee_ids) {
      const data = await rotationService.assignEmployeeToGroup(empId, Number(req.params.id), effDate);
      results.push(data);
    }
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_rotation_group_assignments",
      record_id: null,
      description: `${employee_ids.length} employee(s) assigned to rotation group ${req.params.id} effective ${effDate}`,
    });
    res.status(201).json({ success: true, count: employee_ids.length, assignments: results });
  } catch (error) {
    next(error);
  }
};

const getEmployeeAssignments = async (req, res, next) => {
  try {
    const data = await rotationService.getEmployeeAssignments(req.params.employeeId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const removeGroupMember = async (req, res, next) => {
  try {
    const { effective_date } = req.body;
    const effDate = effective_date || new Date().toISOString().split("T")[0];
    const data = await rotationService.removeEmployeeFromGroup(req.params.employeeId, effDate);
    if (!data) return res.status(404).json({ message: "No active group assignment found for employee" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_rotation_group_assignments",
      record_id: data.id,
      description: `Employee ${req.params.employeeId} removed from rotation group ${data.rotation_group_id} effective ${effDate}`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const updateEmployeeAssignment = async (req, res, next) => {
  try {
    const { employeeId, id } = req.params;
    const oldValues = await audit.fetchOldValues("employee_rotation_group_assignments", id);
    const data = await rotationService.updateEmployeeAssignment(id, req.body);
    if (!data) return res.status(404).json({ message: "Employee rotation assignment not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "employee_rotation_group_assignments",
      record_id: data.id,
      old_values: oldValues ? { rotation_group_id: oldValues.rotation_group_id, effective_date: oldValues.effective_date } : null,
      new_values: { rotation_group_id: data.rotation_group_id, effective_date: data.effective_date },
      description: `Employee ${employeeId} rotation assignment ${id} updated`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getPatterns = async (req, res, next) => {
  try {
    const data = await rotationService.getPatterns();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getPatternById = async (req, res, next) => {
  try {
    const data = await rotationService.getPatternById(req.params.id);
    if (!data) return res.status(404).json({ message: "Rotation pattern not found" });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const createPattern = async (req, res, next) => {
  try {
    const data = await rotationService.createPattern(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "rotation_patterns",
      record_id: data.id,
      new_values: { name: data.name, cycle_days: data.cycle_days },
      description: `Rotation pattern "${data.name}" created`,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updatePattern = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("rotation_patterns", req.params.id);
    const data = await rotationService.updatePattern(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Rotation pattern not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "rotation_patterns",
      record_id: data.id,
      old_values: oldValues ? { name: oldValues.name } : null,
      new_values: { name: data.name, cycle_days: data.cycle_days },
      description: `Rotation pattern "${data.name}" updated`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deletePattern = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("rotation_patterns", req.params.id);
    const data = await rotationService.deletePattern(req.params.id);
    if (!data) return res.status(404).json({ message: "Rotation pattern not found" });
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "rotation_patterns",
      record_id: Number(req.params.id),
      old_values: oldValues ? { name: oldValues.name } : null,
      description: `Rotation pattern "${data.name}" deleted`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const data = await rotationService.getAssignments();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { group_id, pattern_id, effective_date, end_date } = req.body;
    if (!group_id || !pattern_id || !effective_date) {
      return res.status(400).json({ message: "group_id, pattern_id, and effective_date are required" });
    }
    const data = await rotationService.createAssignment(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "rotation_group_assignments",
      record_id: data.id,
      new_values: { group_id, pattern_id, effective_date, end_date },
      description: `Rotation group ${group_id} assigned to pattern ${pattern_id}`,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const oldValues = await audit.fetchOldValues("rotation_group_assignments", req.params.id);
    const data = await rotationService.updateAssignment(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Assignment not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "rotation_group_assignments",
      record_id: data.id,
      old_values: oldValues ? { pattern_id: oldValues.pattern_id, effective_date: oldValues.effective_date, end_date: oldValues.end_date } : null,
      new_values: { pattern_id: data.pattern_id, effective_date: data.effective_date, end_date: data.end_date },
      description: `Rotation group assignment ${data.id} updated`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const data = await rotationService.deleteAssignment(req.params.id);
    if (!data) return res.status(404).json({ message: "Assignment not found" });
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "rotation_group_assignments",
      record_id: Number(req.params.id),
      description: `Rotation assignment ${req.params.id} removed`,
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const resolveEmployeeShift = async (req, res, next) => {
  try {
    const { employeeId, date } = req.params;
    const data = await rotationService.resolveEmployeeShift(employeeId, date);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  getEmployeeAssignments,
  addGroupMembers,
  removeGroupMember,
  updateEmployeeAssignment,
  getPatterns,
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  resolveEmployeeShift,
};
