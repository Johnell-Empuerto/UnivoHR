const service = require("../services/applicantFamily.service");

const getByApplicantId = async (req, res, next) => {
  try {
    const result = await service.getByApplicantId(req.params.applicantId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.create({ ...req.body, applicant_id: Number(req.params.applicantId) });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const result = await service.update(Number(req.params.id), req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ message: "Family member deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getByApplicantId, create, update, remove };
