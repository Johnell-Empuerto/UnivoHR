const service = require("../services/payRules.service");
const audit = require("../services/audit.service");
const logger = require("../utils/logger");

// PAY RULES

// GET ALL PAY RULES
const getAllPayRules = async (req, res, next) => {
  try {
    const data = await service.getAllPayRules();
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Error fetching pay rules");
    next(error);
  }
};

// GET SINGLE PAY RULE
const getPayRuleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await service.getPayRuleById(id);
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Error fetching pay rule");

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Pay rule not found" });
    }

    next(error);
  }
};

// CREATE PAY RULE
const createPayRule = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "Error creating pay rule");

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Day type and multiplier are required",
      });
    }

    next(error);
  }
};

// UPDATE PAY RULE
const updatePayRule = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "Error updating pay rule");

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Pay rule not found" });
    }

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({ error: "Invalid input" });
    }

    next(error);
  }
};

// DELETE PAY RULE
const deletePayRule = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "Error deleting pay rule");

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

    next(error);
  }
};

// ==============================
// CALENDAR DAYS
// ==============================

// GET CALENDAR DAYS
const getCalendarDays = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const data = await service.getCalendarDays(start_date, end_date);
    res.json(data);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "Error fetching calendar days");

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    next(error);
  }
};

// UPSERT CALENDAR DAY
const upsertCalendarDay = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "Error saving calendar day");

    if (error.message === "VALIDATION_ERROR") {
      return res.status(400).json({
        error: "Date and day type are required",
      });
    }

    next(error);
  }
};

// DELETE CALENDAR DAY
const deleteCalendarDay = async (req, res, next) => {
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
    logger.error({ err: error, correlationId: req.correlationId }, "Error deleting calendar day");

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Calendar day not found" });
    }

    next(error);
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
