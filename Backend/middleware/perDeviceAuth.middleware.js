const pool = require("../config/db");
const { validateDeviceKey } = require("../utils/deviceKey");

const perDeviceAuth = async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const sharedKey = process.env.DEVICE_API_KEY;

  const deviceId = req.headers["x-device-id"];
  const apiKey = req.headers["x-api-key"];

  // In development, allow fallback to shared DEVICE_API_KEY
  if (!isProduction && !deviceId && apiKey && sharedKey) {
    if (apiKey === sharedKey) {
      req.deviceId = null;
      req.device = null;
      return next();
    }
    return res.status(401).json({ message: "Invalid device API key" });
  }

  // In production, x-device-id is required
  if (!deviceId) {
    return res.status(401).json({
      message: isProduction
        ? "x-device-id header is required"
        : "x-device-id header is required for per-device auth (or use shared DEVICE_API_KEY without x-device-id)",
    });
  }

  if (!apiKey) {
    return res.status(401).json({ message: "x-api-key header is required" });
  }

  // Validate against shared key fallback in development only
  if (!isProduction && sharedKey && apiKey === sharedKey && deviceId) {
    const deviceResult = await pool.query(
      "SELECT id, name, status FROM devices WHERE id = $1 AND status = 'ACTIVE'",
      [parseInt(deviceId)]
    );
    if (deviceResult.rows.length === 0) {
      return res.status(401).json({ message: "Device not found or inactive" });
    }
    req.deviceId = parseInt(deviceId);
    req.device = deviceResult.rows[0];
    await pool.query(
      "UPDATE devices SET last_connected_at = NOW() WHERE id = $1",
      [req.deviceId]
    );
    return next();
  }

  // Per-device key validation
  const deviceResult = await pool.query(
    `SELECT id, name, status, api_key_hash
     FROM devices
     WHERE id = $1`,
    [parseInt(deviceId)]
  );

  if (deviceResult.rows.length === 0) {
    return res.status(401).json({ message: "Device not found" });
  }

  const device = deviceResult.rows[0];

  if (device.status !== "ACTIVE") {
    return res.status(403).json({ message: "Device is not active" });
  }

  if (!device.api_key_hash) {
    return res.status(401).json({
      message: "Device has no API key configured. Generate one via the admin panel.",
    });
  }

  if (!validateDeviceKey(apiKey, device.api_key_hash)) {
    return res.status(401).json({ message: "Invalid device API key" });
  }

  req.deviceId = device.id;
  req.device = device;

  // Update last used and connected timestamps
  await pool.query(
    `UPDATE devices
     SET api_key_last_used_at = NOW(), last_connected_at = NOW()
     WHERE id = $1`,
    [device.id]
  );

  next();
};

module.exports = perDeviceAuth;
