const branchRestDayModel = require("../models/branchRestDay.model");

const getByBranchId = (branchId) =>
  branchRestDayModel.getByBranchId(branchId);

const getAllByBranchIds = (branchIds) =>
  branchRestDayModel.getAllByBranchIds(branchIds);

const getAll = () =>
  branchRestDayModel.getAll();

const create = (data) =>
  branchRestDayModel.create(data);

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
