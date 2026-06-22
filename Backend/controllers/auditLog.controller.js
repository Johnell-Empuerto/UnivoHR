const pool = require("../config/db");

const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      action,
      table_name,
      date_from,
      date_to,
      user_id,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(
        `(username ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR al.ip_address ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (table_name) {
      conditions.push(`al.table_name = $${paramIndex}`);
      params.push(table_name);
      paramIndex++;
    }

    if (date_from) {
      conditions.push(`al.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`al.created_at <= $${paramIndex}::date + interval '1 day'`);
      params.push(date_to);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`al.user_id = $${paramIndex}`);
      params.push(parseInt(user_id));
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT al.*, u.username FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    const totalPages = Math.ceil(total / limitNum) || 1;

    const sanitized = dataResult.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      employee_id: row.employee_id,
      branch_id: row.branch_id,
      action: row.action,
      table_name: row.table_name,
      record_id: row.record_id,
      description: row.description,
      old_values: row.old_values,
      new_values: row.new_values,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at,
    }));

    res.json({
      data: sanitized,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Get logs error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };
