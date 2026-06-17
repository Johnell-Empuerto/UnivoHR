const pool = require("../config/db");

const DEFAULTS = {
  is_enabled: true,
  in_app_enabled: true,
  email_enabled: false,
};

const getAllRules = async () => {
  const result = await pool.query(
    "SELECT * FROM notification_rules ORDER BY module, rule_key"
  );
  return result.rows;
};

const getRuleByKey = async (ruleKey) => {
  const result = await pool.query(
    "SELECT * FROM notification_rules WHERE rule_key = $1",
    [ruleKey]
  );
  return result.rows[0] || null;
};

const getRulesByModule = async (module) => {
  const result = await pool.query(
    "SELECT * FROM notification_rules WHERE module = $1 ORDER BY rule_key",
    [module]
  );
  return result.rows;
};

const updateRule = async (ruleKey, payload) => {
  const allowedFields = [
    "is_enabled",
    "in_app_enabled",
    "email_enabled",
    "threshold_count",
    "threshold_days",
    "threshold_hours",
    "threshold_percent",
    "frequency",
    "target_roles",
    "template_key",
    "description",
  ];

  const updates = [];
  const values = [];
  let idx = 1;

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(payload[field]);
    }
  }

  if (updates.length === 0) {
    return getRuleByKey(ruleKey);
  }

  values.push(ruleKey);
  const result = await pool.query(
    `UPDATE notification_rules SET ${updates.join(", ")} WHERE rule_key = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const toggleRule = async (ruleKey, field = "is_enabled") => {
  const allowed = ["is_enabled", "in_app_enabled", "email_enabled"];
  if (!allowed.includes(field)) {
    throw new Error(`Cannot toggle field: ${field}`);
  }

  const result = await pool.query(
    `UPDATE notification_rules SET ${field} = NOT ${field} WHERE rule_key = $1 RETURNING *`,
    [ruleKey]
  );
  return result.rows[0] || null;
};

const isRuleEnabled = async (ruleKey) => {
  const rule = await getRuleByKey(ruleKey);
  if (!rule) return DEFAULTS.is_enabled;
  return rule.is_enabled;
};

const canSendInApp = async (ruleKey) => {
  const rule = await getRuleByKey(ruleKey);
  if (!rule) return DEFAULTS.in_app_enabled;
  return rule.is_enabled && rule.in_app_enabled;
};

const canSendEmail = async (ruleKey) => {
  const rule = await getRuleByKey(ruleKey);
  if (!rule) return DEFAULTS.email_enabled;
  return rule.is_enabled && rule.email_enabled;
};

const getThresholds = async (ruleKey) => {
  const rule = await getRuleByKey(ruleKey);
  if (!rule) return null;
  return {
    threshold_count: rule.threshold_count,
    threshold_days: rule.threshold_days,
    threshold_hours: rule.threshold_hours,
    threshold_percent: rule.threshold_percent,
  };
};

module.exports = {
  getAllRules,
  getRuleByKey,
  getRulesByModule,
  updateRule,
  toggleRule,
  isRuleEnabled,
  canSendInApp,
  canSendEmail,
  getThresholds,
};
