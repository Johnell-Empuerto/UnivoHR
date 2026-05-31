const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeePerformance.controller");
const authenticate = require("../middleware/auth.middleware");
const { hasPermission } = require("../services/permission.service");

const requireMyPerformance = () => {
  return async (req, res, next) => {
    if (req.user?.role === "ADMIN") return next();
    const hasEither = await hasPermission(req.user, "performance.view")
      || await hasPermission(req.user, "my_performance.view");
    if (!hasEither) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        required: ["performance.view", "my_performance.view"],
      });
    }
    next();
  };
};

// Self-scoped — returns only the authenticated user's own data
router.get("/summary", authenticate, requireMyPerformance(), controller.getSummary);
router.get("/probation", authenticate, requireMyPerformance(), controller.getProbationInfo);

module.exports = router;
