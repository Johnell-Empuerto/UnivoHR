import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const docsRoutes = [
  { title: "Login", path: "/docs/login" },
  { title: "Dashboard", path: "/docs/dashboard" },
  { title: "Attendance", path: "/docs/attendance" },
  { title: "Leaves", path: "/docs/leaves" },
  { title: "Calendar", path: "/docs/calendar" },
  { title: "Man-Hours", path: "/docs/man-hours" },
  { title: "Overtime", path: "/docs/overtime" },
  { title: "Payroll Admin", path: "/docs/payroll-admin" },
  { title: "Employees", path: "/docs/employees" },
  { title: "Accounts", path: "/docs/users" },
  { title: "Settings", path: "/docs/settings" },
  { title: "Profile", path: "/docs/profile" },
];

type DocsNavigationProps = {
  currentPath: string;
};

const DocsNavigation = ({ currentPath }: DocsNavigationProps) => {
  const navigate = useNavigate();
  const currentIndex = docsRoutes.findIndex((r) => r.path === currentPath);
  const prev = docsRoutes[currentIndex - 1];
  const next = docsRoutes[currentIndex + 1];

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {prev && (
          <Button variant="outline" onClick={() => navigate(prev.path)}>
            ← {prev.title}
          </Button>
        )}
      </div>
      <div>
        {next && (
          <Button onClick={() => navigate(next.path)}>{next.title} →</Button>
        )}
      </div>
    </div>
  );
};

export default DocsNavigation;
