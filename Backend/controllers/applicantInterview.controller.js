const applicantInterviewService = require("../services/applicantInterview.service");
const audit = require("../services/audit.service");

const getByApplicantId = async (req, res) => {
  try {
    const interviews = await applicantInterviewService.getByApplicantId(req.params.applicantId);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyInterviews = async (req, res) => {
  try {
    const interviews = await applicantInterviewService.getMyInterviews(req.user.id);
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPossibleInterviewers = async (req, res) => {
  try {
    const interviewers = await applicantInterviewService.getPossibleInterviewers();
    res.json(interviewers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const interview = await applicantInterviewService.create({ ...req.body, applicant_id: req.params.applicantId });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_interviews",
      record_id: interview.id,
      new_values: {
        applicant_id: interview.applicant_id,
        interview_type: interview.interview_type,
        interview_date: interview.interview_date,
        status: interview.status,
        interviewer_user_id: interview.interviewer_user_id,
      },
      description: `Interview scheduled for applicant #${interview.applicant_id}: ${interview.interview_type || "Interview"}`,
    });
    res.status(201).json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const oldValues = await audit.fetchOldValues("applicant_interviews", req.params.id);
    const interview = await applicantInterviewService.update(req.params.id, req.body);

    const changed = [];
    if (oldValues) {
      if (String(oldValues.interviewer_user_id || "") !== String(interview.interviewer_user_id || "")) {
        changed.push("interviewer reassigned");
      }
      if (oldValues.status !== interview.status) {
        changed.push(`status → ${interview.status}`);
      }
      if (String(oldValues.rating || "") !== String(interview.rating || "")) {
        changed.push("score updated");
      }
      if ((oldValues.recommendation || null) !== (interview.recommendation || null)) {
        changed.push(`recommendation → ${interview.recommendation}`);
      }
    }

    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_interviews",
      record_id: interview.id,
      old_values: oldValues ? {
        status: oldValues.status,
        rating: oldValues.rating,
        recommendation: oldValues.recommendation,
        interviewer_user_id: oldValues.interviewer_user_id,
      } : null,
      new_values: {
        status: interview.status,
        rating: interview.rating,
        recommendation: interview.recommendation,
        interviewer_user_id: interview.interviewer_user_id,
      },
      description: `Interview #${interview.id} updated: ${changed.join(", ") || "no changes"}`,
    });
    res.json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const interview = await applicantInterviewService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "applicant_interviews",
      record_id: interview.id,
      description: `Interview #${interview.id} deleted`,
    });
    res.json({ message: "Interview deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getByApplicantId,
  getMyInterviews,
  getPossibleInterviewers,
  create,
  update,
  remove,
};
