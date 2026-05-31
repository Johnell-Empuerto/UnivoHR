You're right! Let me write a **clean, simple text explanation** of how your system works - easy to read and present.

---

# 📋 ATTENDANCE & PAYROLL SYSTEM - HOW IT WORKS

## 🏗️ HIGH LEVEL OVERVIEW

```
User/Device → Frontend → API Gateway → Middleware → Controller → Service → Database → External
```

---

## 🔐 1. LOGIN FLOW

```
1. User opens Login Page (/login)
2. Enters username + password
3. Frontend POST to /api/auth/login
4. JWT Auth → RBAC → Joi Validation (Middleware)
5. auth.controller receives request
6. auth.service checks:
   - Account locked? → users table
   - Valid credentials? → bcrypt.compare
7. If 2FA enabled:
   - Generate OTP → Store in Redis
   - Send email via SMTP
   - User enters OTP → Verify → Generate JWT
8. If 2FA disabled:
   - Generate JWT directly
9. Store token in localStorage
10. Redirect to /dashboard
```

---

## 📊 2. DASHBOARD FLOW

```
Admin User:
1. Opens Dashboard → GET /api/dashboard/summary
2. dashboard.controller → dashboard.service
3. Queries:
   - attendance table (count by status)
   - employees table (count active)
   - leaves table (count pending)
   - payroll table (sum totals)
4. Returns stats + charts

Employee User:
1. Opens Dashboard → GET /api/dashboard/me/summary
2. Same flow but WHERE employee_id = current user
3. Returns personal stats only
```

---

## 🖐️ 3. ATTENDANCE FLOW (ZKTeco MB560-VL)

```
Device Action:
1. Employee scans fingerprint/RFID on ZKTeco MB560-VL
2. Device POST to /api/device/logs
3. device.controller receives {rfid, timestamp}
4. device.service resolves rfid → employee_id (employees table)
5. attendance.service checks:
   - SELECT today's record from attendance table
   - Check duplicate scan (< 2 minutes = ignore)
6. Decision:
   - No check-in today → INSERT check_in_time
   - Has check-in, no check-out → UPDATE check_out_time
   - Already completed → ignore
7. Create notification → notifications table
8. Emit Socket.IO event → Frontend updates in real-time
9. Return {success: true} to device
```

---

## 🏖️ 4. LEAVE REQUEST FLOW

### Employee submits leave:

```
1. Employee opens Leave Page → GET /api/leaves/credits (show balance)
2. Fills form (dates, type, reason)
3. POST /api/leaves
4. leave.controller → leave.service
5. Check balance: leave_credits table
6. If insufficient → return error
7. If sufficient:
   - Find approver from employee_approvers table
   - INSERT into leaves table (status = PENDING)
   - INSERT notification for approver
   - Emit Socket.IO 'leave-request'
8. Return success
```

### Admin approves leave:

```
1. Admin sees notification → Opens Admin Leave Page
2. GET /api/leaves?status=PENDING
3. Reviews request → Approve/Reject
4. PUT /api/leaves/:id/status
5. leave.service updates:
   - UPDATE leaves SET status = APPROVED/REJECTED
   - If APPROVED: UPDATE leave_credits (deduct days)
   - INSERT into approval_logs table
   - UPDATE notifications table
6. Employee gets real-time notification
```

---

## 💰 5. PAYROLL GENERATION FLOW (MAIN FEATURE)

### Step 1: Generate Payroll

```
HR Admin:
1. Opens Payroll Page → Select cutoff dates
2. POST /api/payroll/generate

System Process:
3. payroll.controller → payroll.service
4. BEGIN TRANSACTION
5. SELECT active employees from employees table

6. FOR EACH employee:
   - SELECT attendance records for cutoff period
   - SELECT approved leaves (unpaid)
   - SELECT approved overtime (is_paid = true)
   - SELECT salary config from employee_salary
   - SELECT deductions from employee_deductions
   - SELECT pay rules from pay_rules table

   Calculate:
   - basic_pay = daily_rate × days_worked
   - overtime_pay = overtime_rate × OT_hours
   - total_deductions = late_deductions + absent_deductions + fixed_deductions
   - net_salary = basic_pay + overtime_pay - total_deductions

   INSERT into payroll table

7. COMMIT TRANSACTION
8. Return success
```

### Step 2: Mark as Paid & Send Payslip

```
HR Admin:
1. Click "Mark as Paid" button
2. PATCH /api/payroll/:id/pay

System Process:
3. UPDATE payroll SET status = 'PAID'
4. SELECT employee email from employees table
5. queue.service.addPayslipToQueue() → Bull Queue adds job

Worker Process (Separate):
6. Worker picks up job from Queue
7. Generate PDF payslip
8. Send email via SMTP
9. INSERT into email_logs table
10. Employee receives email with payslip
```

---

## ⏱️ 6. OVERTIME FLOW

```
Employee:
1. Opens My Overtime Page (/myovertime)
2. POST /api/overtime (date, hours, reason)
3. overtime.controller → overtime.service
4. INSERT into overtime_requests (status = PENDING)
5. Find approver → INSERT notification

Admin:
1. Opens Overtime Approvals Page
2. GET /api/overtime?status=PENDING
3. Reviews → Approve/Reject
4. PUT /api/overtime/:id/approve
5. UPDATE overtime_requests SET status = APPROVED
6. INSERT into approval_logs table

Payroll Impact:
- Only approved AND is_paid = true appear in payroll
- paid_in_payroll_id links to payroll record
```

---

## 📧 7. REAL-TIME NOTIFICATIONS (Socket.IO)

```
When event occurs (attendance scan, leave request, OT approval):

1. Service creates notification → INSERT into notifications table
2. notification.service emits Socket.IO event
3. Frontend listening for events updates UI immediately

Events:
- 'attendance-update' → Updates attendance page
- 'leave-request' → Admin sees new request
- 'overtime-request' → Approver sees request
- 'notification' → Bell icon updates
```

---

## 🗄️ 8. KEY DATABASE TABLES

| Table             | Purpose                                  |
| ----------------- | ---------------------------------------- |
| users             | Login accounts, roles, passwords         |
| employees         | Employee master data (name, email, RFID) |
| attendance        | Daily check-in/out records               |
| leaves            | Leave requests + status                  |
| leave_credits     | Available leave balances                 |
| payroll           | Generated payroll records                |
| overtime_requests | OT requests + approval status            |
| notifications     | In-app notifications                     |
| approval_logs     | Audit trail of approvals                 |
| devices           | Registered biometric devices             |

---

## 🔁 9. COMPLETE REQUEST PATH

```
Any request follows this exact path:

Browser/Device
    ↓ HTTP
API Endpoint (Express :3002)
    ↓
JWT Authentication (authenticate.js)
    ↓
RBAC Authorization (role.middleware.js)
    ↓
Joi Validation (validate.middleware.js)
    ↓
Controller (auth/attendance/leave/payroll/etc)
    ↓
Service (business logic)
    ↓
Database (PostgreSQL/Redis)
    ↓
Response back to client
```

---

## 🎯 10. SUMMARY - WHAT HAPPENS WHEN

| Action           | API Endpoint               | Controller | Service    | Tables                                             |
| ---------------- | -------------------------- | ---------- | ---------- | -------------------------------------------------- |
| Login            | POST /api/auth/login       | auth       | auth       | users, Redis                                       |
| Scan RFID        | POST /api/device/logs      | device     | attendance | employees, attendance                              |
| Submit Leave     | POST /api/leaves           | leave      | leave      | leaves, leave_credits                              |
| Approve Leave    | PUT /api/leaves/:id/status | leave      | leave      | leaves, leave_credits, approval_logs               |
| Generate Payroll | POST /api/payroll/generate | payroll    | payroll    | payroll, attendance, employees, salary, deductions |
| Mark Paid        | PATCH /api/payroll/:id/pay | payroll    | payroll    | payroll, Bull Queue                                |
