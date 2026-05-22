/**
 * Docs section → route → account role → UI highlights for Playwright capture.
 * Output: public/docs/screenshots/{id}.png
 *
 * auth roles: none | admin | employee
 * (hr_admin is fallback in capture script only when admin capture fails)
 */
export const docsScreenshotCaptures = [
  {
    id: "getting-started",
    route: "/login",
    auth: "none",
    highlights: [
      { selector: "#username", label: "1. Username" },
      { selector: "#password", label: "2. Password" },
      { selector: "button[type='submit']", label: "3. Sign in" },
    ],
  },
  {
    id: "login-authentication",
    route: "/login",
    auth: "none",
    highlights: [
      { selector: "#username", label: "Username" },
      { selector: "button[type='button']", label: "Forgot password" },
    ],
  },
  {
    id: "legal-pages",
    route: "/privacy",
    auth: "none",
    highlights: [{ selector: "h1", label: "Privacy policy" }],
  },
  {
    id: "dashboard",
    route: "/dashboard",
    auth: "admin",
    highlights: [
      { selector: "nav", label: "Sidebar menu" },
      { selector: "h1", label: "Dashboard overview" },
    ],
  },
  {
    id: "attendance",
    route: "/attendance",
    auth: "admin",
    highlights: [
      { selector: "[role='tablist']", label: "Attendance tabs" },
      { selector: "table", label: "Attendance records" },
    ],
  },
  {
    id: "leaves",
    route: "/leaves",
    auth: "admin",
    highlights: [
      { selector: "[role='tablist']", label: "Leave tabs" },
      { selector: "table", label: "Leave requests" },
    ],
  },
  {
    id: "overtime-my",
    route: "/myovertime",
    auth: "employee",
    highlights: [
      { selector: "h1", label: "My Overtime" },
      { selector: "button", label: "New request" },
    ],
  },
  {
    id: "overtime-manage",
    route: "/overtime",
    auth: "admin",
    highlights: [
      { selector: "h1", label: "Manage Overtime" },
      { selector: "table", label: "Approval queue" },
    ],
  },
  {
    id: "manhours-my",
    route: "/my-manhours",
    auth: "employee",
    highlights: [
      { selector: "[role='tablist']", label: "Man hours tabs" },
      { selector: "button", label: "Add report" },
    ],
  },
  {
    id: "manhours-approval",
    route: "/manhours-approval",
    auth: "admin",
    highlights: [
      { selector: "h1", label: "Approve Man Hours" },
      { selector: "table", label: "Reports to review" },
    ],
  },
  {
    id: "employees",
    route: "/employees",
    auth: "admin",
    highlights: [
      { selector: "input[placeholder*='Search']", label: "Search employees" },
      { selector: "table", label: "Employee list" },
    ],
  },
  {
    id: "payroll-admin",
    route: "/payroll",
    auth: "admin",
    highlights: [
      { selector: "[role='tablist']", label: "Payroll tabs" },
      { selector: "table", label: "Payroll records" },
    ],
  },
  {
    id: "payroll-employee",
    route: "/payroll",
    auth: "employee",
    highlights: [
      { selector: "h1", label: "My Payroll" },
      { selector: "table", label: "Payslip history" },
    ],
  },
  {
    id: "calendar",
    route: "/calendar",
    auth: "admin",
    highlights: [
      { selector: ".fc-view-harness", label: "Calendar view" },
      { selector: "h1, h2", label: "Holiday management" },
    ],
  },
  {
    id: "accounts-users",
    route: "/users",
    auth: "admin",
    highlights: [
      { selector: "button", label: "Add user" },
      { selector: "table", label: "Accounts table" },
    ],
  },
  {
    id: "settings",
    route: "/settings",
    auth: "admin",
    highlights: [
      { selector: "[role='tablist']", label: "Settings tabs" },
      { selector: "h1", label: "System settings" },
    ],
  },
  {
    id: "notifications",
    route: "/notifications",
    auth: "admin",
    highlights: [
      { selector: "h1", label: "Notifications" },
      { selector: "button", label: "Mark all read" },
    ],
  },
  {
    id: "profile",
    route: "/profile",
    auth: "admin",
    highlights: [
      { selector: "h1", label: "Profile" },
      { selector: "[class*='Card']", label: "Employee details" },
    ],
  },
];

export const docsScreenshotIds = docsScreenshotCaptures.map((c) => c.id);
