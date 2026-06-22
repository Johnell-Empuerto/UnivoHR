const pool = require("../config/db");

const getAll = async ({ includeInactive } = {}) => {
  if (includeInactive) {
    const result = await pool.query(
      `SELECT * FROM hr_policy_documents ORDER BY is_active DESC, updated_at DESC`,
    );
    return result.rows;
  }
  const result = await pool.query(
    `SELECT * FROM hr_policy_documents WHERE is_active = true ORDER BY updated_at DESC`,
  );
  return result.rows;
};

const getAllPaginated = async ({ page = 1, limit = 10, search = "", category = "", status = "all", includeInactive = false } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (!includeInactive) {
    conditions.push(`is_active = true`);
  } else if (status === "active") {
    conditions.push(`is_active = true`);
  } else if (status === "inactive") {
    conditions.push(`is_active = false`);
  }

  if (search) {
    conditions.push(`(title ILIKE $${idx} OR content::text ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  if (category) {
    conditions.push(`category = $${idx}`);
    params.push(category);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM hr_policy_documents ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT * FROM hr_policy_documents ${where} ORDER BY is_active DESC, updated_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset],
  );

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM hr_policy_documents WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

const getByCategory = async (category) => {
  const result = await pool.query(
    `SELECT * FROM hr_policy_documents WHERE is_active = true AND category = $1 ORDER BY title`,
    [category],
  );
  return result.rows;
};

const create = async (data) => {
  const { title, category, content, content_format, created_by } = data;
  const result = await pool.query(
    `INSERT INTO hr_policy_documents (title, category, content, content_format, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, category, content, content_format || "html", created_by || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { title, category, content, content_format, updated_by } = data;
  const result = await pool.query(
    `UPDATE hr_policy_documents
     SET title = $1, category = $2, content = $3, content_format = $4, updated_by = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [title, category, content, content_format || "html", updated_by || null, id],
  );
  return result.rows[0];
};

const setActive = async (id, is_active, updated_by) => {
  const result = await pool.query(
    `UPDATE hr_policy_documents SET is_active = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [is_active, updated_by || null, id],
  );
  return result.rows[0];
};

const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM hr_policy_documents WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0];
};

const search = async (question, category) => {
  const q = question.toLowerCase().trim();

  // Clean punctuation and split into words
  const cleanQ = q.replace(/[^\w\s]/g, ' ');
  const words = cleanQ
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Retrieve active policies under the category
  // If no category (or category is "company"), retrieve all active policies
  let query = `SELECT * FROM hr_policy_documents WHERE is_active = true`;
  const params = [];
  let idx = 1;

  if (category && category !== "company") {
    query += ` AND category = $${idx++}`;
    params.push(category);
  }

  const result = await pool.query(query, params);
  const policies = result.rows;

  if (policies.length === 0) {
    return [];
  }

  // Score policies
  const scored = policies.map((policy) => {
    let score = 0;
    const titleLower = policy.title.toLowerCase();
    const contentLower = policy.content.toLowerCase();
    const catLower = (policy.category || "").toLowerCase();

    // Category match bonus
    if (category && catLower === category.toLowerCase()) {
      score += 10;
    }

    // Title matching (exact title matches or title contains query)
    if (titleLower.includes(q)) {
      score += 20;
    }

    // Word matching
    words.forEach((word) => {
      if (titleLower.includes(word)) {
        score += 5;
      }
      if (contentLower.includes(word)) {
        score += 2;
      }
    });

    return { policy, score };
  });

  // Sort by score descending, and then by title length (shorter titles first)
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.policy.title.length - b.policy.title.length;
  });

  // Return the top 3
  return scored.map((s) => s.policy).slice(0, 3);
};

module.exports = {
  getAll,
  getAllPaginated,
  getById,
  getByCategory,
  create,
  update,
  setActive,
  remove,
  search,
};
