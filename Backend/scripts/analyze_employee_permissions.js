const pool = require("../config/db");

const EMPLOYEE_DEFAULT_PERMISSIONS = [
  "dashboard.view",
  "attendance.view",
  "leave.view",
  "overtime.view",
  "manhours.view",
  "hr_policies.view",
  "calendar.view",
  "notifications.view",
  "my_performance.view",
  "profile.view",
  "change_password",
];

async function analyze() {
  console.log("=== Employee Default Permissions Analysis ===\n");

  // Find all EMPLOYEE users
  const usersResult = await pool.query(
    `SELECT u.id, u.username, u.role, u.created_at,
            e.first_name, e.last_name, e.employee_code
     FROM users u
     JOIN employees e ON e.id = u.employee_id
     WHERE u.role = 'EMPLOYEE'
     ORDER BY u.id`
  );

  const employeeUsers = usersResult.rows;
  console.log(`Total EMPLOYEE users: ${employeeUsers.length}\n`);

  let totalMissingCount = 0;
  let affectedUsers = 0;
  let usersWithZeroPerms = 0;
  const userReports = [];

  for (const user of employeeUsers) {
    // Get current permissions
    const permResult = await pool.query(
      `SELECT permission_key FROM user_permissions
       WHERE user_id = $1 AND is_allowed = TRUE`,
      [user.id]
    );

    const currentPerms = permResult.rows.map((r) => r.permission_key);
    const currentCount = currentPerms.length;

    // Find missing Employee Default permissions
    const missingPerms = EMPLOYEE_DEFAULT_PERMISSIONS.filter(
      (p) => !currentPerms.includes(p)
    );

    if (currentCount === 0) {
      usersWithZeroPerms++;
    }

    if (missingPerms.length > 0) {
      affectedUsers++;
      totalMissingCount += missingPerms.length;
      userReports.push({
        id: user.id,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`,
        employeeCode: user.employee_code,
        currentCount,
        missingCount: missingPerms.length,
        missingPerms,
        zeroPerms: currentCount === 0,
      });
    }
  }

  // Print summary
  console.log("=== Summary ===");
  console.log(`Total EMPLOYEE users:            ${employeeUsers.length}`);
  console.log(`Users with zero permissions:     ${usersWithZeroPerms}`);
  console.log(`Affected users (missing perms):  ${affectedUsers}`);
  console.log(`Total missing permissions:       ${totalMissingCount}`);
  console.log(`Estimated permissions to add:    ${totalMissingCount}`);
  console.log("");

  // Print detailed report
  console.log("=== Affected Users Detail ===\n");
  for (const r of userReports) {
    console.log(
      `User #${r.id} | ${r.username} (${r.name}) | ${r.employeeCode}`
    );
    console.log(`  Current permissions: ${r.currentCount}`);
    console.log(`  Missing: ${r.missingCount} permissions`);
    console.log(`  Missing keys: ${r.missingPerms.join(", ")}`);
    console.log("");
  }

  if (affectedUsers === 0) {
    console.log("No affected users found. All EMPLOYEE users have complete Employee Default permissions.\n");
  }

  console.log("=== End of Analysis ===");

  // Return data for script generation
  return { employeeUsers, userReports, totalMissingCount, affectedUsers, usersWithZeroPerms };
}

analyze()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Analysis failed:", err);
    process.exit(1);
  });
