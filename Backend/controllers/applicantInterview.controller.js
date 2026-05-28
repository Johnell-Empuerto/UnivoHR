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

const create = async (req, res) => {
  try {
    const interview = await applicantInterviewService.create({ ...req.body, applicant_id: req.params.applicantId });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_interviews",
      record_id: interview.id,
      new_values: { applicant_id: interview.applicant_id, interview_type: interview.interview_type, interview_date: interview.interview_date, status: interview.status },
      description: `Interview scheduled for applicant #${interview.applicant_id}`,
    });
    res.status(201).json(interview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const interview = await applicantInterviewService.update(req.params.id, req.body);
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "applicant_interviews",
      record_id: interview.id,
      new_values: { status: interview.status, rating: interview.rating, notes: interview.notes },
      description: `Interview #${interview.id} updated`,
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
  create,
  update,
  remove,
};
