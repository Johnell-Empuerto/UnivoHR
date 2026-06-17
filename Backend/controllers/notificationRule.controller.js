const notificationRuleService = require("../services/notificationRule.service");

const getAll = async (req, res) => {
  try {
    const rules = await notificationRuleService.getAllRules();
    return res.json({ data: rules, count: rules.length });
  } catch (err) {
    console.error("Error fetching notification rules:", err.message);
    return res.status(500).json({ message: "Failed to fetch notification rules" });
  }
};

const getByKey = async (req, res) => {
  try {
    const rule = await notificationRuleService.getRuleByKey(req.params.ruleKey);
    if (!rule) {
      return res.status(404).json({ message: "Notification rule not found" });
    }
    return res.json(rule);
  } catch (err) {
    console.error("Error fetching notification rule:", err.message);
    return res.status(500).json({ message: "Failed to fetch notification rule" });
  }
};

const getByModule = async (req, res) => {
  try {
    const rules = await notificationRuleService.getRulesByModule(req.params.module);
    return res.json({ data: rules, count: rules.length });
  } catch (err) {
    console.error("Error fetching rules by module:", err.message);
    return res.status(500).json({ message: "Failed to fetch rules by module" });
  }
};

const update = async (req, res) => {
  try {
    const rule = await notificationRuleService.updateRule(req.params.ruleKey, req.body);
    if (!rule) {
      return res.status(404).json({ message: "Notification rule not found" });
    }
    return res.json({ message: "Notification rule updated", data: rule });
  } catch (err) {
    console.error("Error updating notification rule:", err.message);
    return res.status(500).json({ message: "Failed to update notification rule" });
  }
};

const toggle = async (req, res) => {
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
    console.error("Error toggling notification rule:", err.message);
    return res.status(500).json({ message: err.message || "Failed to toggle notification rule" });
  }
};

module.exports = {
  getAll,
  getByKey,
  getByModule,
  update,
  toggle,
};
