// middleware/deviceAuth.middleware.js
// Backward-compatible device API key authentication
// Only enforced when DEVICE_API_KEY env variable is set

const deviceAuth = (req, res, next) => {
  const deviceApiKey = process.env.DEVICE_API_KEY;

  // If no API key configured, allow through (backward compatibility)
  if (!deviceApiKey) {
    return next();
  }

  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== deviceApiKey) {
    return res.status(401).json({
      message: "Invalid or missing device API key",
    });
  }

  next();
};

module.exports = deviceAuth;
