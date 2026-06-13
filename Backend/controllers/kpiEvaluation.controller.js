const service = require("../services/kpiEvaluation.service");
const audit = require("../services/audit.service");
const { hasPermission } = require("../services/permission.service");

const assign = async (req, res) => {
  try {
    const result = await service.assign({ ...req.body, created_by: req.user?.id });
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_kpi_evaluations",
      record_id: result.id,
      employee_id: req.body.employee_id || null,
      new_values: { employee_id: result.employee_id, template_id: result.template_id, evaluator_id: result.evaluator_id, status: result.status },
      description: `KPI evaluation assigned: employee ${result.employee_id}, template ${result.template_id}`,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await service.getById(req.params.id);

    const currEmpId = Number(req.user?.employee_id);
    const isAdmin = req.user?.role === "ADMIN";
    const isEmployee = Number(result.employee_id) === currEmpId;
    const isEvaluator = Number(result.evaluator_id) === currEmpId;

    if (!isAdmin && !isEmployee && !isEvaluator) {
      const canManage = await hasPermission(req.user, "performance.evaluations.manage");
      if (!canManage) {
        return res.status(403).json({ message: "Access denied. You do not have permission to view this evaluation." });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getMyEvaluations = async (req, res) => {
  try {
    const employeeId = req.user?.employee_id;
    if (!employeeId) return res.status(400).json({ message: "Employee ID not found" });
    const { status = "", page = 1, limit = 10 } = req.query;
    const result = await service.getMyEvaluations(employeeId, status, Number(page), Number(limit));
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
    audit.auditLog(req, {
      action: "APPROVE",
      table_name: "employee_kpi_evaluations",
      record_id: Number(req.params.id),
      new_values: { status: "APPROVED" },
      description: `KPI evaluation ${req.params.id} approved`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const hrReject = async (req, res) => {
  try {
    const result = await service.hrReject(req.params.id, req.body);
    audit.auditLog(req, {
      action: "REJECT",
      table_name: "employee_kpi_evaluations",
      record_id: Number(req.params.id),
      new_values: { status: "REJECTED", remarks: req.body.remarks },
      description: `KPI evaluation ${req.params.id} rejected`,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { employee_id, page = 1, limit = 10, search = "" } = req.query;
    const eid = employee_id || req.user?.employee_id;
    const result = await service.getHistory(eid, Number(page), Number(limit), search);
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
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "employee_kpi_evaluations",
      new_values: { template_id: req.body.template_id, employee_ids: req.body.employee_ids, count: result.created_count },
      description: `Bulk KPI evaluation assigned: ${result.created_count} employees, template ${req.body.template_id}`,
    });
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
