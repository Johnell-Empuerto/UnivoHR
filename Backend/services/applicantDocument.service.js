const applicantDocumentModel = require("../models/applicantDocument.model");
const applicantModel = require("../models/applicant.model");

const getByApplicantId = async (applicantId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantDocumentModel.getByApplicantId(applicantId);
};

const getById = async (id) => {
  const doc = await applicantDocumentModel.getById(id);
  if (!doc) throw new Error("Document not found");
  return doc;
};

const create = async (data) => {
  if (!data.applicant_id) throw new Error("Applicant ID is required");
  if (!data.document_type) throw new Error("Document type is required");
  if (!data.file_url) throw new Error("File URL is required");
  const applicant = await applicantModel.getById(data.applicant_id);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantDocumentModel.create(data);
};

const remove = async (id) => {
  const doc = await applicantDocumentModel.getById(id);
  if (!doc) throw new Error("Document not found");
  return await applicantDocumentModel.remove(id);
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  remove,
};
