const branchRestDayModel = require("../models/branchRestDay.model");

const getByBranchId = (branchId) =>
  branchRestDayModel.getByBranchId(branchId);

const getAllByBranchIds = (branchIds) =>
  branchRestDayModel.getAllByBranchIds(branchIds);

const getAll = () =>
  branchRestDayModel.getAll();

const create = (data) => {
  if (data.day_of_week == null || data.day_of_week < 0 || data.day_of_week > 6) {
    throw new Error("day_of_week must be between 0 and 6");
  }
  return branchRestDayModel.create(data);
};

const remove = (id) =>
  branchRestDayModel.remove(id);

const setActive = (id, isActive) =>
  branchRestDayModel.setActive(id, isActive);

module.exports = {
  getByBranchId,
  getAllByBranchIds,
  getAll,
  create,
  remove,
  setActive,
};
