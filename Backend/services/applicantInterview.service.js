const applicantInterviewModel = require("../models/applicantInterview.model");
const applicantModel = require("../models/applicant.model");

const getByApplicantId = async (applicantId) => {
  const applicant = await applicantModel.getById(applicantId);
  if (!applicant) throw new Error("Applicant not found");
  return await applicantInterviewModel.getByApplicantId(applicantId);
};

const getById = async (id) => {
  const interview = await applicantInterviewModel.getById(id);
  if (!interview) throw new Error("Interview not found");
  return interview;
};

const create = async (data) => {
  if (!data.applicant_id) throw new Error("Applicant ID is required");
  if (!data.interview_date) throw new Error("Interview date is required");
  const applicant = await applicantModel.getById(data.applicant_id);
  if (!applicant) throw new Error("Applicant not found");

  const interview = await applicantInterviewModel.create(data);

  if (applicant.status === "NEW" || applicant.status === "SCREENING") {
    await applicantModel.updateStatus(data.applicant_id, "FOR_INTERVIEW");
  }

  return interview;
};

const update = async (id, data) => {
  const existing = await applicantInterviewModel.getById(id);
  if (!existing) throw new Error("Interview not found");

  const payload = {
    interview_date: data.interview_date ?? existing.interview_date,
    interviewer: data.interviewer ?? existing.interviewer,
    interview_type: data.interview_type ?? existing.interview_type,
    notes: data.notes ?? existing.notes,
    rating: data.rating ?? existing.rating,
    status: data.status ?? existing.status,
  };

  return await applicantInterviewModel.update(id, payload);
};

const remove = async (id) => {
  const existing = await applicantInterviewModel.getById(id);
  if (!existing) throw new Error("Interview not found");
  return await applicantInterviewModel.remove(id);
};

module.exports = {
  getByApplicantId,
  getById,
  create,
  update,
  remove,
};
