const deviceModel = require("../models/device.model");
const rawLogsModel = require("../models/rawLogs.model");
const mappingModel = require("../models/deviceLogMapping.model");
const employeeDeviceUserModel = require("../models/employeeDeviceUser.model");
const deviceIntegrationService = require("../services/deviceIntegration.service");
const deviceProcessingQueue = require("../services/deviceProcessing.queue");
const { generateDeviceKey, hashDeviceKey } = require("../utils/deviceKey");
const audit = require("../services/audit.service");
const { v4: uuidv4 } = require("uuid");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// ─── DEVICES ────────────────────────────────────────────────

const getDevices = async (req, res) => {
  try {
    const result = await deviceModel.getAll(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDevice = async (req, res) => {
  try {
    const device = await deviceModel.getById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDevice = async (req, res) => {
  try {
    const device = await deviceModel.create(req.body);
    audit.auditLog(req, {
      action: "INSERT",
      table_name: "devices",
      record_id: device.id,
      branch_id: device.branch_id,
      new_values: {
        name: device.name,
        type: device.type,
        serial_number: device.serial_number,
        location: device.location,
        status: device.status,
        branch_id: device.branch_id,
      },
      description: `Device created: ${device.name} (${device.serial_number || device.type})`,
    });
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDevice = async (req, res) => {
  try {
    const oldDevice = await deviceModel.getById(req.params.id);
    const device = await deviceModel.update(req.params.id, req.body);
    if (!device) return res.status(404).json({ message: "Device not found" });
    audit.auditLog(req, {
      action: "UPDATE",
      table_name: "devices",
      record_id: device.id,
      branch_id: device.branch_id,
      old_values: oldDevice ? {
        name: oldDevice.name,
        type: oldDevice.type,
        serial_number: oldDevice.serial_number,
        location: oldDevice.location,
        status: oldDevice.status,
        branch_id: oldDevice.branch_id,
      } : null,
      new_values: {
        name: device.name,
        type: device.type,
        serial_number: device.serial_number,
        location: device.location,
        status: device.status,
        branch_id: device.branch_id,
      },
      description: `Device updated: ${device.name}`,
    });
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDevice = async (req, res) => {
  try {
    const device = await deviceModel.getById(req.params.id);
    if (!device) return res.status(404).json({ message: "Device not found" });

    if (device.total_logs > 0) {
      return res.status(400).json({
        message: `Cannot delete "${device.name}" — it has ${device.total_logs} raw log(s). Set the device status to "INACTIVE" instead.`,
      });
    }

    await mappingModel.removeByDevice(req.params.id);
    await deviceModel.remove(req.params.id);
    audit.auditLog(req, {
      action: "DELETE",
      table_name: "devices",
      record_id: Number(req.params.id),
      branch_id: device.branch_id,
      old_values: {
        name: device.name,
        type: device.type,
        serial_number: device.serial_number,
        location: device.location,
      },
      description: `Device deleted: ${device.name}`,
    });
    res.json({ message: "Device deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DEVICE LOG MAPPINGS ────────────────────────────────────

const getMappings = async (req, res) => {
  try {
    const deviceId = req.query.device_id;
    const mappings = deviceId ? await mappingModel.getByDevice(parseInt(deviceId)) : await mappingModel.getAll();
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMapping = async (req, res) => {
  try {
    const mapping = await mappingModel.create(req.body);
    res.status(201).json(mapping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMapping = async (req, res) => {
  try {
    const mapping = await mappingModel.update(req.params.id, req.body);
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });
    res.json(mapping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMapping = async (req, res) => {
  try {
    await mappingModel.remove(req.params.id);
    res.json({ message: "Mapping deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── EMPLOYEE DEVICE USERS ──────────────────────────────────

const getEmployeeDeviceUsers = async (req, res) => {
  try {
    const result = await employeeDeviceUserModel.getAll(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeDeviceUser = async (req, res) => {
  try {
    const user = await employeeDeviceUserModel.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "Employee device user not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmployeeDeviceUser = async (req, res) => {
  try {
    const { employee_id, device_id, device_user_id } = req.body;

    if (!employee_id || !device_id || !device_user_id) {
      return res.status(400).json({ message: "employee_id, device_id, and device_user_id are required" });
    }

    const existing = await employeeDeviceUserModel.getByDeviceAndUserId(device_id, device_user_id);
    if (existing) {
      return res.status(409).json({ message: "This device user ID is already mapped to an employee" });
    }

    const result = await employeeDeviceUserModel.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({ message: "Invalid employee_id or device_id" });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateEmployeeDeviceUser = async (req, res) => {
  try {
    const existing = await employeeDeviceUserModel.getByDeviceAndUserId(req.body.device_id, req.body.device_user_id);
    if (existing && existing.id !== parseInt(req.params.id)) {
      return res.status(409).json({ message: "This device user ID is already mapped to an employee" });
    }
    const user = await employeeDeviceUserModel.update(req.params.id, req.body);
    if (!user) return res.status(404).json({ message: "Employee device user not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEmployeeDeviceUser = async (req, res) => {
  try {
    await employeeDeviceUserModel.remove(req.params.id);
    res.json({ message: "Employee device user deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── RAW LOGS ───────────────────────────────────────────────

const getRawLogs = async (req, res) => {
  try {
    const result = await rawLogsModel.getAll(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRawLog = async (req, res) => {
  try {
    const log = await rawLogsModel.getById(req.params.id);
    if (!log) return res.status(404).json({ message: "Raw log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── IMPORT ─────────────────────────────────────────────────

const importLogs = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const deviceId = req.body.device_id ? parseInt(req.body.device_id) : null;
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === ".csv" || ext === ".txt") {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n").filter((l) => l.trim());
      if (lines.length < 2) throw new Error("File has no data rows");

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((h, idx) => { row[h] = values[idx]; });
          rows.push(row);
        }
      }
    } else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({ message: "Unsupported file format. Use CSV, TXT, XLSX, or XLS" });
    }

    if (rows.length === 0) throw new Error("No parseable data found in file");

    const batchId = uuidv4();
    const imported = await deviceIntegrationService.importFile(rows, deviceId, batchId);

    fs.unlink(filePath, () => {});

    res.json({ message: `${imported.length} logs imported`, batch_id: batchId, count: imported.length });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── GENERIC PUSH ENDPOINT ──────────────────────────────────

const pushLog = async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const result = await deviceIntegrationService.pushLog(deviceId, req.body);
    res.status(201).json({ message: "Log received", log: result });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message });
  }
};

// ─── PROCESSING ──────────────────────────────────────────────

const processLog = async (req, res) => {
  try {
    const rawLogId = parseInt(req.params.id);
    const log = await rawLogsModel.getById(rawLogId);
    if (!log) return res.status(404).json({ message: "Raw log not found" });
    const job = await deviceProcessingQueue.addLogToQueue(rawLogId);
    res.json({ message: "Log queued for processing", raw_log_id: rawLogId, job_id: job.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processBatch = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }
    const jobs = await deviceProcessingQueue.addBatchToQueue(ids);
    res.json({ message: `${ids.length} logs queued for processing`, count: ids.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rotateDeviceKey = async (req, res) => {
  try {
    const deviceId = parseInt(req.params.id);
    const device = await deviceModel.getById(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });

    const rawKey = generateDeviceKey();
    const hash = hashDeviceKey(rawKey);
    await deviceModel.updateApiKeyHash(deviceId, hash);

    audit.auditLog(req, {
      action: "ROTATE_API_KEY",
      table_name: "devices",
      record_id: deviceId,
      description: `Device API key rotated for device ${device.name} (ID: ${deviceId})`,
    });

    res.json({
      message: "Device API key rotated successfully",
      device_id: deviceId,
      device_name: device.name,
      api_key: rawKey,
      note: "Save this key — it will not be shown again",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDevices, getDevice, createDevice, updateDevice, deleteDevice,
  rotateDeviceKey,
  getMappings, createMapping, updateMapping, deleteMapping,
  getEmployeeDeviceUsers, getEmployeeDeviceUser, createEmployeeDeviceUser, updateEmployeeDeviceUser, deleteEmployeeDeviceUser,
  getRawLogs, getRawLog, importLogs, pushLog,
  processLog, processBatch,
};
