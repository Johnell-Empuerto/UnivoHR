const pool = require("../config/db");

const getUserBranchIds = async (userId) => {
  const result = await pool.query(
    `SELECT branch_id FROM user_branch_access WHERE user_id = $1`,
    [userId],
  );
  return result.rows.map((r) => r.branch_id);
};

const canAccessBranch = async (user, branchId) => {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "EMPLOYEE") return false;
  const branchNum = Number(branchId);
  if (!branchNum) return false;
  const branches = await getUserBranchIds(user.id);
  return branches.includes(branchNum);
};

const normalizeBranchId = (branchId) => {
  if (branchId === undefined || branchId === null) return null;
  if (branchId === "" || branchId === "all") return null;
  const num = Number(branchId);
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`Invalid branch_id: "${branchId}"`);
  }
  return num;
};

module.exports = {
  getUserBranchIds,
  canAccessBranch,
  normalizeBranchId,
};
