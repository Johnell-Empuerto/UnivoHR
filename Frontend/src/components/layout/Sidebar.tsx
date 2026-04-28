import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  IdCard,
  Wallet,
  Calendar,
  ClipboardList,
  Settings,
  UserCog,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import smallIcon from "@/assets/images/small-icon.png";
import { useAuth } from "@/app/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isApprover as checkIsApprover } from "@/services/overtimeService";

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isUserApprover, setIsUserApprover] = useState(false);

  // Check if current user is assigned as approver
  useEffect(() => {
    const checkApproverStatus = async () => {
      if (user?.id) {
        try {
          const result = await checkIsApprover();
          setIsUserApprover(result.isApprover);
        } catch (error) {
          console.error("Failed to check approver status:", error);
          setIsUserApprover(false);
        }
      }
    };
    checkApproverStatus();
  }, [user]);

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const linkClass = (isActive: boolean) =>
    `flex items-center ${
      collapsed ? "justify-center" : "gap-3"
    } px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const dropdownLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 pl-10 pr-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  // Determine if user can approve (has approval权限)
  const canApprove = () => {
    return (
      user?.role === "ADMIN" ||
      user?.role === "HR_ADMIN" ||
      user?.role === "HR" ||
      isUserApprover
    );
  };

  // Determine if user is regular employee (only request, no approve)
  const isRegularEmployee = () => {
    return user?.role === "EMPLOYEE" && !isUserApprover;
  };

  // Show dropdown for Overtime if user can approve OR is regular employee
  const showOvertimeDropdown = () => {
    return canApprove() || isRegularEmployee();
  };

  // Get user display name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.first_name && user?.last_name)
      return `${user.first_name} ${user.last_name}`;
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    return "User";
  };

  // Get initials for avatar (same logic as navbar)
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.last_name) {
      return user.last_name.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      {/* LOGO / TITLE */}
      <div className="h-16 flex items-center px-4 gap-2">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img
              src={smallIcon}
              alt="UnivoHR"
              className="h-6 w-6 object-contain dark:brightness-0 dark:invert"
            />
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent dark:text-white">
              UnivoHR
            </span>
          </div>
        ) : (
          <img
            src={smallIcon}
            alt="UnivoHR"
            className="h-8 w-8 object-contain mx-auto dark:brightness-0 dark:invert"
          />
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {/* Dashboard - Everyone */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => linkClass(isActive)}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!collapsed && "Dashboard"}
        </NavLink>

        {/* Attendance - Everyone */}
        <NavLink
          to="/attendance"
          className={({ isActive }) => linkClass(isActive)}
        >
          <CalendarCheck className="h-5 w-5" />
          {!collapsed && "Attendance"}
        </NavLink>

        {/* Leaves - Everyone (different text based on role) */}
        <NavLink to="/leaves" className={({ isActive }) => linkClass(isActive)}>
          <CalendarDays className="h-5 w-5" />
          {!collapsed && (canApprove() ? "Manage Leaves" : "My Leaves")}
        </NavLink>

        {/* Leave Credits - ADMIN/HR_ADMIN only */}
        {(user?.role === "ADMIN" || user?.role === "HR_ADMIN") && (
          <NavLink
            to="/leave-credits"
            className={({ isActive }) => linkClass(isActive)}
          >
            <CalendarDays className="h-5 w-5" />
            {!collapsed && "Leave Credits"}
          </NavLink>
        )}

        {/* Overtime Dropdown Menu - For all employees */}
        {showOvertimeDropdown() && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("overtime")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all dark:text-gray-300 dark:hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <span>Overtime</span>
              </div>
              {openMenus["overtime"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["overtime"] && (
              <div className="mt-1 space-y-1">
                {/* My Overtime - visible to everyone */}
                <NavLink
                  to="/myovertime"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <Clock className="h-4 w-4" />
                  My Overtime
                </NavLink>

                {/* Manage Overtime - only for approvers */}
                {canApprove() && (
                  <NavLink
                    to="/overtime"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Manage Overtime
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Man Hours Dropdown Menu - For all employees */}
        {showOvertimeDropdown() && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("manhours")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all dark:text-gray-300 dark:hover:text-white"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span>Man Hours</span>
              </div>
              {openMenus["manhours"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["manhours"] && (
              <div className="mt-1 space-y-1">
                {/* My Man Hours - visible to everyone */}
                <NavLink
                  to="/my-manhours"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <FileText className="h-4 w-4" />
                  My Man Hours
                </NavLink>

                {/* Manage Man Hours - only for approvers */}
                {canApprove() && (
                  <NavLink
                    to="/manhours-approval"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Approve Man Hours
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsed Overtime Menu (no dropdown, just icons) */}
        {showOvertimeDropdown() && collapsed && (
          <>
            <NavLink
              to="/myovertime"
              className={({ isActive }) => linkClass(isActive)}
              title="My Overtime"
            >
              <Clock className="h-5 w-5" />
            </NavLink>
            {canApprove() && (
              <NavLink
                to="/overtime"
                className={({ isActive }) => linkClass(isActive)}
                title="Manage Overtime"
              >
                <ClipboardList className="h-5 w-5" />
              </NavLink>
            )}
            <NavLink
              to="/my-manhours"
              className={({ isActive }) => linkClass(isActive)}
              title="My Man Hours"
            >
              <FileText className="h-5 w-5" />
            </NavLink>
            {canApprove() && (
              <NavLink
                to="/manhours-approval"
                className={({ isActive }) => linkClass(isActive)}
                title="Approve Man Hours"
              >
                <ClipboardList className="h-5 w-5" />
              </NavLink>
            )}
          </>
        )}

        {/* Employees - ADMIN only */}
        {user?.role === "ADMIN" && (
          <NavLink
            to="/employees"
            className={({ isActive }) => linkClass(isActive)}
          >
            <IdCard className="h-5 w-5" />
            {!collapsed && "Employees"}
          </NavLink>
        )}

        {/* Payroll - Everyone */}
        <NavLink
          to="/payroll"
          className={({ isActive }) => linkClass(isActive)}
        >
          <Wallet className="h-5 w-5" />
          {!collapsed && "Payroll"}
        </NavLink>

        {/* Calendar - Everyone */}
        <NavLink
          to="/calendar"
          className={({ isActive }) => linkClass(isActive)}
        >
          <Calendar className="h-5 w-5" />
          {!collapsed && "Calendar"}
        </NavLink>

        {/* Accounts - ADMIN only */}
        {user?.role === "ADMIN" && (
          <NavLink
            to="/users"
            className={({ isActive }) => linkClass(isActive)}
          >
            <UserCog className="h-5 w-5" />
            {!collapsed && "Accounts"}
          </NavLink>
        )}

        {/* Settings - ADMIN, HR_ADMIN, HR */}
        {(user?.role === "ADMIN" ||
          user?.role === "HR_ADMIN" ||
          user?.role === "HR") && (
          <NavLink
            to="/settings"
            className={({ isActive }) => linkClass(isActive)}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && "Settings"}
          </NavLink>
        )}
      </nav>

      {/* BOTTOM PROFILE SECTION - Fixed dark mode text visibility */}
      <div className="border-t p-3">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Avatar>
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm text-foreground dark:text-gray-200 truncate">
                {getUserName()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
