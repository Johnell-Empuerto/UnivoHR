const pool = require("./config/db");
(async () => {
  // 1. Full attendance columns + constraints + defaults
  console.log("=== 1. attendance table columns ===");
  let r = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'attendance'
     ORDER BY ordinal_position`
  );
  console.table(r.rows);

  // 2. Indexes on attendance
  console.log("=== 2. attendance indexes ===");
  r = await pool.query(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'attendance' ORDER BY indexname`
  );
  console.table(r.rows);

  // 3. Constraints
  console.log("=== 3. attendance constraints ===");
  r = await pool.query(
    `SELECT conname, contype, pg_get_constraintdef(oid) AS def
     FROM pg_constraint
     WHERE conrelid = 'attendance'::regclass`
  );
  console.table(r.rows);

  // 4. Triggers
  console.log("=== 4. attendance triggers ===");
  r = await pool.query(
    `SELECT trigger_name, event_manipulation, action_timing, action_statement
     FROM information_schema.triggers
     WHERE event_object_table = 'attendance'`
  );
  console.table(r.rows);

  // 5. Raw logs table columns (for context)
  console.log("=== 5. raw_logs table columns ===");
  r = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'raw_logs'
     ORDER BY ordinal_position`
  );
  console.table(r.rows);

  // 6. employee_salary columns (from previous)
  console.log("=== 6. employee_salary table columns ===");
  r = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'employee_salary'
     ORDER BY ordinal_position`
  );
  console.table(r.rows);

  await pool.end();
})();
