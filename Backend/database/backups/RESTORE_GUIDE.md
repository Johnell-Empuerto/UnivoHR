# Database Restore Guide

## Prerequisites

- PostgreSQL (psql) installed and in PATH
- Database credentials from `.env` or environment variables
- Backup file from `Backend/database/backups/`

## Warnings

1. **STOP the backend server and worker processes before restoring.**
2. **Restoring will REPLACE all existing data** in the target database.
3. **Never restore into a production database** without explicit client approval and a recent backup.

## Restore Steps

### 1. Stop Backend

Kill any running `node index.js` or `node worker.js` processes.

### 2. Create a Fresh Database (if needed)

```powershell
psql -U postgres -c "CREATE DATABASE smart_hrms_attendance;"
```

### 3. Restore from Backup

```powershell
# Set password (optional: will prompt if omitted)
$env:PGPASSWORD="your_db_password"

# Restore
psql --host localhost --port 5432 --username postgres --dbname smart_hrms_attendance --file "Backend/database/backups/backup_20260617_1503.sql" --echo-errors
```

### 4. Verify Restore

```powershell
# Check that tables exist
psql -U postgres -d smart_hrms_attendance -c "\dt"

# Check admin user exists
psql -U postgres -d smart_hrms_attendance -c "SELECT id, username, role FROM users WHERE username = 'admin';"

# Check row counts for key tables
psql -U postgres -d smart_hrms_attendance -c @"
SELECT 'employees' as table_name, COUNT(*) as rows FROM employees
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'payroll', COUNT(*) FROM payroll
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance
ORDER BY table_name;
"@
```

### 5. Restart Backend

```powershell
npm run dev        # Backend
npm run dev:worker # Worker (separate terminal)
```

## Alternative: Restore Using Script

An existing restore script is available at `Backend/scripts/restore.ps1`:

```powershell
.\scripts\restore.ps1 -BackupFile "Backend/database/backups/backup_20260617_1503.sql" -Force
```

## Post-Restore Checklist

- [ ] Admin login works (admin / admin123 for fresh deployments)
- [ ] Employee records load
- [ ] Attendance records display
- [ ] Payroll modules functional
- [ ] Redis queues repopulate (workers restart automatically)
- [ ] Socket.IO reconnects on frontend page refresh
