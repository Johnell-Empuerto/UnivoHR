const payrollRuleModel = require("../models/payrollRule.model");

const getAll = () => payrollRuleModel.getAll();

const getByKey = (ruleKey) => payrollRuleModel.getByKey(ruleKey);

const update = (ruleKey, ruleValue) =>
  payrollRuleModel.update(ruleKey, ruleValue);

module.exports = { getAll, getByKey, update };
