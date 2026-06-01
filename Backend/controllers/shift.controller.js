const shiftService = require("../services/shift.service");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const data = await shiftService.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await shiftService.getById(req.params.id);
    if (!data) return res.status(404).json({ message: "Shift not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = await shiftService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "shift_schedules",
      record_id: data.id,
      new_values: { name: data.name, type: data.type, start_time: data.start_time, end_time: data.end_time },
      description: `Shift schedule "${data.name}" created`,
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("shift_schedules", req.params.id);
    const data = await shiftService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Shift not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "shift_schedules",
      record_id: data.id,
      old_values: oldValues ? { name: oldValues.name, type: oldValues.type, start_time: oldValues.start_time, end_time: oldValues.end_time } : null,
      new_values: { name: data.name, type: data.type, start_time: data.start_time, end_time: data.end_time },
      description: `Shift schedule "${data.name}" updated`,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("shift_schedules", req.params.id);
    const data = await shiftService.remove(req.params.id);
    if (!data) return res.status(404).json({ message: "Shift not found" });
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "shift_schedules",
      record_id: Number(req.params.id),
      old_values: oldValues ? { name: oldValues.name, type: oldValues.type } : null,
      description: `Shift schedule "${data.name}" deleted`,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveShifts = async (req, res) => {
  try {
    const data = await shiftService.getActiveShifts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeShiftForDate = async (req, res) => {
  try {
    const { employeeId, date } = req.params;
    const data = await shiftService.getEmployeeShiftForDate(employeeId, date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignShift = async (req, res) => {
  try {
    const { employee_id, shift_id, effective_date, end_date } = req.body;
    if (!employee_id || !shift_id || !effective_date) {
      return res.status(400).json({ message: "employee_id, shift_id, and effective_date are required" });
    }
    const data = await shiftService.assignShift(employee_id, shift_id, effective_date, end_date);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_shift_assignments",
      record_id: data.id,
      employee_id,
      new_values: { employee_id, shift_id, effective_date, end_date },
      description: `Employee ${employee_id} assigned to shift ${shift_id}`,
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const data = await shiftService.getAssignments(req.params.employeeId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeAssignment = async (req, res) => {
  try {
    const data = await shiftService.removeAssignment(req.params.id);
    if (!data) return res.status(404).json({ message: "Assignment not found" });
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "employee_shift_assignments",
      record_id: Number(req.params.id),
      description: `Shift assignment ${req.params.id} removed`,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getActiveShifts,
  getEmployeeShiftForDate,
  assignShift,
  getAssignments,
  removeAssignment,
};
