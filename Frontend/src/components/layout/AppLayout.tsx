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

    // Handle dynamic route
    if (location.pathname.startsWith("/payroll/details")) {
      title = "Payroll Details";
    }

    document.title = title ? `${title} | HRMS` : "HRMS System";
  }, [location.pathname]);

  return <MainLayout collapsed={collapsed} setCollapsed={setCollapsed} />;
};

export default AppLayout;
