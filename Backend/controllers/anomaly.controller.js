const anomalyService = require("../services/anomaly.service");
const anomalyModel = require("../models/anomaly.model");
const { getUserBranchIds } = require("../utils/branchAccess");
const auditService = require("../services/audit.service");
const logger = require("../utils/logger");

const getAnomalies = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      status,
      severity,
      branch_id,
      employee_id,
      anomaly_type,
      source_module,
      date_from,
      date_to,
    } = req.query;

    let allowedBranchIds = null;
    if (req.user.role !== "ADMIN") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.status(403).json({ message: "No branch access" });
      }
    }

    const result = await anomalyModel.getAnomalies({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status,
      severity,
      branch_id,
      employee_id,
      anomaly_type,
      source_module,
      date_from,
      date_to,
      allowedBranchIds,
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] getAnomalies error");
    next(error);
  }
};

const getAnomalySummary = async (req, res, next) => {
  try {
    let allowedBranchIds = null;
    if (req.user.role !== "ADMIN") {
      allowedBranchIds = await getUserBranchIds(req.user.id);
      if (allowedBranchIds.length === 0) {
        return res.json({
          open_count: 0,
          high_severity_count: 0,
          today_detected_count: 0,
          resolved_count: 0,
        });
      }
    }

    const summary = await anomalyModel.getAnomalySummary({ allowedBranchIds });
    res.json(summary);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] getAnomalySummary error");
    next(error);
  }
};

const getAnomalyById = async (req, res, next) => {
  try {
    const anomaly = await anomalyModel.getAnomalyById(req.params.id);
    if (!anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }
    res.json(anomaly);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] getAnomalyById error");
    next(error);
  }
};

const updateAnomalyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["REVIEWED", "RESOLVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be REVIEWED or RESOLVED" });
    }

    const existing = await anomalyModel.getAnomalyById(id);
    if (!existing) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    if (existing.status === status) {
      return res.status(400).json({ message: `Anomaly is already ${status}` });
    }

    const updated = await anomalyModel.updateAnomalyStatus(id, status, req.user.id);

    await auditService.auditLog(req, {
      action: `ANOMALY_${status}`,
      table_name: "anomaly_logs",
      record_id: id,
      employee_id: existing.employee_id,
      branch_id: existing.branch_id,
      old_values: { status: existing.status },
      new_values: { status },
      description: `Anomaly #${id} marked as ${status}`,
    });

    res.json(updated);
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] updateAnomalyStatus error");
    next(error);
  }
};

const runDailyScan = async (req, res, next) => {
  try {
    const results = await anomalyService.runDailyAnomalyScan(req);
    res.json({ message: "Daily anomaly scan completed", results });
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] runDailyScan error");
    next(error);
  }
};

const runWeeklyScan = async (req, res, next) => {
  try {
    const results = await anomalyService.runWeeklyAnomalyScan(req);
    res.json({ message: "Weekly anomaly scan completed", results });
  } catch (error) {
    logger.error({ err: error, correlationId: req.correlationId }, "[AnomalyController] runWeeklyScan error");
    next(error);
  }
};

module.exports = {
  getAnomalies,
  getAnomalySummary,
  getAnomalyById,
  updateAnomalyStatus,
  runDailyScan,
  runWeeklyScan,
};
