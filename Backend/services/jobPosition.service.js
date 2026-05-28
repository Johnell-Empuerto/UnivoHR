const jobPositionModel = require("../models/jobPosition.model");

const getAll = async (page, limit, search, status) => {
  return await jobPositionModel.getAll(page, limit, search, status);
};

const getAllActive = async () => {
  return await jobPositionModel.getAllActive();
};

const getById = async (id) => {
  const position = await jobPositionModel.getById(id);
  if (!position) throw new Error("Job position not found");
  return position;
};

const create = async (data) => {
  if (!data.title || !data.title.trim()) throw new Error("Job title is required");
  return await jobPositionModel.create(data);
};

const update = async (id, data) => {
  const existing = await jobPositionModel.getById(id);
  if (!existing) throw new Error("Job position not found");
  return await jobPositionModel.update(id, data);
};

const remove = async (id) => {
  const existing = await jobPositionModel.getById(id);
  if (!existing) throw new Error("Job position not found");
  return await jobPositionModel.remove(id);
};

module.exports = {
  getAll,
  getAllActive,
  getById,
  create,
  update,
  remove,
};
