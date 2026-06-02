const pool = require("../config/db");

const getAll = async () => {
  const result = await pool.query(
    `SELECT rp.*, COUNT(rps.id)::int AS steps_count
     FROM rotation_patterns rp
     LEFT JOIN rotation_pattern_steps rps ON rps.pattern_id = rp.id
     GROUP BY rp.id
     ORDER BY rp.is_active DESC, rp.name ASC`
  );
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM rotation_patterns WHERE id = $1",
    [id]
  );
  if (!result.rows[0]) return null;

  const stepsResult = await pool.query(
    `SELECT rps.*, ss.name AS shift_name, ss.code AS shift_code, ss.type AS shift_type,
            ss.start_time, ss.end_time, ss.is_night_shift, ss.is_flexitime
     FROM rotation_pattern_steps rps
     LEFT JOIN shift_schedules ss ON ss.id = rps.shift_id
     WHERE rps.pattern_id = $1
     ORDER BY rps.day_offset ASC`,
    [id]
  );

  return { ...result.rows[0], steps: stepsResult.rows };
};

const create = async (data) => {
  const { name, description, cycle_days, is_active, steps } = data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const patternResult = await client.query(
      `INSERT INTO rotation_patterns (name, description, cycle_days, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, cycle_days, is_active !== false]
    );
    const pattern = patternResult.rows[0];

    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await client.query(
          `INSERT INTO rotation_pattern_steps (pattern_id, day_offset, shift_id, is_rest_day)
           VALUES ($1, $2, $3, $4)`,
          [pattern.id, step.day_offset, step.shift_id, step.is_rest_day || false]
        );
      }
    }

    await client.query("COMMIT");
    return getById(pattern.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const update = async (id, data) => {
  const { name, description, cycle_days, is_active, steps } = data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const patternResult = await client.query(
      `UPDATE rotation_patterns SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         cycle_days = COALESCE($3, cycle_days),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, description, cycle_days, is_active, id]
    );
    if (!patternResult.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    if (steps && Array.isArray(steps)) {
      await client.query("DELETE FROM rotation_pattern_steps WHERE pattern_id = $1", [id]);
      for (const step of steps) {
        await client.query(
          `INSERT INTO rotation_pattern_steps (pattern_id, day_offset, shift_id, is_rest_day)
           VALUES ($1, $2, $3, $4)`,
          [id, step.day_offset, step.shift_id, step.is_rest_day || false]
        );
      }
    }

    await client.query("COMMIT");
    return getById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  const result = await pool.query(
    "DELETE FROM rotation_patterns WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

const getStep = async (patternId, dayOffset) => {
  const result = await pool.query(
    `SELECT rps.*, ss.name AS shift_name, ss.code AS shift_code,
            ss.start_time, ss.end_time, ss.type AS shift_type,
            ss.is_night_shift, ss.is_flexitime
     FROM rotation_pattern_steps rps
     LEFT JOIN shift_schedules ss ON ss.id = rps.shift_id
     WHERE rps.pattern_id = $1 AND rps.day_offset = $2`,
    [patternId, dayOffset]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getStep,
};
