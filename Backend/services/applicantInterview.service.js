const applicantInterviewModel = require("../models/applicantInterview.model");
const applicantModel = require("../models/applicant.model");
const notificationService = require("./notification.service");

const VALID_RECOMMENDATIONS = ["PASSED", "FAILED", "FOR_REVIEW"];

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

const getMyInterviews = async (userId) => {
  return await applicantInterviewModel.getByUserId(userId);
};

const getSuggestedApplicantStage = (interviewType, recommendation) => {
  if (!recommendation) return null;
  if (recommendation === "FAILED") return "Fail";
  if (recommendation === "FOR_REVIEW") return null;
  if (recommendation !== "PASSED") return null;
  const map = {
    "Initial Interview": "Exam Interview",
    "Exam Interview": "Final Interview",
    "Final Interview": "Completed",
  };
  return map[interviewType] || null;
};

const getPossibleInterviewers = async () => {
  return await applicantInterviewModel.getPossibleInterviewers();
};

const notifyAssignedUser = async (applicant, interview) => {
  const applicantName = `${applicant.first_name} ${applicant.last_name}`;
  const dateStr = interview.interview_date
    ? new Date(interview.interview_date).toLocaleString()
    : "TBD";
  await notificationService.notify({
    user_id: interview.interviewer_user_id,
    type: "RECRUITMENT",
    title: "Interview Assignment",
    message: `You have been assigned to interview ${applicantName} for ${interview.interview_type || "Interview"} on ${dateStr}`,
    reference_id: applicant.id,
  }).catch(err => console.error("[RECRUITMENT] Notification error:", err));
};

const notifyHR = async (applicant, interview) => {
  const applicantName = `${applicant.first_name} ${applicant.last_name}`;
  applicantModel.getActiveHRUserIds().then(userIds => {
    if (userIds.length === 0) return;
    const promises = userIds.map(uid =>
      notificationService.notify({
        user_id: uid,
        type: "RECRUITMENT",
        title: "Interview Completed",
        message: `${applicantName} completed ${interview.interview_type || "Interview"}`,
        reference_id: applicant.id,
      })
    );
    Promise.all(promises).catch(err => console.error("[RECRUITMENT] Notification error:", err));
  });
};

const create = async (data) => {
  if (!data.applicant_id) throw new Error("Applicant ID is required");
  if (!data.interview_date) throw new Error("Interview date is required");

  if (data.rating !== undefined && data.rating !== null && data.rating !== "") {
    const r = parseFloat(data.rating);
    if (isNaN(r) || r < 0 || r > 10) throw new Error("Rating must be between 0 and 10");
  }

  if (data.recommendation && !VALID_RECOMMENDATIONS.includes(data.recommendation)) {
    throw new Error("Recommendation must be PASSED, FAILED, or FOR_REVIEW");
  }

  const applicant = await applicantModel.getById(data.applicant_id);
  if (!applicant) throw new Error("Applicant not found");

  const interview = await applicantInterviewModel.create(data);

  if (interview.interviewer_user_id) {
    notifyAssignedUser(applicant, interview);
  }

  const applicantName = `${applicant.first_name} ${applicant.last_name}`;
  const dateStr = new Date(data.interview_date).toLocaleDateString();
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

  if (data.rating !== undefined && data.rating !== null && data.rating !== "") {
    const r = parseFloat(data.rating);
    if (isNaN(r) || r < 0 || r > 10) throw new Error("Rating must be between 0 and 10");
  }

  if (data.recommendation && !VALID_RECOMMENDATIONS.includes(data.recommendation)) {
    throw new Error("Recommendation must be PASSED, FAILED, or FOR_REVIEW");
  }

  const effectiveRecommendation = data.recommendation !== undefined ? data.recommendation : existing.recommendation;
  const effectiveStatus = data.status !== undefined ? data.status : existing.status;

  let normalizedStatus = effectiveStatus;

  if (effectiveRecommendation && VALID_RECOMMENDATIONS.includes(effectiveRecommendation)) {
    if (effectiveStatus === "SCHEDULED") {
      normalizedStatus = "COMPLETED";
    }
  }

  const payload = {
    interview_date: data.interview_date ?? existing.interview_date,
    interviewer: data.interviewer ?? existing.interviewer,
    interview_type: data.interview_type ?? existing.interview_type,
    notes: data.notes ?? existing.notes,
    rating: data.rating ?? existing.rating,
    status: normalizedStatus,
    interviewer_user_id: data.interviewer_user_id !== undefined ? data.interviewer_user_id : existing.interviewer_user_id,
    recommendation: effectiveRecommendation,
  };

  const interview = await applicantInterviewModel.update(id, payload);

  const interviewerChanged = data.interviewer_user_id !== undefined
    && Number(data.interviewer_user_id) !== Number(existing.interviewer_user_id);

  if (interviewerChanged && interview.interviewer_user_id) {
    const applicant = await applicantModel.getById(interview.applicant_id);
    if (applicant) notifyAssignedUser(applicant, interview);
  }

  const becameCompleted = interview.status === "COMPLETED" && existing.status !== "COMPLETED";
  if (becameCompleted) {
    const applicant = await applicantModel.getById(interview.applicant_id);
    if (applicant) notifyHR(applicant, interview);
  }

  if (interview.recommendation === "FOR_REVIEW" && existing.recommendation !== "FOR_REVIEW") {
    const applicant = await applicantModel.getById(interview.applicant_id);
    if (applicant) {
      const applicantName = `${applicant.first_name} ${applicant.last_name}`;
      applicantModel.getActiveHRUserIds().then(userIds => {
        if (userIds.length === 0) return;
        const promises = userIds.map(uid =>
          notificationService.notify({
            user_id: uid,
            type: "RECRUITMENT",
            title: "Interview Needs Review",
            message: `${applicantName} interview (${interview.interview_type || "Interview"}) was marked for review.`,
            reference_id: applicant.id,
          })
        );
        Promise.all(promises).catch(err => console.error("[RECRUITMENT] FOR_REVIEW notification error:", err));
      });
    }
  }

  return interview;
};

const remove = async (id) => {
  const existing = await applicantInterviewModel.getById(id);
  if (!existing) throw new Error("Interview not found");
  return await applicantInterviewModel.remove(id);
};

module.exports = {
  getByApplicantId,
  getById,
  getMyInterviews,
  getPossibleInterviewers,
  getSuggestedApplicantStage,
  create,
  update,
  remove,
};
