const rawLogsModel = require("../models/rawLogs.model");
const deviceModel = require("../models/device.model");
const deviceProcessingQueue = require("./deviceProcessing.queue");
const deviceProcessingService = require("./deviceProcessing.service");

const validateDevice = async (deviceId) => {
  const device = await deviceModel.getById(deviceId);
  if (!device) {
    const error = new Error("Device not found");
    error.status = 404;
    throw error;
  }
  if (device.status !== "ACTIVE") {
    const error = new Error("Device is not active");
    error.status = 400;
    throw error;
  }
  return device;
};

const pushLog = async (deviceId, payload) => {
  await validateDevice(deviceId);

  const rawLog = await rawLogsModel.insertLog({
    employee_code: null,
    timestamp: new Date().toISOString(),
    device_id: deviceId,
    raw_payload: typeof payload === "object" ? JSON.stringify(payload) : String(payload),
    source: "API",
  });

  await deviceModel.updateLastConnected(deviceId);

  await deviceProcessingQueue.safeAddLog(rawLog.id, deviceProcessingService.processSingleLog);

  return rawLog;
};

const importFile = async (parsedRows, deviceId, batchId) => {
  const logs = parsedRows.map((row) => ({
    employee_code: row.employee_code || row.employeeCode || row.employee_id || row.employeeId || null,
    timestamp: row.timestamp || row.date_time || row.datetime || row.time || row.log_time || new Date().toISOString(),
    device_id: deviceId || null,
    raw_payload: JSON.stringify(row),
    source: "IMPORT",
  }));

  const inserted = await rawLogsModel.bulkInsert(logs);

  const ids = inserted.map(l => l.id);
  if (ids.length > 0) {
    await deviceProcessingQueue.safeAddBatch(ids, deviceProcessingService.processSingleLog);
  }

  return inserted;
};

const applyMappings = (rawPayload, mappings) => {
  const result = {};
  let payload;

  if (typeof rawPayload === "string") {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = { raw: rawPayload };
    }
  } else {
    payload = rawPayload || {};
  }

  for (const mapping of mappings) {
    if (!mapping.active) continue;
    const value = payload[mapping.field_source];
    if (value !== undefined && value !== null) {
      result[mapping.field_target] = String(value);
    }
  }

  return result;
};

module.exports = { validateDevice, pushLog, importFile, applyMappings };
