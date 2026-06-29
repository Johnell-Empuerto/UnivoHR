const branchModel = require("../models/branch.model");

const TZ_VALIDATOR = (() => {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return null;
  }
})();

const isValidTimezone = (tz) => {
  if (!tz) return false;
  if (TZ_VALIDATOR) return TZ_VALIDATOR.includes(tz);
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const getAll = async () => branchModel.getAll();

const getActive = async () => branchModel.getActive();

const getById = async (id) => {
  const branch = await branchModel.getById(id);
  if (!branch) throw new Error("Branch not found");
  return branch;
};

const create = async (data) => {
  const { code, name, timezone } = data;
  if (!code || !code.trim()) throw new Error("Branch code is required");
  if (!name || !name.trim()) throw new Error("Branch name is required");

  const tz = timezone || "Asia/Manila";
  if (!isValidTimezone(tz)) throw new Error(`Invalid timezone: ${tz}`);

  const existing = await branchModel.getByCode(code.trim().toUpperCase());
  if (existing) throw new Error("Branch code already exists");

  return await branchModel.create({
    ...data,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    timezone: tz,
  });
};

const update = async (id, data) => {
  const existing = await branchModel.getById(id);
  if (!existing) throw new Error("Branch not found");

  const { code, timezone } = data;
  if (code) {
    const duplicate = await branchModel.getByCode(code.trim().toUpperCase());
    if (duplicate && duplicate.id !== parseInt(id))
      throw new Error("Branch code already exists");
  }

  const tz = timezone || existing.timezone || "Asia/Manila";
  if (!isValidTimezone(tz)) throw new Error(`Invalid timezone: ${tz}`);

  return await branchModel.update(id, {
    ...data,
    code: data.code ? data.code.trim().toUpperCase() : existing.code,
    name: data.name ? data.name.trim() : existing.name,
    timezone: tz,
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

const remove = async (id) => {
  const branch = await branchModel.removeIfUnused(id);
  if (!branch) throw new Error("Branch not found");
  return branch;
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  setActive,
  remove,
};
