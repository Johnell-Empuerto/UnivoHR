const service = require("../services/kpiEvaluation.service");

const assign = async (req, res) => {
  try {
    const result = await service.assign({ ...req.body, created_by: req.user?.id });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await service.getById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getMyEvaluations = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const { status = "" } = req.query;
    const result = await service.getMyEvaluations(employeeId, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const evaluatorId = req.user?.employee_id;
    if (!evaluatorId) return res.status(400).json({ message: "Employee ID not found" });
    const { status = "", page = 1, limit = 10 } = req.query;
    const result = await service.getMyAssignments(evaluatorId, status, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHrView = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 10 } = req.query;
    const result = await service.getHrView(search, status, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveScores = async (req, res) => {
  try {
    const evaluatorId = req.user?.employee_id;
    if (!evaluatorId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.saveScores(req.params.id, evaluatorId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const submit = async (req, res) => {
  try {
    const evaluatorId = req.user?.employee_id;
    if (!evaluatorId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.submit(req.params.id, evaluatorId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const saveSelfEvaluation = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.saveSelfEvaluation(req.params.id, employeeId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const hrApprove = async (req, res) => {
  try {
    const result = await service.hrApprove(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const hrReject = async (req, res) => {
  try {
    const result = await service.hrReject(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 10 } = req.query;
    const eid = employee_id || req.user?.employee_id;
    if (!eid) return res.status(400).json({ message: "Employee ID not found" });
    const result = await service.getHistory(eid, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingCount = async (req, res) => {
  try {
    const evaluatorId = req.user?.employee_id;
    if (!evaluatorId) return res.status(400).json({ message: "Employee ID not found" });
    const count = await service.getPendingCount(evaluatorId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkAssign = async (req, res) => {
  try {
    const result = await service.bulkAssign(req.body, req.user?.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  assign, getById, getMyEvaluations, getMyAssignments, getHrView,
  saveScores, submit, saveSelfEvaluation, hrApprove, hrReject,
  getHistory, getPendingCount, bulkAssign,
};
