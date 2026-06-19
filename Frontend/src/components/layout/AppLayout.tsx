import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "./MainLayout";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/attendance": "Attendance",
  "/employees": "Employees",
  "/payroll": "Payroll",
  "/leaves": "Leaves",
  "/calendar": "Calendar",
  "/settings": "Settings",
  "/myovertime": "My Overtime",
  "/overtime": "Overtime Requests",
  "/notifications": "Notifications",
  "/users": "Users",
  "/my-manhours": "Man Hours",
  "/manhours-approval": "Man Hours Approval",
  "/profile": "Profile",
  "/hr-policies": "HR Policies",
  "/branches": "Branches",
  "/anomalies": "Anomalies",
  "/my-benefits": "Benefits",
  "/reports": "Reports",
  "/recruitment/job-positions": "Job Positions",
  "/recruitment/applicants": "Applicants",
  "/recruitment/my-interviews": "My Interviews",
  "/recruitment/my-assignments": "My Assignments",
  "/recruitment/workflows": "Recruitment Workflows",
  "/kpi/templates": "KPI Templates",
  "/kpi/evaluations": "KPI Evaluations",
  "/kpi/my-evaluations": "My Evaluations",
  "/kpi/self-evaluation": "Self Evaluation",
  "/my-performance": "My Performance",
  "/my-performance/kpi-results": "My KPI Results",
  "/my-performance/probation": "Probation",
  "/hr-forms": "HR Forms",
  "/hr-forms/assignments": "Form Assignments",
  "/hr-forms/submissions": "Form Submissions",
  "/my-forms": "My Forms",
  "/user-permissions": "User Permissions",
};

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Sidebar logic (your existing)
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    setCollapsed(isMobile);
  }, []);

  // Title logic
  useEffect(() => {
    let title = routeTitles[location.pathname];

    // Handle dynamic routes
    if (!title) {
      if (location.pathname.startsWith("/payroll/details/")) {
        title = "Payroll Details";
      } else if (location.pathname.startsWith("/hr-forms/submissions/")) {
        title = "Form Submission";
      } else if (location.pathname.match(/^\/hr-forms\/\d+\/builder$/)) {
        title = "Form Builder";
      } else if (location.pathname.startsWith("/recruitment/applicants/")) {
        title = location.pathname.endsWith("/new") ? "New Applicant" : "Applicant Details";
      } else if (location.pathname.startsWith("/my-forms/")) {
        title = "Fill Form";
      }
    }

    document.title = title ? `${title} | HRMS` : "HRMS System";
  }, [location.pathname]);

  return <MainLayout collapsed={collapsed} setCollapsed={setCollapsed} />;
};

export default AppLayout;
