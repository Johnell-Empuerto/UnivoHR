# Database Operations Checklist

## Before Deployment

- [ ] **Backup created** — Run `npm run backup:db`
- [ ] **Environment variables verified** — All required vars set in `.env` or environment
- [ ] `.env` is **not tracked in git** (confirmed in `.gitignore`)
- [ ] `.env.example` is up to date with all required vars
- [ ] **NOT VALID constraints validated** — Run `validate_constraints.sql` on a quiet period
- [ ] Redis is running and accessible
- [ ] SMTP settings configured in the app or via environment defaults

## Before Migration

- [ ] **Backup created** and saved to `Backend/database/backups/`
- [ ] Migration SQL file is reviewed
- [ ] If migration has `_rollback.sql`, verify it exists
- [ ] All changes are **ADDITIVE** (no unexpected DROP TABLE)
- [ ] Backend server is stopped
- [ ] Worker (`node worker.js`) is stopped
- [ ] Run migration via psql
- [ ] No errors in output
- [ ] **Record migration** — Update manual log or insert into tracking table

## Before Restore

- [ ] **Current state backed up** (in case you need to undo the restore)
- [ ] Restore file path is correct
- [ ] Target database name is correct
- [ ] Backend server is stopped
- [ ] Worker process is stopped
- [ ] Confirmed with team (if production)
- [ ] Written approval received (if client-facing)

## After Restore Verification

- [ ] Admin user exists: `SELECT id, username, role FROM users WHERE username = 'admin';`
- [ ] Tables exist: `\dt`
- [ ] Row counts look reasonable: `SELECT COUNT(*) FROM employees;`
- [ ] Login works with admin credentials
- [ ] Employee list loads
- [ ] Attendance records display (if any)
- [ ] Redis is running
- [ ] Socket.IO connects (refresh frontend)
- [ ] Workers restart automatically (queue processing)

## After Migration Verification

- [ ] New columns/tables exist
- [ ] Existing data preserved (run a COUNT before and after)
- [ ] Affected API endpoints respond correctly
- [ ] No unexpected errors in backend logs
- [ ] Frontend tests pass (if applicable)

## Backup Schedule Recommendation

| Environment | Frequency | Retention | Notes |
|-------------|-----------|-----------|-------|
| Development | Weekly | 7 days | Before any migration |
| Staging | Before each deployment | Until next backup | Before and after changes |
| Production | Daily | 30 days | Plus before any migration |
| Production (pre-migration) | Immediately before | Until confirmed stable | Manual trigger |

## Redis / Worker Reminder

After restoring the database:

- **Redis is a cache/store, not a backup target.** Flush Redis after restoring DB:
  ```bash
  redis-cli FLUSHALL
  ```
- Workers will rebuild their queues on restart.
- User sessions in Redis will be invalidated — users must re-login.
- JWT blacklist in Redis will be cleared — this is safe (tokens expire naturally).

## First Admin Login

For fresh deployments:

| Credential | Value |
|------------|-------|
| Username | `admin` |
| Password | `admin123` |
| Permissions | 92 (all modules) |
| Employee | ADMIN001 (if applicable) |

Change the default password on first login.
