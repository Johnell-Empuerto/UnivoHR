# Smart HRMS – Full System Analysis Report

**Date:** 2026-05-26
**Scope:** Backend, Frontend, Database, Security, AI Readiness

---

## 1. Project Overview

- **Type:** HRIS / Attendance / Payroll / Leave management system
- **Backend:** Node.js 22 + Express 5 + PostgreSQL 16 + Redis + Bull queues + Socket.IO
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 + shadcn/ui + Recharts
- **Auth:** JWT (access + refresh tokens) with role-based access (ADMIN, HR_ADMIN, HR, EMPLOYEE)
- **Monorepo structure:** `/backend` (API server) + `/frontend` (SPA client)

---

## 2. Backend Architecture

### Core
- Express 5 server on port **3003**
- CORS enabled, JSON body parser, cookie parser, rate limiting, compression, helmet
- Static file serving from `/uploads`
- Socket.IO for real-time notifications
- 28 route files, 28 controllers, 37 services, 25 models, 10 middleware files

### Middleware Chain
```
authMiddleware → roleMiddleware → branchMiddleware (optional: validateBranchAccess)
→ rateLimiter → auditLogger → controller
```

### Route Registry (`backend/index.js`)
```
/api/auth              → auth.routes
/api/users             → user.routes
/api/employees         → employee.routes
/api/attendance        → attendance.routes
/api/payroll           → payroll.routes
/api/leaves            → leave.routes
/api/branches          → branch.routes
/api/devices           → device.routes
/api/overtime          → overtime.routes
/api/notifications     → notification.routes
/api/audit-logs        → auditLog.routes
/api/anomalies         → anomaly.routes (Phase 3.1 rule-based)
/api/stats-anomaly     → statisticalAnomaly.routes (Phase 3.3)
/api/forecast          → forecast.routes (Phase 3.4)
/api/drilldown         → drilldown.routes (Phase 3.2)
/api/analytics         → analytics.routes (Phase 3.5)
/api/system            → system.routes
/api/email             → email.routes
/api/reports           → reports.routes
/api/approval          → approval.routes
/api/templates         → template.routes
/api/man-hours         → manHour.routes
/api/time-modification → timeModification.routes
/api/company           → company.routes
/api/final-pay         → finalPay.routes
```

### Bull Queues (via worker.js)
| Queue Name | Schedule | Purpose |
|---|---|---|
| attendance-notifications | Daily 8PM | Process daily attendance |
| payslip-email | Per-request | Send payslip emails |
| stat-anomaly-scans | Daily 2:30AM, Weekly Mon 3:30AM | Statistical anomaly detection |
| forecast-generation | Daily 4AM, Weekly Mon 4:30AM | Generate forecast predictions |

### Service Layer Pattern
- **models/** – Raw SQL queries via `pg` pool (no ORM)
- **services/** – Business logic (calls models, optionally other services)
- **controllers/** – Request parsing, validation, response formatting
- **routes/** – Wire endpoints with middleware

---

## 3. Frontend Architecture

### Build & Config
- Vite 6 build
- Tailwind CSS 4 with shadcn/ui theming
- TypeScript strict mode
- `baseUrl: "src"` path aliases

### Route Structure (React Router v7)
```
/ → redirect to /dashboard
/login
/dashboard            → Dashboard.tsx
/employees            → EmployeeList.tsx + EmployeeForm.tsx
/attendance           → AttendancePage.tsx
/payroll              → PayrollPage.tsx
/leaves               → LeavePage.tsx
/analytics            → AnalyticsPage.tsx
/anomalies            → AnomalyPage.tsx
/users                → UserManagementPage.tsx
/branches             → BranchPage.tsx
/devices              → DevicePage.tsx
/overtime             → OvertimePage.tsx
/notifications        → NotificationPage.tsx
/system               → SystemPage.tsx
/reports              → ReportsPage.tsx
/man-hours            → ManHourPage.tsx
/approval             → ApprovalPage.tsx
/final-pay            → FinalPayPage.tsx
/templates            → TemplatePage.tsx
/time-modification    → TimeModificationPage.tsx
/company              → CompanyPage.tsx
```

### Auth Flow
1. Login → POST `/api/auth/login` → returns `{ accessToken, refreshToken }`
2. Tokens stored in localStorage / httpOnly cookies
3. `api.ts` Axios interceptor: on 401 → attempt refresh → on refresh fail → **session expired modal**
4. `AuthProvider.tsx` manages: `user`, `isAuth`, `isSessionExpired`, `handleSessionExpiredOk()`

### Dashboard Layout
```
<AppShell> (sidebar + topbar + main)
  ├── StatsCard[] (summary KPIs)
  ├── AnomalyAlert[] (Phase 3.1 rule-based alerts)
  ├── StatInsightCard (Phase 3.3 – anomaly trend chart)
  ├── ChartGrid (attendance line, payroll bar, leave bar, overtime line)
  ├── ForecastCard (Phase 3.4 – prediction cards)
  ├── DrilldownDrawer (triggered by chart clicks)
  └── RecentAnomalies table
```

---

## 4. Database Schema – 36 Tables

### Core Tables (5)
| Table | Purpose | Key Columns | Rows |
|---|---|---|---|
| employees | Master employee data | id, employee_no, full_name, department, position, branch_id, face_image, face_descriptor, status | ~5,110 |
| users | System users | id, username, password_hash, role, employee_id, is_active | 1 |
| branches | Company branches | id, code, name, address, is_active | 2 |
| user_branch_access | Branch scope for HR roles | user_id, branch_id | ~1,750 |
| audit_logs | All user actions | id, user_id, action, entity_type, entity_id, details, ip_address, created_at | ~23 |

### Attendance (5)
| Table | Purpose | Key Columns |
|---|---|---|
| attendance | Daily attendance records | id, employee_id, date, time_in, time_out, status, hours_worked, late_minutes, undertime_minutes, deductions |
| attendance_rules | Attendance policy rules | id, rule_name, grace_period_minutes, late_threshold, undertime_threshold |
| calendar_days | Working/non-working days | date, is_working_day, day_type, description |
| devices | Biometric devices | id, device_id, name, branch_id, is_active |
| raw_logs | Raw device logs | id, device_id, employee_no, timestamp, type |

### Leaves (6)
| Table | Purpose | Key Columns |
|---|---|---|
| leaves | Leave requests | id, employee_id, leave_type_id, start_date, end_date, status, reason, approved_by |
| leave_credits | Employee leave balances | id, employee_id, leave_type_id, total_credits, used_credits, remaining |
| leave_types | Leave type definitions | id, name, code, is_paid, requires_approval, max_days_per_year |
| leave_conversions | Leave conversion requests | id, employee_id, from_leave_type, to_leave_type, days, status |
| conversion_logs | Conversion audit trail | id, conversion_id, action, performed_by, timestamp |
| time_modification_requests | Time edit requests | id, employee_id, date, type, reason, status |

### Payroll (7)
| Table | Purpose | Key Columns |
|---|---|---|
| payroll | Payroll records | id, employee_id, period_start, period_end, gross_pay, total_deductions, net_pay, status |
| employee_salary | Employee salary info | id, employee_id, basic_salary, hourly_rate, effective_date |
| employee_deductions | Per-employee deductions | id, employee_id, deduction_name, amount, is_recurring |
| pay_rules | Pay calculation rules | id, rule_name, rule_type, value, description |
| final_pay | Final pay calculations | id, employee_id, separation_date, total_amount, status |
| smtp_settings | Email config | id, host, port, username |
| email_logs | Email send history | id, recipient, subject, status, sent_at |

### Overtime (1)
| Table | Purpose | Key Columns |
|---|---|---|
| overtime_requests | Overtime requests | id, employee_id, date, hours_requested, hours_approved, status |

### Anomaly & Forecasting (2)
| Table | Purpose | Key Columns | Rows |
|---|---|---|---|
| anomaly_logs | Rule-based + stat anomalies | id, employee_id, anomaly_type, severity, description, status, anomaly_score, confidence, baseline_value, statistical_method | 0 |
| forecast_logs | Forecast predictions | id, forecast_type, period_start, period_end, predicted_value, actual_value, confidence_level, method, status | 6 |

### Other (10)
| Table | Purpose |
|---|---|
| notifications | System notifications |
| system_settings | System configuration |
| company_settings | Company configuration |
| email_templates | Email template store |
| approval_logs | Approval action audit |
| man_hour_reports | Man-hour report headers |
| man_hour_report_details | Man-hour report line items |
| overtime_requests | Overtime requests |
| conversion_logs | Leave conversion audit |
| approval_logs | Approval action audit |

### Entity Relationships (Simplified ERD)
```
branches (1) ──< employees (N) ──< attendance (N)
branches (1) ──< users (N) ──< user_branch_access (N) ──> branches (N)
employees (1) ──< users (1)
employees (1) ──< leaves (N)
employees (1) ──< payroll (N)
employees (1) ──< employee_salary (N)
employees (1) ──< employee_deductions (N)
employees (1) ──< overtime_requests (N)
employees (1) ──< leave_credits (N)
employees (1) ──< anomaly_logs (N)
leave_types (1) ──< leaves (N)
leave_types (1) ──< leave_credits (N)
leave_types (1) ──< leave_conversions (N)
```

---

## 5. Data Readiness for AI Assistant

### Q: What questions can the system answer today?

| Question Category | Data Available | Source |
|---|---|---|
| "What's my attendance summary?" | ✅ Yes | attendance table + dashboard APIs |
| "Show me payroll for last cutoff" | ✅ Yes | payroll table + payroll APIs |
| "Why was this flagged as anomaly?" | ✅ Yes | anomaly_logs.description + anomaly_score |
| "What's the forecast for next month?" | ✅ Yes | forecast_logs table + forecast APIs |
| "Who was late this week?" | ✅ Yes | drilldown.attendance endpoint |
| "Absences by branch" | ✅ Yes | drilldown.branches endpoint |
| "Payroll comparison across departments" | ✅ Yes | analytics.department-comparison endpoint |
| "Anomaly trend over time" | ✅ Yes | analytics.anomaly-trend endpoint |
| "Who are my top 5 late employees?" | ✅ Yes | drilldown.attendance with sort/limit |

### Q: What is NOT ready for AI?

| Missing Capability | Why It Matters |
|---|---|
| ❌ No ai_chat_sessions table | Cannot persist conversation state |
| ❌ No ai_chat_messages table | Cannot store chat history |
| ❌ No ai_audit_logs table | Cannot audit what AI queries were made |
| ❌ No ai_feedback table | Cannot improve AI responses |
| ❌ No ai_query_templates table | Cannot standardize NL→SQL patterns |
| ❌ No embedding/vector storage | Cannot do semantic search on policies/docs |
| ❌ No LLM integration point | No service/endpoint for AI chat |
| ❌ No role-filtered query layer | No middleware to scope AI queries by user branch |

### Q: What PII/security considerations exist?

| Concern | Status |
|---|---|
| Employee names, photos, face descriptors stored | ⚠️ Sensitive – AI should never expose face_descriptor |
| Salary/financial data | ⚠️ Role-restricted – only ADMIN/HR_ADMIN |
| User passwords (hashed) | ✅ Not exposed by any API |
| Branch scoping for HR roles | ✅ user_branch_access enforces it |
| Audit logging for user actions | ✅ audit_logs table exists |
| Rate limiting | ✅ Applied globally |
| Token refresh / blacklisting | ✅ Implemented |

---

## 6. Security Architecture

| Layer | Mechanism | Status |
|---|---|---|
| Authentication | JWT access (15m) + refresh (7d) tokens | ✅ |
| Password hashing | bcrypt (hash_pw) | ✅ |
| Role enforcement | roleMiddleware(ROLES.ADMIN, ROLES.HR_ADMIN) | ✅ |
| Branch scoping | validateBranchAccess middleware | ✅ |
| Audit logging | auditLogger middleware | ✅ |
| Rate limiting | express-rate-limit (100 req/15m window) | ✅ |
| Input validation | Manual in controllers (no Joi/Zod) | ⚠️ Manual only |
| CORS | Configured for frontend origin | ✅ |
| Helmet | Security headers | ✅ |
| Token blacklisting | Via Redis on logout | ✅ |
| Session expiry modal | Frontend interceptor + Dialog | ✅ |
| SQL injection | Parameterized queries via pg | ✅ |

---

## 7. AI Assistant – Recommended Architecture

### Database Tables to Add
```sql
ai_chat_sessions (id, user_id, title, context, started_at, last_activity_at, status)
ai_chat_messages (id, session_id, role [user/assistant], content, metadata, created_at)
ai_audit_logs (id, user_id, session_id, query_type, query_text, response_summary, created_at)
ai_feedback (id, message_id, rating, comment, created_at)
ai_query_templates (id, name, category, template_text, parameters, required_role, is_active)
```

### Backend Layers Needed
1. **ai.routes.js** – POST /api/ai/chat, GET /api/ai/sessions, GET /api/ai/messages/:sessionId, POST /api/ai/feedback
2. **ai.controller.js** – Chat handler, session management, feedback collection
3. **ai.service.js** – Query classification, role-filtered data retrieval, LLM orchestration
4. **ai.middleware.js** – AI-specific rate limiting, audit logging
5. **aiChat.model.js**, **aiSession.model.js**, **aiFeedback.model.js** – DB operations

### AI Query Flow
```
User Query → AI Controller → Classify Intent → Identify Required Tables
→ Apply Role Filter (branch scope for HR) → Query DB → Format Response
→ Log to ai_audit_logs → Return to User
```

### Supported Query Templates (initial set)
1. `attendance_summary` – "Show my attendance for [period]"
2. `payroll_summary` – "What's my pay for [cutoff]?"
3. `anomaly_explain` – "Why was [anomaly_id] flagged?"
4. `forecast_query` – "What's the predicted attendance for [period]?"
5. `late_ranking` – "Who are the top late employees for [period]?"
6. `branch_comparison` – "Compare attendance across branches"
7. `leave_balance` – "How many leave days do I have left?"
8. `overtime_summary` – "What's my overtime for [period]?"

---

## 8. Key Metrics

| Metric | Value |
|---|---|
| Backend files | ~100+ (routes, controllers, services, models, middleware) |
| Frontend files | ~200+ (pages, components, services, hooks) |
| Database tables | 36 |
| Employees | ~5,110 |
| Users | 1 (admin) |
| Branches | 2 |
| Attendance records | Thousands (exact count unavailable due to stat staleness) |
| Payroll records | 3,868 |
| Anomaly logs | 0 (system operational, no anomalies triggered yet) |
| Forecast records | 6 |
| User-branch access rows | ~1,750 |

---

## 9. Identified Gaps

### Code Quality
- No input validation library (Joi/Zod) – manual checks only
- No automated test suite
- No TypeScript in backend
- No API documentation (Swagger/OpenAPI)

### Data
- Several pg_stat_user_tables estimates show 0 for tables with actual data (stats need refresh)
- anomaly_logs has 0 entries – system may need time to accumulate data or thresholds need tuning
- face_descriptor stored in employees table – binary blob, not queryable

### DevOps
- No CI/CD pipeline visible
- No migration runner (SQL files applied manually)
- No containerization (Dockerfile not detected)

---

## 10. Recommendations

### Immediate (Phase 4 prep)
1. Create AI chat tables (sessions, messages, audit, feedback, templates)
2. Build AI service with role-filtered query layer
3. Add ai.routes with session management
4. Integrate LLM (OpenAI / local model) for NL→SQL
5. Add input validation library (Zod recommended)

### Short-term
6. Add Swagger/OpenAPI docs for all endpoints
7. Refactor backend to TypeScript
8. Add unit/integration tests (Jest or Vitest)
9. Refresh database statistics (ANALYZE)
10. Add anomaly threshold tuning endpoint

### Long-term
11. Containerize with Docker
12. Add CI/CD pipeline
13. Implement vector embeddings for semantic search on HR policies
14. Add employee self-service AI chatbot
15. Implement predictive attrition models
