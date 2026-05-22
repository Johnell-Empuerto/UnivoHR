import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type DocsSidebarProps = {
  activePath: string;
  onNavigate: (path: string) => void;
  className?: string;
};

const docsNavGroups = [
  {
    label: "Getting Started",
    items: [
      { title: "Login", path: "/docs/login" },
      { title: "Dashboard", path: "/docs/dashboard" },
    ],
  },
  {
    label: "Modules",
    items: [
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
    ],
  },
];

const DocsSidebar = ({
  activePath,
  onNavigate,
  className,
}: DocsSidebarProps) => {
  return (
    <nav
      className={cn("flex flex-col gap-4 text-sm", className)}
      aria-label="Documentation table of contents"
    >
      <div className="flex items-center gap-2 px-1 text-foreground font-semibold">
        <BookOpen className="h-4 w-4 text-primary" />
        <span>Contents</span>
      </div>
      {docsNavGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = activePath === item.path;
              return (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default DocsSidebar;
