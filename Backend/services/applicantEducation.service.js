const model = require("../models/applicantEducation.model");
const applicantModel = require("../models/applicant.model");

const getByApplicantId = async (applicantId) => {
  return await model.getAllByApplicantId(applicantId);
};

const create = async (data) => {
  const app = await applicantModel.getById(data.applicant_id);
  if (!app) throw new Error("Applicant not found");
  return await model.create(data);
};

const update = async (id, data) => {
  const existing = await model.getById(id);
  if (!existing) throw new Error("Education record not found");
  return await model.update(id, data);
};

const remove = async (id) => {
  const existing = await model.getById(id);
  if (!existing) throw new Error("Education record not found");
  await model.remove(id);
};

module.exports = { getByApplicantId, create, update, remove };
