const applicantInterviewModel = require("../models/applicantInterview.model");
const applicantModel = require("../models/applicant.model");
const notificationService = require("./notification.service");

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

  const applicantName = `${applicant.first_name} ${applicant.last_name}`;
  const dateStr = new Date(data.interview_date).toLocaleDateString();

  if (data.interviewer) {
    applicantModel.getUserIdsByEmployeeIds([data.interviewer]).then(users => {
      if (users.length > 0) {
        notificationService.notify({
          user_id: users[0].id,
          type: "RECRUITMENT",
          title: "Interview Scheduled",
          message: `You have an interview scheduled with ${applicantName} on ${dateStr}`,
          reference_id: data.applicant_id,
        }).catch(err => console.error("[RECRUITMENT] Notification error:", err));
      }
    });
  }

  applicantModel.getActiveHRUserIds().then(userIds => {
    if (userIds.length === 0) return;
    const promises = userIds.map(id =>
      notificationService.notify({
        user_id: id,
        type: "RECRUITMENT",
        title: "Interview Scheduled",
        message: `${applicantName} interview scheduled on ${dateStr}`,
        reference_id: data.applicant_id,
      })
    );
    Promise.all(promises).catch(err => console.error("[RECRUITMENT] Notification error:", err));
  });

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
