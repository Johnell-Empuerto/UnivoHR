const { getUserBranchIds, normalizeBranchId } = require("../utils/branchAccess");
const { normalizeRole } = require("../constants/roles");

const requireBranchAccessFromQuery = (paramName = "branch_id") => {
  return async (req, res, next) => {
    try {
      const rawValue = req.query[paramName];
      const branchId = normalizeBranchId(rawValue);
      const role = normalizeRole(req.user.role);

      if (role === "SYSTEM_ADMIN" || role === "ADMIN") {
        req.allowedBranchIds = branchId ? [branchId] : null;
        return next();
      }

      if (role === "EMPLOYEE" || role === "PAYROLL_USER") {
        return res.status(403).json({ message: "Forbidden: Employees cannot use branch filtering" });
      }

      const assignedBranchIds = await getUserBranchIds(req.user.id);

      if (assignedBranchIds.length === 0) {
        return res.status(403).json({ message: "Forbidden: No branch access assigned" });
      }

      if (branchId) {
        if (!assignedBranchIds.includes(branchId)) {
          return res.status(403).json({ message: "Forbidden: No access to this branch" });
        }
        req.allowedBranchIds = [branchId];
      } else {
        req.allowedBranchIds = assignedBranchIds;
      }

      next();
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
};

const requireBranchAccessFromBody = (paramName = "branch_id") => {
  return async (req, res, next) => {
    try {
      const rawValue = req.body[paramName];
      const branchId = normalizeBranchId(rawValue);

      const role = normalizeRole(req.user.role);

      if (role === "SYSTEM_ADMIN" || role === "ADMIN") {
        req.allowedBranchIds = branchId ? [branchId] : null;
        return next();
      }

      if (role === "EMPLOYEE" || role === "PAYROLL_USER") {
        return res.status(403).json({ message: "Forbidden: Employees cannot use branch filtering" });
      }

      const assignedBranchIds = await getUserBranchIds(req.user.id);

      if (assignedBranchIds.length === 0) {
        return res.status(403).json({ message: "Forbidden: No branch access assigned" });
      }

      if (branchId) {
        if (!assignedBranchIds.includes(branchId)) {
          return res.status(403).json({ message: "Forbidden: No access to this branch" });
        }
        req.allowedBranchIds = [branchId];
      } else {
        req.allowedBranchIds = assignedBranchIds;
      }

      next();
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
};

module.exports = {
  requireBranchAccessFromQuery,
  requireBranchAccessFromBody,
};
