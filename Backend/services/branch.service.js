const branchModel = require("../models/branch.model");

const getAll = async () => branchModel.getAll();

const getActive = async () => branchModel.getActive();

const getById = async (id) => {
  const branch = await branchModel.getById(id);
  if (!branch) throw new Error("Branch not found");
  return branch;
};

const create = async (data) => {
  const { code, name } = data;
  if (!code || !code.trim()) throw new Error("Branch code is required");
  if (!name || !name.trim()) throw new Error("Branch name is required");

  const existing = await branchModel.getByCode(code.trim().toUpperCase());
  if (existing) throw new Error("Branch code already exists");

  return await branchModel.create({
    ...data,
    code: code.trim().toUpperCase(),
    name: name.trim(),
  });
};

const update = async (id, data) => {
  const existing = await branchModel.getById(id);
  if (!existing) throw new Error("Branch not found");

  const { code } = data;
  if (code) {
    const duplicate = await branchModel.getByCode(code.trim().toUpperCase());
    if (duplicate && duplicate.id !== parseInt(id))
      throw new Error("Branch code already exists");
  }

  return await branchModel.update(id, {
    ...data,
    code: data.code ? data.code.trim().toUpperCase() : existing.code,
    name: data.name ? data.name.trim() : existing.name,
  });
};

const setActive = async (id, is_active) => {
  const branch = await branchModel.getById(id);
  if (!branch) throw new Error("Branch not found");

  if (!is_active) {
    const empCount = await branchModel.countEmployees(id);
    if (empCount > 0) {
      throw new Error(
        `Cannot deactivate branch: ${empCount} employee(s) are assigned to it`,
      );
    }
  }

  return await branchModel.setActive(id, is_active);
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  setActive,
};
