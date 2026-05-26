const { getUserBranchIds } = require("../utils/branchAccess");

const aiAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const scope = { role: user.role, allowedBranchIds: null, employeeId: null };

    if (user.role === "ADMIN" || user.role === "HR_ADMIN") {
      scope.dataScope = "all_branches";
      scope.allowedBranchIds = null;
    } else if (user.role === "HR") {
      const branchIds = await getUserBranchIds(user.id);
      if (branchIds.length === 0) {
        return res.status(403).json({ message: "Forbidden: No branch access assigned" });
      }
      scope.dataScope = "branch_scoped";
      scope.allowedBranchIds = branchIds;
    } else if (user.role === "EMPLOYEE") {
      scope.dataScope = "self_only";
      scope.employeeId = user.employee_id;
    }

    req.aiScope = scope;
    next();
  } catch (error) {
    console.error("[aiAccess] Error:", error.message);
    return res.status(500).json({ message: "Access check failed" });
  }
};

module.exports = aiAccess;
