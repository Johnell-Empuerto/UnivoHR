const { hasPermission } = require("../services/permission.service");

const requirePermission = (...permissionKeys) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No user found" });
      }

      if (req.user.role === "ADMIN") {
        return next();
      }

      for (const key of permissionKeys) {
        const allowed = await hasPermission(req.user, key);
        if (!allowed) {
          return res.status(403).json({
            message: "Forbidden: Insufficient permissions",
            required: permissionKeys.length === 1 ? permissionKeys[0] : permissionKeys,
          });
        }
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Error checking permissions" });
    }
  };
};

module.exports = requirePermission;
