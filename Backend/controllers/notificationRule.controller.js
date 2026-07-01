const notificationRuleService = require("../services/notificationRule.service");
const logger = require("../utils/logger");

const getAll = async (req, res, next) => {
  try {
    const rules = await notificationRuleService.getAllRules();
    return res.json({ data: rules, count: rules.length });
  } catch (err) {
    logger.error({ err, correlationId: req.correlationId }, "Error fetching notification rules");
    return next(err);
  }
};

const getByKey = async (req, res, next) => {
  try {
    const rule = await notificationRuleService.getRuleByKey(req.params.ruleKey);
    if (!rule) {
      return res.status(404).json({ message: "Notification rule not found" });
    }
    return res.json(rule);
  } catch (err) {
    logger.error({ err, correlationId: req.correlationId }, "Error fetching notification rule");
    return next(err);
  }
};

const getByModule = async (req, res, next) => {
  try {
    const rules = await notificationRuleService.getRulesByModule(req.params.module);
    return res.json({ data: rules, count: rules.length });
  } catch (err) {
    logger.error({ err, correlationId: req.correlationId }, "Error fetching rules by module");
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const rule = await notificationRuleService.updateRule(req.params.ruleKey, req.body);
    if (!rule) {
      return res.status(404).json({ message: "Notification rule not found" });
    }
    return res.json({ message: "Notification rule updated", data: rule });
  } catch (err) {
    logger.error({ err, correlationId: req.correlationId }, "Error updating notification rule");
    return next(err);
  }
};

const toggle = async (req, res, next) => {
  try {
    const { field } = req.query;
    const rule = await notificationRuleService.toggleRule(
      req.params.ruleKey,
      field || "is_enabled"
    );
    if (!rule) {
      return res.status(404).json({ message: "Notification rule not found" });
    }
    return res.json({ message: "Notification rule toggled", data: rule });
  } catch (err) {
    logger.error({ err, correlationId: req.correlationId }, "Error toggling notification rule");
    return next(err);
  }
};

module.exports = {
  getAll,
  getByKey,
  getByModule,
  update,
  toggle,
};
