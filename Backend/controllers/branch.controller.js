const branchService = require("../services/branch.service");
const { getUserBranchIds } = require("../utils/branchAccess");
const audit = require("../services/audit.service");

const getAll = async (req, res) => {
  try {
    const branches = await branchService.getAll();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActive = async (req, res) => {
  try {
    let branches = await branchService.getActive();

    // Non-ADMIN users only see assigned branches
    if (req.user && req.user.role !== "ADMIN") {
      const allowed = await getUserBranchIds(req.user.id);
      if (allowed.length > 0) {
        branches = branches.filter((b) => allowed.includes(b.id));
      } else {
        branches = [];
      }
    }

    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const branch = await branchService.getById(req.params.id);
    res.json(branch);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const branch = await branchService.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "branches",
      record_id: branch.id,
      branch_id: branch.id,
      new_values: { code: branch.code, name: branch.name, address: branch.address, city: branch.city, province: branch.province, phone: branch.phone, is_active: branch.is_active },
      description: `Branch created: ${branch.name} (${branch.code})`,
    });
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("branches", req.params.id);
    const branch = await branchService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "branches",
      record_id: branch.id,
      branch_id: branch.id,
      old_values: oldValues ? { code: oldValues.code, name: oldValues.name, address: oldValues.address, city: oldValues.city, province: oldValues.province, phone: oldValues.phone, is_active: oldValues.is_active } : null,
      new_values: { code: branch.code, name: branch.name, address: branch.address, city: branch.city, province: branch.province, phone: branch.phone, is_active: branch.is_active },
      description: `Branch updated: ${branch.name} (${branch.code})`,
    });
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setActive = async (req, res) => {
  try {
    const { is_active } = req.body;
    const oldValues = await audit.fetchOldValues("branches", req.params.id);
    const branch = await branchService.setActive(req.params.id, is_active);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "branches",
      record_id: branch.id,
      branch_id: branch.id,
      old_values: oldValues ? { is_active: oldValues.is_active } : null,
      new_values: { is_active: branch.is_active },
      description: `Branch ${branch.name} ${is_active ? "activated" : "deactivated"}`,
    });
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  setActive,
};
