const pool = require("../config/db");

const createApprovalRequest = async (payrollId, cutoffStart, cutoffEnd, branchId, requestedBy) => {
  const result = await pool.query(
    `INSERT INTO payroll_approvals (payroll_id, cutoff_start, cutoff_end, branch_id, requested_by, status)
     VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
    [payrollId, cutoffStart, cutoffEnd, branchId, requestedBy]
  );
  return result.rows[0];
};

const getApprovalRequests = async (branchId = null, status = null) => {
  const params = [];
  let whereClauses = [];
  let idx = 1;
  if (branchId) {
    whereClauses.push(`pa.branch_id = $${idx}`);
    params.push(branchId);
    idx++;
  }
  if (status) {
    whereClauses.push(`pa.status = $${idx}`);
    params.push(status);
    idx++;
  }
  const where = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
  const result = await pool.query(
    `SELECT pa.*, 
            req.first_name || ' ' || req.last_name as requested_by_name,
            rev.first_name || ' ' || rev.last_name as reviewed_by_name
     FROM payroll_approvals pa
     LEFT JOIN users req ON req.id = pa.requested_by
     LEFT JOIN users rev ON rev.id = pa.reviewed_by
     ${where}
     ORDER BY pa.requested_at DESC`,
    params
  );
  return result.rows;
};

const reviewApprovalRequest = async (id, status, reviewedBy, remarks) => {
  if (status === "APPROVED") {
    await pool.query("BEGIN");
    try {
      const approval = await pool.query("SELECT payroll_id, cutoff_start, cutoff_end FROM payroll_approvals WHERE id = $1", [id]);
      if (approval.rows.length > 0 && approval.rows[0].payroll_id) {
        await pool.query(
          "UPDATE payroll SET status = 'PAID', paid_at = NOW(), paid_by = $1 WHERE id = $2",
          [reviewedBy, approval.rows[0].payroll_id]
        );
      }
      const result = await pool.query(
        `UPDATE payroll_approvals SET status = $1, reviewed_by = $2, reviewed_at = NOW(), remarks = $3 WHERE id = $4 RETURNING *`,
        [status, reviewedBy, remarks, id]
      );
      await pool.query("COMMIT");
      return result.rows[0];
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }
  const result = await pool.query(
    `UPDATE payroll_approvals SET status = $1, reviewed_by = $2, reviewed_at = NOW(), remarks = $3 WHERE id = $4 RETURNING *`,
    [status, reviewedBy, remarks, id]
  );
  return result.rows[0];
};

const getApprovalRequestsByCutoff = async (cutoffStart, cutoffEnd, branchId = null) => {
  const params = [cutoffStart, cutoffEnd];
  let branchClause = "";
  if (branchId) {
    branchClause = "AND pa.branch_id = $3";
    params.push(branchId);
  }
  const result = await pool.query(
    `SELECT pa.*,
            req.first_name || ' ' || req.last_name as requested_by_name,
            rev.first_name || ' ' || rev.last_name as reviewed_by_name
     FROM payroll_approvals pa
     LEFT JOIN users req ON req.id = pa.requested_by
     LEFT JOIN users rev ON rev.id = pa.reviewed_by
     WHERE pa.cutoff_start = $1::date AND pa.cutoff_end = $2::date ${branchClause}
     ORDER BY pa.requested_at DESC`,
    params
  );
  return result.rows;
};

module.exports = {
  createApprovalRequest,
  getApprovalRequests,
  reviewApprovalRequest,
  getApprovalRequestsByCutoff,
};
