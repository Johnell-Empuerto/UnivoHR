const { normalizeRole } = require("../constants/roles");

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const normalized = normalizeRole(req.user.role);
    req.user.role = normalized;

    if (!allowedRoles.includes(normalized)) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        yourRole: normalized,
      });
    }

    next();
  };
};

module.exports = authorize;
