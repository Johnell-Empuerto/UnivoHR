# Migration Guide

## Current Migration Folder Structure

```
Backend/database/
├── 001_safe_migration.sql       # Initial safe FKs + indexes
├── 002_*.sql                     # Branches, shifts
├── 003_calendar_branch.sql
├── ...
├── 052_payroll_formula_fixes.sql # Latest migration
├── deployment_full_fresh_start.sql  # Full reset script (admin use only)
├── backups/                      # pg_dump backup files
│   └── RESTORE_GUIDE.md
└── validate_constraints.sql      # NOT VALID FK validation
```

## Current State

Migrations are **manual SQL files** numbered sequentially.
There is **no migration runner**, **no schema_migrations table**, and **no rollback automation**.

| Aspect | Current |
|--------|---------|
| Runner | None — SQL files applied manually |
| Tracking | No tracking table |
| Rollback | Some files have `_rollback.sql` variants (e.g., `008_user_sessions.sql` / `008_user_sessions_rollback.sql`) |
| Fresh start | `deployment_full_fresh_start.sql` recreates everything from scratch |

## How to Apply a Migration Safely

### Step-by-Step

1. **Backup the current database**
   ```powershell
   npm run backup:db
   ```

2. **Read the migration SQL file** — understand what it changes.

3. **Apply the migration**
   ```powershell
   $env:PGPASSWORD="your_password"
   psql -U postgres -d smart_hrms_attendance -f "Backend/database/052_payroll_formula_fixes.sql" --echo-errors
   ```

4. **Verify**
   - Check for error messages
   - Test affected modules
   - Confirm new columns/tables exist:
     ```sql
     \d target_table
     ```

### Recommended Order

1. Always apply in numeric order (001 → 002 → ... → 052).
2. Apply rollbacks in reverse order if needed.
3. Never skip a number — each migration builds on the previous.

## Dry-Run Checklist

Before applying any migration, confirm:

- [ ] Backup created (`npm run backup:db`)
- [ ] SQL has been reviewed by a second person (production)
- [ ] Migration is ADDITIVE only (no destructive DROP unless intentional)
- [ ] If destructive, rollback SQL is ready
- [ ] Backend server is stopped
- [ ] Worker process is stopped

## Rollback Strategy

- Some migrations include parallel `_rollback.sql` files.
- If a rollback is needed:
  1. Back up current state first
  2. Apply the matching rollback SQL
  3. Verify the rollback worked
- For migrations without rollback files, a full database restore is the safest option.

## Recommendation for Future Migration Tracking

### Option A: Simple Tracking Table (Recommended for now)

Create a `schema_migrations` table manually:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(255) NOT NULL UNIQUE,
  applied_at  TIMESTAMPTZ DEFAULT NOW(),
  checksum    VARCHAR(64),
  duration_ms INTEGER
);
```

Before each migration:
```sql
INSERT INTO schema_migrations (filename) VALUES ('052_payroll_formula_fixes.sql');
```

### Option B: node-pg-migrate (Future)

Install `node-pg-migrate` and create formal migration files:

```bash
npm install node-pg-migrate
npx pg-migrate create "add payroll status field"
```

Benefit: Automatic tracking, rollback commands, checksum verification.

### Option C: Knex.js Migrations (Future)

If the project ever adopts Knex.js for query building, its built-in migration system would be ideal.
