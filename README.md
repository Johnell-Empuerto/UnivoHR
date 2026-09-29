# UnivoHR — HRMS & Attendance System

A full-stack Human Resource Management System covering attendance, payroll, leaves, recruitment, performance (KPI), device/biometric integration, analytics, and HR self-service — with a React SPA front end and an Express API back end.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui + Radix UI, TanStack Query, Zustand, React Router 7, Recharts / Nivo, FullCalendar, TipTap |
| Backend | Node.js 20+, Express 5 (CommonJS), Socket.IO, node-cron scheduler, Bull + Redis job queue |
| Database | PostgreSQL 16 (manual numbered SQL migrations) |
| Cache / Queue | Redis 7 |
| Auth | JWT (access + refresh), OTP email verification, bcrypt, account lockout |
| Reports / Docs | PDFKit, Puppeteer, ExcelJS, json2csv |
| Testing / CI | Jest + Supertest (backend), ESLint + `tsc` (frontend), GitHub Actions |

---

## Features

- **Attendance** — clock in/out, shifts, rest days, night differential, holidays, overtime, leave conversion, time-zone aware storage
- **Payroll** — salary computation, tax annualization, contributions (SSS/PhilHealth/Pag-IBIG style tables), allowances, pay rules, approval workflow, payslip PDF generation, final pay
- **Employee Management** — biodata, family, education, work experience, documents, requirements, onboarding, rotation, rest-day rules
- **Recruitment** — applicant pipeline with configurable workflow stages, interviews, approvals, document collection
- **Performance** — KPI templates & evaluations, performance reviews
- **Devices & Integrations** — biometric/device integration, per-device API keys, background device-processing worker
- **Analytics & Monitoring** — dashboards, drill-downs, forecasting, statistical anomaly detection, audit logs
- **HR Self-Service** — HR policies, HR forms, job positions, notifications (in-app + email via SMTP/email templates), branch-scoped access control
- **Administration** — granular permission keys per user, role-based access, settings, rate limiting, backup/restore scripts

---

## Project Structure

```
.
├── Backend/
│   ├── app.js              # Express app: middleware, routes, security
│   ├── index.js            # API server entry
│   ├── worker.js           # Bull queue worker entry
│   ├── scheduler.js        # node-cron scheduled jobs
│   ├── controllers/  routes/  services/  middleware/  models/
│   ├── utils/              # tax, payroll, payslip & report generators
│   ├── database/           # numbered SQL migrations + backups
│   ├── scripts/            # DB backup / restore helpers
│   └── tests/              # Jest + Supertest suites
├── Frontend/
│   ├── src/
│   │   ├── features/       # feature modules (payroll, attendance, ...)
│   │   ├── components/  pages/  hooks/  services/  utils/
│   │   ├── App.tsx  main.tsx
│   └── vite.config.ts
├── .github/workflows/      # backend-tests.yml, frontend-build.yml
└── backup/                 # historical SQL dumps
```

---

## Prerequisites

- **Node.js** 20 (backend) / 22 (frontend CI)
- **PostgreSQL** 16
- **Redis** 7 (optional locally — the API falls back to `localhost:6379`)
- **npm**

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Johnell-Empuerto/UnivoHR.git
cd UnivoHR

npm --prefix Backend install
npm --prefix Frontend install
```

### 2. Configure environment

```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
```

**Backend (`Backend/.env`)**

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3002` | API port |
| `NODE_ENV` | `development` | Environment |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `5432` / `postgres` / — / `smart_hrms_attendance` | PostgreSQL connection |
| `JWT_SECRET` | — | Token signing secret (**required**) |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Cache & Bull queue |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `DEVICE_API_KEY` | — | Required in production for device API |
| `API_READ_LIMIT` / `API_WRITE_LIMIT` / `API_RATE_WINDOW_MINUTES` | `1000` / `300` / `15` | Tiered rate limiting |
| `WORKER_ENABLED` | `true` | Enable background worker |

**Frontend (`Frontend/.env`)**

| Variable | Default |
|---|---|
| `VITE_API_URL` | `http://localhost:3002/api` |

### 3. Create the database & run migrations

Migrations are **manual, numbered SQL files** in `Backend/database/` — apply them in numeric order. For a full reset, use the fresh-start script (admin use only).

```bash
createdb -U postgres smart_hrms_attendance

$env:PGPASSWORD = "your_password"
psql -U postgres -d smart_hrms_attendance -f "Backend/database/001_safe_migration.sql" --echo-errors
# ...continue 002, 003, ... in order
```

> Always back up first: `npm --prefix Backend run backup:db`
> See `Backend/database/MIGRATION_GUIDE.md` for the full procedure and rollback notes.
> `Backend/database/deployment_full_fresh_start.sql` recreates a clean dataset and seeds an `admin` user (fresh deployments: **admin / admin123** — change it immediately).

### 4. Run

```bash
# API + queue worker together
npm --prefix Backend run dev:all

# or separately
npm --prefix Backend run dev        # API on http://localhost:3002
npm --prefix Backend run worker     # Bull queue worker

# Frontend on http://localhost:5173
npm --prefix Frontend run dev
```

---

## Scripts

**Backend** (`Backend/`)

| Command | Description |
|---|---|
| `npm run dev` | API with nodemon |
| `npm run start` | API (production) |
| `npm run worker` / `npm run dev:worker` | Queue worker |
| `npm run dev:all` | API + worker concurrently |
| `npm test` | Jest test suite (`--runInBand`) |
| `npm run backup:db` | PostgreSQL backup via PowerShell |

**Frontend** (`Frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

---

## Testing & CI

- Backend: `Backend/tests/` — Jest + Supertest covering services, middleware, and endpoints. Run with `npm --prefix Backend test`.
- Frontend: `npm --prefix Frontend run lint` and `npm --prefix Frontend run build`.
- GitHub Actions on push/PR to `main`:
  - **Backend Tests** — Node 20, Redis 7 service, `npm test`
  - **Frontend Build** — Node 22, `vite build` + `tsc`

---

## API Overview

- Base URL: `http://localhost:3002/api`
- Health check: `GET /api/health` (public)
- Auth: `POST /api/auth/login`, `/verify-otp`, `/resend-otp`, `/forgot-password`, `/reset-password`, `/refresh`, `/logout`, `PUT /api/auth/change-password`
- All other routers (`/api/employees`, `/api/attendance`, `/api/payroll`, `/api/leave`, `/api/applicants`, `/api/reports`, …) require a JWT bearer token and are subject to role/permission checks and rate limits.

---

## Database Operations

```bash
npm --prefix Backend run backup:db      # backup
Backend/scripts/restore.ps1             # restore
```

Docs: `Backend/database/MIGRATION_GUIDE.md`, `DATABASE_OPERATIONS_CHECKLIST.md`, `backups/RESTORE_GUIDE.md`.

---

## License

ISC
