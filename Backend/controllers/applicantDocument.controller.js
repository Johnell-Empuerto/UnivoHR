const applicantDocumentService = require("../services/applicantDocument.service");
const audit = require("../services/audit.service");

const getByApplicantId = async (req, res, next) => {
  try {
    const documents = await applicantDocumentService.getByApplicantId(req.params.applicantId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res) => {
  try {
    const doc = await applicantDocumentService.create({ ...req.body, applicant_id: req.params.applicantId });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "applicant_documents",
      record_id: doc.id,
      new_values: { applicant_id: doc.applicant_id, document_type: doc.document_type, file_name: doc.file_name },
      description: `Document uploaded for applicant #${doc.applicant_id}: ${doc.document_type}`,
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const doc = await applicantDocumentService.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "applicant_documents",
      record_id: doc.id,
      new_values: { document_type: doc.document_type, file_name: doc.file_name },
      description: `Document deleted: ${doc.document_type}`,
    });
    res.json({ message: "Document deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getByApplicantId,
  create,
  remove,
};
