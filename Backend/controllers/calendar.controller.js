const calendarService = require("../services/calendar.service");
const audit = require("../services/audit.service");
const { getUserBranchIds } = require("../utils/branchAccess");

// GET ALL (no branch filter — all users see all events)
const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;
    const data = await calendarService.getCalendar(start, end);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ONE BY DATE (no branch filter — all users see all events)
const getByDate = async (req, res) => {
  try {
    const data = await calendarService.getByDate(req.params.date);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE (with branch validation)
const create = async (req, res) => {
  try {
    // 1. Validate branch permission FIRST
    if (req.user.role !== "ADMIN") {
      const branchNum = req.body.branch_id ? Number(req.body.branch_id) : null;
      if (!branchNum) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
      const assigned = await getUserBranchIds(req.user.id);
      if (!assigned.includes(branchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    // 2. Then duplicate check + insert
    const data = await calendarService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "calendar_days",
      record_id: data.id,
      branch_id: data.branch_id || null,
      new_values: { date: req.body.date, day_type: req.body.day_type, description: req.body.description, branch_id: data.branch_id || null },
      description: `Calendar day created: ${req.body.date} (${req.body.day_type})`,
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE (with branch validation)
const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);

      // 1a. Validate existing record's branch
      const existing = await calendarService.getById(id);
      if (!existing) {
        return res.status(404).json({ message: "Calendar record not found" });
      }
      const existingBranchNum = existing.branch_id ? Number(existing.branch_id) : null;
      if (!existingBranchNum || !assigned.includes(existingBranchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }

      // 1b. Validate new branch_id if changing branch
      const newBranchNum = req.body.branch_id !== undefined ? Number(req.body.branch_id) : null;
      if (newBranchNum && !assigned.includes(newBranchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    // 2. Then update
    const data = await calendarService.update(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "calendar_days",
      record_id: Number(id),
      branch_id: data.branch_id || null,
      new_values: { date: data.date, day_type: data.day_type, description: data.description, branch_id: data.branch_id || null },
      description: `Calendar day updated: ${data.date || id}`,
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE (with branch validation)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      const assigned = await getUserBranchIds(req.user.id);
      const existing = await calendarService.getById(id);
      if (!existing) {
        return res.status(404).json({ message: "Calendar record not found" });
      }
      const existingBranchNum = existing.branch_id ? Number(existing.branch_id) : null;
      if (!existingBranchNum || !assigned.includes(existingBranchNum)) {
        return res.status(403).json({ message: "You are not allowed to manage this branch." });
      }
    }

    const data = await calendarService.remove(id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "calendar_days",
      record_id: Number(id),
      description: `Calendar day deleted (id: ${id})`,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCalendar,
  getByDate,
  create,
  update,
  remove,
};
