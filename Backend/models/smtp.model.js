const pool = require("../config/db");

// Get SMTP settings (returns the active one or all)
const getSmtpSettings = async (includeInactive = false) => {
  let query = `
    SELECT 
      id, 
      host, 
      port, 
      encryption, 
      username, 
       password, 
      from_email, 
      from_name, 
      is_active, 
      test_email_sent, 
      last_test_sent_at, 
      created_at, 
      updated_at
    FROM smtp_settings
  `;

  if (!includeInactive) {
    query += ` WHERE is_active = true`;
  }

  query += ` ORDER BY is_active DESC, id DESC LIMIT 1`;

  const result = await pool.query(query);
  return result.rows[0] || null;
};

// Get all SMTP settings (for admin list)
const getAllSmtpSettings = async () => {
  const result = await pool.query(`
    SELECT 
      id, 
      host, 
      port, 
      encryption, 
      username, 
      from_email, 
      from_name, 
      is_active, 
      test_email_sent, 
      last_test_sent_at, 
      created_at, 
      updated_at
    FROM smtp_settings
    ORDER BY created_at DESC
  `);
  return result.rows;
};

// Create new SMTP settings
const createSmtpSettings = async (data) => {
  const {
    host,
    port,
    encryption,
    username,
    password,
    from_email,
    from_name,
    is_active = true,
  } = data;

  // If this is active, deactivate others first
  if (is_active) {
    await pool.query(
      `UPDATE smtp_settings SET is_active = false WHERE is_active = true`,
    );
  }

  const result = await pool.query(
    `
    INSERT INTO smtp_settings (
      host, port, encryption, username, password, from_email, from_name, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, host, port, encryption, username, from_email, from_name, is_active, created_at
    `,
    [
      host,
      port,
      encryption,
      username,
      password,
      from_email,
      from_name,
      is_active,
    ],
  );

  return result.rows[0];
};

// Update SMTP settings
const updateSmtpSettings = async (id, data) => {
  const {
    host,
    port,
    encryption,
    username,
    password,
    from_email,
    from_name,
    is_active,
  } = data;

  // If setting as active, deactivate others
  if (is_active) {
    await pool.query(
      `UPDATE smtp_settings SET is_active = false WHERE id != $1 AND is_active = true`,
      [id],
    );
  }

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (host !== undefined) {
    updates.push(`host = $${paramIndex++}`);
    values.push(host);
  }
  if (port !== undefined) {
    updates.push(`port = $${paramIndex++}`);
    values.push(port);
  }
  if (encryption !== undefined) {
    updates.push(`encryption = $${paramIndex++}`);
    values.push(encryption);
  }
  if (username !== undefined) {
    updates.push(`username = $${paramIndex++}`);
    values.push(username);
  }
  if (password !== undefined && password !== "") {
    updates.push(`password = $${paramIndex++}`);
    values.push(password);
  }
  if (from_email !== undefined) {
    updates.push(`from_email = $${paramIndex++}`);
    values.push(from_email);
  }
  if (from_name !== undefined) {
    updates.push(`from_name = $${paramIndex++}`);
    values.push(from_name);
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(id);

  const result = await pool.query(
    `
    UPDATE smtp_settings 
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING id, host, port, encryption, username, from_email, from_name, is_active, updated_at
    `,
    values,
  );

  return result.rows[0];
};

// Update test email status
const updateTestEmailStatus = async (id, sent = true) => {
  const result = await pool.query(
    `
    UPDATE smtp_settings 
    SET test_email_sent = $1, last_test_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, test_email_sent, last_test_sent_at
    `,
    [sent, id],
  );
  return result.rows[0];
};

// Delete SMTP settings
const deleteSmtpSettings = async (id) => {
  const result = await pool.query(
    `DELETE FROM smtp_settings WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0];
};

// Test SMTP connection
const testSmtpConnection = async (id, testEmail) => {
  const smtp = await getSmtpSettingsById(id);
  if (!smtp) throw new Error("SMTP settings not found");

  // This will be implemented in the service layer
  return { success: true, message: "Test email sent successfully" };
};

const getSmtpSettingsById = async (id) => {
  const result = await pool.query(
    `
    SELECT id, host, port, encryption, username, password, from_email, from_name, is_active
    FROM smtp_settings
    WHERE id = $1
    `,
    [id],
  );
  return result.rows[0];
};

module.exports = {
  getSmtpSettings,
  getAllSmtpSettings,
  createSmtpSettings,
  updateSmtpSettings,
  deleteSmtpSettings,
  testSmtpConnection,
  updateTestEmailStatus,
  getSmtpSettingsById,
};
