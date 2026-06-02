const payrollRuleService = require("../services/payrollRule.service");

const getAll = async (req, res) => {
  try {
    const rows = await payrollRuleService.getAll();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByKey = async (req, res) => {
  try {
    const row = await payrollRuleService.getByKey(req.params.key);
    if (!row) return res.status(404).json({ message: "Payroll rule not found" });
    res.json(row);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { rule_value } = req.body;
    if (rule_value === undefined || rule_value === null) {
      return res.status(400).json({ message: "rule_value is required" });
    }
    const row = await payrollRuleService.update(req.params.key, rule_value);
    if (!row) return res.status(404).json({ message: "Payroll rule not found" });
    res.json(row);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getAll, getByKey, update };
