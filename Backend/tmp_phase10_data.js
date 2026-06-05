const pool = require("./config/db");
(async () => {
  // 1. Count attendance records by source
  console.log("=== Attendance Count by Source ===");
  let r = await pool.query(`
    SELECT source, COUNT(*)::int AS count,
           MIN(check_in_time::text) AS min_check_in,
           MAX(check_in_time::text) AS max_check_in,
           MIN(check_out_time::text) AS min_check_out,
           MAX(check_out_time::text) AS max_check_out
    FROM attendance
    GROUP BY source
    ORDER BY source
  `);
  console.table(r.rows);

  // 2. Distinct timezone_used values
  console.log("=== Distinct timezone_used ===");
  r = await pool.query(`
    SELECT timezone_used, COUNT(*)::int AS count
    FROM attendance
    GROUP BY timezone_used
    ORDER BY count DESC
  `);
  console.table(r.rows);

  // 3. Distinct branch_id values
  console.log("=== Distinct branch_id ===");
  r = await pool.query(`
    SELECT a.branch_id, b.name AS branch_name, COUNT(*)::int AS count
    FROM attendance a LEFT JOIN branches b ON b.id = a.branch_id
    GROUP BY a.branch_id, b.name
    ORDER BY a.branch_id
  `);
  console.table(r.rows);

  // 4. Look at actual sample data for each source
  console.log("=== WEB samples (all) ===");
  r = await pool.query(`
    SELECT id, employee_id, check_in_time::text, check_out_time::text,
           date::text, timezone_used, source, branch_id
    FROM attendance WHERE source = 'WEB'
    ORDER BY id
  `);
  console.table(r.rows);
  console.log("WEB count:", r.rows.length);

  console.log("=== BIOMETRIC samples (all) ===");
  r = await pool.query(`
    SELECT id, employee_id, check_in_time::text, check_out_time::text,
           date::text, timezone_used, source, branch_id
    FROM attendance WHERE source = 'BIOMETRIC'
    ORDER BY id
  `);
  console.table(r.rows);
  console.log("BIOMETRIC count:", r.rows.length);

  console.log("=== MANUAL samples (all) ===");
  r = await pool.query(`
    SELECT id, employee_id, check_in_time::text, check_out_time::text,
           date::text, timezone_used, source, branch_id
    FROM attendance WHERE source = 'MANUAL'
    ORDER BY id
  `);
  console.table(r.rows);
  console.log("MANUAL count:", r.rows.length);

  // 5. Records with no timezone_used
  console.log("=== Records with NULL timezone_used ===");
  r = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM attendance WHERE timezone_used IS NULL
  `);
  console.table(r.rows);

  // 6. Records with check_in_time hour=0 (potential UTC corruption)
  console.log("=== Records where check_in_time hour is 0 (potential UTC) ===");
  r = await pool.query(`
    SELECT id, employee_id, check_in_time::text, check_out_time::text,
           date::text, timezone_used, source
    FROM attendance
    WHERE EXTRACT(HOUR FROM check_in_time) = 0
    ORDER BY id
  `);
  console.table(r.rows);

  // 7. Records with check_in_time hour >= 8 (potential local time)
  console.log("=== Records where check_in_time hour >= 8 (likely local) ===");
  r = await pool.query(`
    SELECT id, employee_id, check_in_time::text, check_out_time::text,
           date::text, timezone_used, source
    FROM attendance
    WHERE EXTRACT(HOUR FROM check_in_time) >= 8
    ORDER BY id
  `);
  console.table(r.rows);

  // 8. Check if date column correlates with check_in_time::date
  console.log("=== Check if date == check_in_time::date ===");
  r = await pool.query(`
    SELECT id, date::text, check_in_time::text,
           (check_in_time AT TIME ZONE 'Asia/Manila')::timestamptz::text AS converted_utc,
           CASE WHEN date = check_in_time::date THEN 'MATCH' ELSE 'MISMATCH' END AS date_match
    FROM attendance
    ORDER BY id
  `);
  console.table(r.rows);

  // 9. Total record count
  console.log("=== Total records ===");
  r = await pool.query("SELECT COUNT(*)::int FROM attendance");
  console.table(r.rows);

  await pool.end();
})();
