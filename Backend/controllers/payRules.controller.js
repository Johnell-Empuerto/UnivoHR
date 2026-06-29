const service = require("../services/payRules.service");
const audit = require("../services/audit.service");

// PAY RULES

// GET ALL PAY RULES
const getAllPayRules = async (req, res) => {
  try {
    const data = await service.getAllPayRules();
    res.json(data);
  } catch (error) {
    console.error("Error fetching pay rules:", error);
    res.status(500).json({ error: "Failed to fetch pay rules" });
  }
};

// GET SINGLE PAY RULE
const getPayRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await service.getPayRuleById(id);
    res.json(data);
  } catch (error) {
    console.error("Error fetching pay rule:", error);

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Pay rule not found" });
    }

    res.status(500).json({ error: "Failed to fetch pay rule" });
  }
};

// CREATE PAY RULE
const createPayRule = async (req, res) => {
  try {
    const data = await service.createPayRule(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "pay_rules",
      record_id: data.id,
      new_values: { day_type: data.day_type, multiplier: data.multiplier },
      description: `Pay rule created: ${data.day_type} (${data.multiplier}x)`,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating pay rule:", error);

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Day type and multiplier are required",
      });
    }

    res.status(500).json({ error: "Failed to create pay rule" });
  }
};

// UPDATE PAY RULE
const updatePayRule = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await service.updatePayRule(id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "pay_rules",
      record_id: Number(id),
      new_values: { day_type: data.day_type, multiplier: data.multiplier },
      description: `Pay rule updated: ${data.day_type} (${data.multiplier}x)`,
    });
    res.json(data);
  } catch (error) {
    console.error("Error updating pay rule:", error);

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Pay rule not found" });
    }

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({ error: "Invalid input" });
    }

    res.status(500).json({ error: "Failed to update pay rule" });
  }
};

// DELETE PAY RULE
const deletePayRule = async (req, res) => {
  try {
    const { id } = req.params;

    await service.deletePayRule(id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "pay_rules",
      record_id: Number(id),
      description: `Pay rule deleted (id: ${id})`,
    });
    res.json({ message: "Pay rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting pay rule:", error);

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Pay rule not found" });
    }

    if (error.statusCode === 409) {
      return res.status(409).json({
        error: error.message,
        dependencies: error.dependencies,
        recommendation: error.recommendation,
      });
    }

    res.status(500).json({ error: "Failed to delete pay rule" });
  }
};

// ==============================
// CALENDAR DAYS
// ==============================

// GET CALENDAR DAYS
const getCalendarDays = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const data = await service.getCalendarDays(start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error("Error fetching calendar days:", error);

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    res.status(500).json({ error: "Failed to fetch calendar days" });
  }
};

// UPSERT CALENDAR DAY
const upsertCalendarDay = async (req, res) => {
  try {
    const data = await service.upsertCalendarDay(req.body);
    audit.auditLog(req, {
      action: data.is_new ? "INSERT" : "UPDATE",
      table_name: "calendar_days",
      record_id: data.id,
      new_values: { date: data.date, day_type: data.day_type, description: data.description, branch_id: data.branch_id },
      description: `Calendar day ${data.is_new ? "created" : "updated"}: ${data.date}`,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error("Error saving calendar day:", error);

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Date and day type are required",
      });
    }

    res.status(500).json({ error: "Failed to save calendar day" });
  }
};

// DELETE CALENDAR DAY
const deleteCalendarDay = async (req, res) => {
  try {
    const { date } = req.params;

    await service.deleteCalendarDay(date);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "calendar_days",
      new_values: { date },
      description: `Calendar day deleted: ${date}`,
    });
    res.json({ message: "Calendar day deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar day:", error);

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Calendar day not found" });
    }

    res.status(500).json({ error: "Failed to delete calendar day" });
  }
};

module.exports = {
  getAllPayRules,
  getPayRuleById,
  createPayRule,
  updatePayRule,
  deletePayRule,
  getCalendarDays,
  upsertCalendarDay,
  deleteCalendarDay,
};
