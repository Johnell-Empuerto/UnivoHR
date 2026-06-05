const pool = require("../config/db");
const rawLogsModel = require("../models/rawLogs.model");
const attendanceLogModel = require("../models/attendanceLog.model");
const employeeDeviceUserModel = require("../models/employeeDeviceUser.model");
const attendanceService = require("./attendance.service");

const processSingleLog = async (rawLogId) => {
  const result = await pool.query(
    `UPDATE raw_logs SET status = 'PROCESSING', processing_started_at = NOW()
     WHERE id = $1 AND status IN ('PENDING', 'FAILED')
     RETURNING *`,
    [rawLogId]
  );
  if (result.rows.length === 0) return null;

  try {
    await processRawLog(result.rows[0]);
  } catch (err) {
    await rawLogsModel.updateStatus(rawLogId, "FAILED", err.message);
    await rawLogsModel.incrementRetry(rawLogId);
    throw err;
  }
};

const processNextBatch = async (batchSize = 10) => {
  const rawLogs = await rawLogsModel.startProcessing(batchSize);
  for (const rawLog of rawLogs) {
    try {
      await processRawLog(rawLog);
    } catch (err) {
      await rawLogsModel.updateStatus(rawLog.id, "FAILED", err.message);
      await rawLogsModel.incrementRetry(rawLog.id);
    }
  }
  return rawLogs.length;
};

const processRawLog = async (rawLog) => {
  const deviceInfo = await rawLogsModel.getByIdWithDevice(rawLog.id);
  if (!deviceInfo) return;

  const payload = parsePayload(deviceInfo.raw_payload);
  const deviceType = (deviceInfo.device_type || "OTHER").toUpperCase();
  const { employeeId, employeeCode, logTimestamp } = await resolveEmployee(deviceType, deviceInfo, payload);

  if (!employeeId) {
    throw new Error(`Could not resolve employee for raw_log ${rawLog.id}`);
  }

  await attendanceService.createAttendance({
    employee_id: employeeId,
    timestamp: logTimestamp,
    source: "BIOMETRIC",
    device_id: deviceInfo.device_id,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [deviceInfo.device_id]);

    const { rows: existing } = await client.query(
      `SELECT id FROM attendance_logs WHERE raw_log_id = $1 AND status = 'PROCESSED' LIMIT 1`,
      [rawLog.id]
    );

    if (existing.length > 0) {
      await client.query(
        `UPDATE raw_logs SET status = 'DUPLICATE', processed_at = NOW() WHERE id = $1`,
        [rawLog.id]
      );
      await client.query("COMMIT");
      return;
    }

    await client.query(
      `INSERT INTO attendance_logs (raw_log_id, device_id, employee_code, employee_id, log_timestamp, status)
       VALUES ($1, $2, $3, $4, $5, 'PROCESSED')`,
      [rawLog.id, deviceInfo.device_id, employeeCode, employeeId, logTimestamp]
    );

    await client.query(
      `UPDATE raw_logs SET status = 'PROCESSED', processed_at = NOW() WHERE id = $1`,
      [rawLog.id]
    );

    if (!rawLog.employee_code && employeeCode) {
      await client.query(
        `UPDATE raw_logs SET employee_code = $1 WHERE id = $2`,
        [employeeCode, rawLog.id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

function parsePayload(rawPayload) {
  if (!rawPayload) return {};
  try {
    return typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  } catch {
    return { raw: rawPayload };
  }
}

async function resolveEmployee(deviceType, deviceInfo, payload) {
  let employeeCode = deviceInfo.employee_code
    || payload.employee_code
    || payload.employeeCode
    || payload.employee_id
    || null;
  let employeeId = null;

  if (deviceType === "MOBILE" || deviceType === "API") {
    if (employeeCode) {
      const { rows } = await pool.query(
        "SELECT id FROM employees WHERE employee_code = $1",
        [employeeCode]
      );
      if (rows.length > 0) employeeId = rows[0].id;
    }
  } else if (deviceType === "BIOMETRIC" || deviceType === "CARD_READER") {
    const deviceUserId = payload.device_user_id
      || payload.user_id
      || payload.biometric_id
      || payload.card_id
      || payload.enrollment_id
      || null;
    if (deviceUserId) {
      const mapping = await employeeDeviceUserModel.getByDeviceAndUserId(
        deviceInfo.device_id,
        deviceUserId
      );
      if (mapping) {
        employeeId = mapping.employee_id;
        if (!employeeCode) {
          const { rows } = await pool.query(
            "SELECT employee_code FROM employees WHERE id = $1",
            [employeeId]
          );
          if (rows.length > 0) employeeCode = rows[0].employee_code;
        }
      }
    }
  } else {
    if (employeeCode) {
      const { rows } = await pool.query(
        "SELECT id FROM employees WHERE employee_code = $1",
        [employeeCode]
      );
      if (rows.length > 0) employeeId = rows[0].id;
    }
    if (!employeeId) {
      const deviceUserId = payload.device_user_id || payload.user_id || null;
      if (deviceUserId) {
        const mapping = await employeeDeviceUserModel.getByDeviceAndUserId(
          deviceInfo.device_id,
          deviceUserId
        );
        if (mapping) {
          employeeId = mapping.employee_id;
          if (!employeeCode) {
            const { rows } = await pool.query(
              "SELECT employee_code FROM employees WHERE id = $1",
              [employeeId]
            );
            if (rows.length > 0) employeeCode = rows[0].employee_code;
          }
        }
      }
    }
  }

  const logTimestamp = payload.timestamp
    || payload.date_time
    || payload.datetime
    || payload.time
    || payload.log_time
    || deviceInfo.timestamp;

  return { employeeId, employeeCode, logTimestamp };
}

const drainQueue = async () => {
  let total = 0;
  let count;
  do {
    count = await processNextBatch(10);
    total += count;
  } while (count > 0);
  return total;
};

module.exports = { processSingleLog, processNextBatch, drainQueue };
