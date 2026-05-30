# Frontend Role-Based Visibility Audit — Smart HRMS (UnivoHR)

**Date:** 2026-05-30  
**Scope:** Sidebar, route guards, page-level tabs, and CRUD buttons  
**Roles:** SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER, EMPLOYEE  
**Backend note:** API authorization is assumed correct on the server side. This audit is **frontend UX only**.

---

## 1. Role-to-Menu Matrix (Sidebar Visibility)

| Menu Item                   | SYSTEM_ADMIN | ADMIN | HR_USER | PAYROLL_USER | EMPLOYEE |
|-----------------------------|:---:|:---:|:---:|:---:|:---:|
| Dashboard                   |  Y  |  Y  |  Y  |  Y  |  Y  |
| Attendance                  |  Y  |  Y  |  Y  |  Y  |  Y  |
| Anomalies                   |  -  |  Y  |  Y  |  -  |  -  |
| HR Policies                 |  Y  |  Y  |  Y  |  Y  |  Y  |
| Manage Leaves / My Leaves   |  Y  |  Y  |  Y  |  Y  |  Y  |
| Performance (KPI)           |  -  |  Y  |  Y  |  -  |  -  |
| Forms                       |  -  |  Y  |  Y  |  -  |  -  |
| Evaluator                   |  -  |  -  |  -  |  -  |  *  |
| Employee KPI (self)         |  Y  |  Y  |  Y  |  Y  |  Y  |
| Overtime                    |  Y  |  Y  |  Y  |  Y  |  Y  |
| Man Hours                   |  Y  |  Y  |  Y  |  Y  |  Y  |
| **Employees**               |  Y  |  Y  |  Y  |  Y  |  -  |
| Recruitment                 |  -  |  Y  |  Y  |  -  |  -  |
| **Reports**                 |  -  |  Y  |  Y  |  -  |  -  |
| **Payroll**                 |  Y  |  Y  |  Y  |  Y  |  Y  |
| My Benefits                 |  Y  |  Y  |  Y  |  Y  |  Y  |
| Calendar                    |  Y  |  Y  |  Y  |  Y  |  Y  |
| Accounts                    |  Y  |  Y  |  -  |  -  |  -  |
| Branches                    |  Y  |  Y  |  -  |  -  |  -  |
| Settings                    |  Y  |  Y  |  -  |  -  |  -  |

`*` = only if user is an assigned evaluator  
Sidebar source: `Frontend/src/components/layout/Sidebar.tsx`

### Sidebar Verdict: CORRECT
The sidebar already applies proper role-based conditional rendering for all menu items. No changes needed.

---

## 2. Role-to-Page Matrix (Route Access)

| Route                       | SYSTEM_ADMIN | ADMIN | HR_USER | PAYROLL_USER | EMPLOYEE | Guarded? |
|-----------------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| `/dashboard`                |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |
| `/attendance`               |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |
| `/employees`                |**Y**|**Y**|**Y**|**Y**|**Y**|**NO GUARD**|
| `/payroll`                  |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only* |
| `/leaves`                   |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only* |
| `/my-benefits`              |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |
| `/reports`                  |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/calendar`                 |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |
| `/settings`                 |**Y**|**Y**|**Y**|**Y**|**Y**|**NO GUARD**|
| `/myovertime`               |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |
| `/users`                    |**Y**|**Y**|**Y**|**Y**|**Y**|**NO GUARD**|
| `/branches`                 |  Y  |  Y  |  -  |  -  |  -  | YES |
| `/overtime`                 |  -  |  Y  |  Y  |  -  |  *  | YES |
| `/manhours-approval`        |  -  |  Y  |  Y  |  -  |  *  | YES |
| `/anomalies`                |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/recruitment/*`            |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/kpi/templates`            |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/kpi/evaluations`          |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/kpi/my-evaluations`       |  Y  |  Y  |  Y  |  Y  |  *  | YES |
| `/my-performance/*`         |  Y  |  Y  |  Y  |  Y  |  *  | YES |
| `/hr-forms/*`               |  -  |  Y  |  Y  |  -  |  -  | YES |
| `/my-forms/*`               |  Y  |  Y  |  Y  |  Y  |  *  | YES |
| `/hr-policies`              |  Y  |  Y  |  Y  |  Y  |  Y  | Auth only |

`*` = `/payroll` routes ADMIN/PAYROLL_USER to PayRollPage, everyone else to EmployeePayrollPage  
`*` = `/leaves` routes ADMIN to AdminLeavePage, everyone else to LeavePage  
`*` = `/overtime`, `/manhours-approval`, `/kpi/my-evaluations`, `/my-performance/*`, `/my-forms/*` are guarded by approver/employee_id checks  
Route source: `Frontend/src/app/routes/routes.tsx`

## 3. UNAUTHORIZED ACCESS FINDINGS

### 🔴 CRITICAL — Missing Route Guards

#### Finding 1: `/employees` has NO role guard (routes.tsx:161)
Any authenticated user can navigate to `http://app/employees` and see the Employee List page.

**Impact:** EMPLOYEE role sees the full employee list with employee names, codes, departments, positions, and status. `canView` is `false` for EMPLOYEE, so the View Details button is hidden, but the table rows are still rendered (employee names, codes, etc. are visible in the table).

**File:** `Frontend/src/app/routes/routes.tsx:161`
```tsx
<Route path="/employees" element={<EmployeeList />} />
```

#### Finding 2: `/settings` has NO role guard (routes.tsx:197)
Any authenticated user can navigate to `http://app/settings` and see the System Settings page.

**Impact:** EMPLOYEE and PAYROLL_USER can see and interact with all settings tabs (Attendance, Pay Rules, SMTP, Approvals, Notifications, Email Templates, Branding).

**File:** `Frontend/src/app/routes/routes.tsx:197`
```tsx
<Route path="/settings" element={<Setting />} />
```

#### Finding 3: `/users` has NO role guard (routes.tsx:200)
Any authenticated user can navigate to `http://app/users` and see the User Accounts page.

**Impact:** HR_USER, PAYROLL_USER, and EMPLOYEE can see all system user accounts, create/edit/delete users.

**File:** `Frontend/src/app/routes/routes.tsx:200`
```tsx
<Route path="/users" element={<Users />} />
```

---

### 🟠 HIGH — Unauthorized Tab Visibility

#### Finding 4: Settings tabs not gated (Setting.tsx:42-77)
All 7 tabs (Attendance, Pay Rules, Approvals, SMTP, Notifications, Email Templates, Branding) are rendered unconditionally. Any role that can reach `/settings` sees ALL tabs.

**File:** `Frontend/src/features/settings/pages/Setting.tsx:42-77`

Tab | Visible to | Should be
---|---|---
SMTP | All roles reaching Settings | SYSTEM_ADMIN only
Email Templates | All roles reaching Settings | SYSTEM_ADMIN only
Branding | All roles reaching Settings | SYSTEM_ADMIN only
Pay Rules | All roles reaching Settings | SYSTEM_ADMIN, ADMIN
Attendance | All roles reaching Settings | SYSTEM_ADMIN, ADMIN
Approvals | All roles reaching Settings | SYSTEM_ADMIN, ADMIN
Notifications | All roles reaching Settings | SYSTEM_ADMIN, ADMIN

#### Finding 5: Reports — Payroll tab visible to HR_USER (ReportsPage.tsx:910-916)
All 6 tabs are rendered unconditionally for any role accessing Reports.

**File:** `Frontend/src/features/reports/pages/ReportsPage.tsx:910-916`

Tab | Visible to | Should be
---|---|---
Payroll | ADMIN, HR_USER | ADMIN, PAYROLL_USER only
Employee | ADMIN, HR_USER | ADMIN, HR_USER (correct)
Leave | ADMIN, HR_USER | ADMIN, HR_USER (correct)
Attendance | ADMIN, HR_USER | ADMIN, HR_USER (correct)
Benefits | ADMIN, HR_USER | ADMIN, HR_USER (correct)
Performance | ADMIN, HR_USER | ADMIN, HR_USER (correct)

---

### 🟡 MEDIUM — Unauthorized Button Visibility

#### Finding 6: Users page buttons visible without route guard (Users.tsx:212)
The "Add User", Edit, and Delete buttons are rendered for any role that reaches `/users`. Since there is no route guard, SYSTEM_ADMIN, ADMIN, HR_USER, PAYROLL_USER, and EMPLOYEE can all see these buttons if they type the URL.

**File:** `Frontend/src/features/users/pages/Users.tsx:212-215`
```tsx
<Button onClick={handleAddNew} className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  Add User
</Button>
```

#### Finding 7: Applicants page buttons not gated by role (ApplicantsPage.tsx:176-178, 213-215)
The "Add Applicant" button and Delete button have no role-based conditions. The route is guarded to ADMIN/HR_USER only, but if a new role is granted route access in the future, these buttons would be exposed.

**File:** `Frontend/src/features/recruitment/pages/ApplicantsPage.tsx:176-178, 213-215`

Recommendation: Gate behind `user?.role === "ADMIN"` for destructive operations (Delete).

#### Finding 8: AdminLeavePage — HR_USER gets employee LeavePage instead of admin view
The route at `routes.tsx:172-177` sends HR_USER to `LeavePage` (employee self-service) instead of `AdminLeavePage`.

**File:** `Frontend/src/app/routes/routes.tsx:172-177`
```tsx
<Route
  path="/leaves"
  element={
    user?.role === "ADMIN" ? <AdminLeavePage /> : <LeavePage />
  }
/>
```

HR_USER can approve/reject leaves (sidebar shows "Manage Leaves" via `canApprove()`), but when they click `/leaves`, they get the employee view without the admin approval buttons. They can still approve through the admin leave route if the route is adjusted.

---

## 4. Summary of Issues by Severity

| # | Severity | Issue | File | Line |
|---|----------|-------|------|------|
| 1 | 🔴 CRITICAL | `/employees` route has no role guard | `routes.tsx` | 161 |
| 2 | 🔴 CRITICAL | `/settings` route has no role guard | `routes.tsx` | 197 |
| 3 | 🔴 CRITICAL | `/users` route has no role guard | `routes.tsx` | 200 |
| 4 | 🟠 HIGH | Settings tabs (SMTP, Email Templates, Branding) not gated | `Setting.tsx` | 42-77 |
| 5 | 🟠 HIGH | Reports Payroll tab visible to HR_USER | `ReportsPage.tsx` | 910-916 |
| 6 | 🟡 MEDIUM | Users buttons visible without route guard | `Users.tsx` | 212 |
| 7 | 🟡 MEDIUM | Applicants buttons not role-gated | `ApplicantsPage.tsx` | 176 |
| 8 | 🟡 MEDIUM | HR_USER gets employee LeavePage instead of admin view | `routes.tsx` | 172-177 |

---

## 5. Recommended Fixes

### Fix 1: Add route guard for `/employees` (routes.tsx:161)

**Before:**
```tsx
<Route path="/employees" element={<EmployeeList />} />
```

**After:**
```tsx
<Route
  path="/employees"
  element={
    user?.role === "SYSTEM_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "HR_USER" ||
    user?.role === "PAYROLL_USER" ? (
      <EmployeeList />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/>
```

### Fix 2: Add route guard for `/settings` (routes.tsx:197)

**Before:**
```tsx
<Route path="/settings" element={<Setting />} />
```

**After:**
```tsx
<Route
  path="/settings"
  element={
    user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN" ? (
      <Setting />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/>
```

### Fix 3: Add route guard for `/users` (routes.tsx:200)

**Before:**
```tsx
<Route path="/users" element={<Users />} />
```

**After:**
```tsx
<Route
  path="/users"
  element={
    user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN" ? (
      <Users />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/>
```

### Fix 4: Gate settings tabs per role (Setting.tsx:15-78)

**Before (entire component):**
```tsx
const Setting = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  return (
    <div className="space-y-6 p-6">
      ...
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full gap-2 overflow-x-auto">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payrules">Pay Rules</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        ...
      </Tabs>
    </div>
  );
};
```

**After:**
```tsx
import { useAuth } from "@/app/providers/AuthProvider";

const Setting = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");
  const role = user?.role;

  const canViewAttendance = role === "SYSTEM_ADMIN" || role === "ADMIN";
  const canViewPayRules = role === "SYSTEM_ADMIN" || role === "ADMIN";
  const canViewApprovals = role === "SYSTEM_ADMIN" || role === "ADMIN";
  const canViewSMTP = role === "SYSTEM_ADMIN";
  const canViewNotifications = role === "SYSTEM_ADMIN" || role === "ADMIN";
  const canViewEmailTemplates = role === "SYSTEM_ADMIN";
  const canViewBranding = role === "SYSTEM_ADMIN";

  return (
    <div className="space-y-6 p-6">
      ...
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full gap-2 overflow-x-auto">
          {canViewAttendance && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
          {canViewPayRules && <TabsTrigger value="payrules">Pay Rules</TabsTrigger>}
          {canViewApprovals && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {canViewSMTP && <TabsTrigger value="smtp">SMTP</TabsTrigger>}
          {canViewNotifications && <TabsTrigger value="notifications">Notifications</TabsTrigger>}
          {canViewEmailTemplates && <TabsTrigger value="email-templates">Email Templates</TabsTrigger>}
          {canViewBranding && <TabsTrigger value="branding">Branding</TabsTrigger>}
        </TabsList>
        {canViewAttendance && <TabsContent value="attendance"><AttendanceSettings /></TabsContent>}
        {canViewPayRules && <TabsContent value="payrules"><PayRulesSettings /></TabsContent>}
        {canViewApprovals && <TabsContent value="approvals"><ApprovalSettings /></TabsContent>}
        {canViewSMTP && <TabsContent value="smtp"><SMTPSettings /></TabsContent>}
        {canViewNotifications && <TabsContent value="notifications"><NotificationSettings /></TabsContent>}
        {canViewEmailTemplates && <TabsContent value="email-templates"><EmailTemplateEditor /></TabsContent>}
        {canViewBranding && <TabsContent value="branding"><CompanyBranding /></TabsContent>}
      </Tabs>
    </div>
  );
};
```

### Fix 5: Gate Reports Payroll tab per role (ReportsPage.tsx:909-917)

**Before:**
```tsx
<TabsList className="flex w-full gap-2 overflow-x-auto">
  <TabsTrigger value="employees">Employee</TabsTrigger>
  <TabsTrigger value="leaves">Leave</TabsTrigger>
  <TabsTrigger value="attendance">Attendance</TabsTrigger>
  <TabsTrigger value="payroll">Payroll</TabsTrigger>
  <TabsTrigger value="benefits">Benefits</TabsTrigger>
  <TabsTrigger value="performance">Performance</TabsTrigger>
</TabsList>
```

**After:**
```tsx
// At top of component, import useAuth:
// import { useAuth } from "@/app/providers/AuthProvider";
// const { user } = useAuth();

<TabsList className="flex w-full gap-2 overflow-x-auto">
  <TabsTrigger value="employees">Employee</TabsTrigger>
  <TabsTrigger value="leaves">Leave</TabsTrigger>
  <TabsTrigger value="attendance">Attendance</TabsTrigger>
  {(user?.role === "ADMIN" || user?.role === "PAYROLL_USER") && (
    <TabsTrigger value="payroll">Payroll</TabsTrigger>
  )}
  <TabsTrigger value="benefits">Benefits</TabsTrigger>
  <TabsTrigger value="performance">Performance</TabsTrigger>
</TabsList>
```

### Fix 6: Gate Users page buttons per role (Users.tsx:109-123)

**Before:**
```tsx
const handleAddNew = () => { ... };
const handleEdit = (user: User) => { ... };
const handleDelete = (id: number, username: string) => { ... };
```

**After:** (add role gating + pass canEdit/canDelete props to UsersTable)

```tsx
const { user } = useAuth(); // add import
const canManage = user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN";
```

Then wrap Add User button:
```tsx
{canManage && (
  <Button onClick={handleAddNew} className="flex items-center gap-2">
    <Plus className="h-4 w-4" />
    Add User
  </Button>
)}
```

And pass `canManage` to `UsersTable` to gate Edit/Delete buttons (requires adding a new prop to UsersTable component).

### Fix 7: Gate Applicants destructive buttons per role (ApplicantsPage.tsx)

Wrap Add Applicant button and Delete button:
```tsx
// At top: import { useAuth } from "@/app/providers/AuthProvider";
// const { user } = useAuth();
const canDelete = user?.role === "ADMIN";
```

Then on Delete button:
```tsx
{canDelete && (
  <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(a.id)}>
    <Trash2 className="h-4 w-4 text-red-500" />
  </Button>
)}
```

### Fix 8: Allow HR_USER to access AdminLeavePage (routes.tsx:172-177)

**Before:**
```tsx
element={
  user?.role === "ADMIN" ? <AdminLeavePage /> : <LeavePage />
}
```

**After:**
```tsx
element={
  user?.role === "ADMIN" || user?.role === "HR_USER" ? (
    <AdminLeavePage />
  ) : (
    <LeavePage />
  )
}
```

Also update AdminLeavePage tabs to gate conversion/credits/settings tabs behind `user?.role === "ADMIN"` only:

```tsx
// AdminLeavePage.tsx
const { user } = useAuth();

<TabsList className="flex w-full gap-2 overflow-x-auto">
  <TabsTrigger value="requests">Leave Requests</TabsTrigger>
  <TabsTrigger value="history">Conversion History</TabsTrigger>
  {user?.role === "ADMIN" && <TabsTrigger value="settings">Conversion Settings</TabsTrigger>}
  {user?.role === "ADMIN" && <TabsTrigger value="credits">Leave Credits</TabsTrigger>}
</TabsList>
```

---

## 6. Files to Modify

| File | Changes Needed |
|------|---------------|
| `Frontend/src/app/routes/routes.tsx` | Add route guards for `/employees` (line 161), `/settings` (line 197), `/users` (line 200); expand `/leaves` guard to include HR_USER (line 172) |
| `Frontend/src/features/settings/pages/Setting.tsx` | Add `useAuth`, gate all 7 tabs by role |
| `Frontend/src/features/reports/pages/ReportsPage.tsx` | Add `useAuth`, gate Payroll tab to ADMIN/PAYROLL_USER |
| `Frontend/src/features/users/pages/Users.tsx` | Add `useAuth`, gate Add/Edit/Delete buttons by role + pass prop to UsersTable |
| `Frontend/src/features/users/components/UsersTable.tsx` | Accept `canManage` prop, gate Edit/Delete buttons |
| `Frontend/src/features/leaves/pages/AdminLeavePage.tsx` | Add `useAuth`, gate Conversion Settings/Credits tabs to ADMIN only |
| `Frontend/src/features/recruitment/pages/ApplicantsPage.tsx` | Add `useAuth`, gate Delete button to ADMIN only |

---

## 7. Existing Good Patterns (No Changes Needed)

- **EmployeeTable.tsx** — Already accepts `canEdit`, `canCreate`, `canView` props. EmployeeList.tsx already passes them correctly.
- **LeaveTable.tsx** — Already accepts `isAdmin` prop for gating approve/reject buttons.
- **Sidebar.tsx** — All menu items are already properly role-gated.
- **PayRollPage.tsx** — Settings tab already gated to SYSTEM_ADMIN/ADMIN; main tabs correctly limited by route guard.
- **BranchesPage.tsx** — Route is guarded, but buttons should ideally be gated too for defense-in-depth (lower priority).
