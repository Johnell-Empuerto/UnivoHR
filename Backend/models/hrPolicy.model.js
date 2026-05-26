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
  const { title, category, content, created_by } = data;
  const result = await pool.query(
    `INSERT INTO hr_policy_documents (title, category, content, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, category, content, created_by || null],
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { title, category, content, updated_by } = data;
  const result = await pool.query(
    `UPDATE hr_policy_documents
     SET title = $1, category = $2, content = $3, updated_by = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [title, category, content, updated_by || null, id],
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

const search = async (question, category) => {
  const q = question.toLowerCase();
  const words = q
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => `%${w}%`);

  let conditions = [`is_active = true`];
  const params = [];
  let idx = 1;

  if (category && category !== "company") {
    conditions.push(`category = $${idx++}`);
    params.push(category);
  }

  const keywordConditions = [];
  if (words.length > 0) {
    for (const word of words) {
      keywordConditions.push(
        `(LOWER(title) LIKE $${idx} OR LOWER(content) LIKE $${idx})`,
      );
      params.push(word);
      idx++;
    }
  }

  if (keywordConditions.length > 0) {
    conditions.push(`(${keywordConditions.join(" OR ")})`);
  }

  const result = await pool.query(
    `SELECT * FROM hr_policy_documents
     WHERE ${conditions.join(" AND ")}
     ORDER BY
       CASE WHEN category = $${idx} THEN 0 ELSE 1 END,
       CASE WHEN LOWER(title) LIKE $${idx + 1} THEN 0 ELSE 1 END,
       LENGTH(title) ASC
     LIMIT 3`,
    [...params, category || "", `%${q}%`],
  );
  return result.rows;
};

module.exports = {
  getAll,
  getById,
  getByCategory,
  create,
  update,
  setActive,
  search,
};
