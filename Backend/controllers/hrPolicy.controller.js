const hrPolicyService = require("../services/hrPolicy.service");
const audit = require("../services/audit.service");
const { hasPermission } = require("../services/permission.service");

const getAll = async (req, res) => {
  try {
    const policies = await hrPolicyService.getAll(req.user);
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const policy = await hrPolicyService.getById(req.params.id);

    const canManage = await hasPermission(req.user, "hr_policies.manage");
    if (!canManage && !policy.is_active) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.json(policy);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const policy = await hrPolicyService.create(req.body, req.user);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "hr_policy_documents",
      record_id: policy.id,
      new_values: {
        title: policy.title,
        category: policy.category,
        is_active: policy.is_active,
      },
      description: `HR Policy created: ${policy.title} (${policy.category})`,
    });
    res.status(201).json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues(
      "hr_policy_documents",
      req.params.id,
    );
    const policy = await hrPolicyService.update(req.params.id, req.body, req.user);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "hr_policy_documents",
      record_id: policy.id,
      old_values: oldValues
        ? {
            title: oldValues.title,
            category: oldValues.category,
            is_active: oldValues.is_active,
          }
        : null,
      new_values: {
        title: policy.title,
        category: policy.category,
        is_active: policy.is_active,
      },
      description: `HR Policy updated: ${policy.title}`,
    });
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    const oldValues = await audit.fetchOldValues(
      "hr_policy_documents",
      req.params.id,
    );
    const policy = await hrPolicyService.setActive(
      req.params.id,
      is_active,
      req.user,
    );
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "hr_policy_documents",
      record_id: policy.id,
      old_values: oldValues ? { is_active: oldValues.is_active } : null,
      new_values: { is_active: policy.is_active },
      description: `HR Policy ${policy.title} ${is_active ? "activated" : "deactivated"}`,
    });
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues(
      "hr_policy_documents",
      req.params.id,
    );
    const policy = await hrPolicyService.remove(req.params.id, req.user);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "hr_policy_documents",
      record_id: policy.id,
      old_values: oldValues
        ? {
            title: oldValues.title,
            category: oldValues.category,
            is_active: oldValues.is_active,
          }
        : null,
      new_values: { is_active: policy.is_active },
      description: `HR Policy soft-deleted: ${policy.title}`,
    });
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  setActive,
  remove,
};
