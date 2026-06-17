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
  Building2,
  ShieldAlert,
  UserPlus,
  Users as UsersIcon,
  Briefcase,
  HeartHandshake,
  BarChart3,
  UserCheck,
  ShieldCheck,
  ClipboardCheck,
  Workflow,
} from "lucide-react";
import { useState, useEffect } from "react";
import smallIcon from "@/assets/images/small-icon.png";
import { useAuth } from "@/app/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isApprover as checkIsApprover } from "@/services/overtimeService";
import { getKpiPendingCount } from "@/services/kpiService";

const APPROVER_CACHE_KEY = "sidebar_is_approver";
const EVALUATOR_CACHE_KEY = "sidebar_is_evaluator";

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const { user, hasPermission } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isUserApprover, setIsUserApprover] = useState(() => {
    const cached = sessionStorage.getItem(APPROVER_CACHE_KEY);
    return cached ? JSON.parse(cached) : false;
  });
  const [isEvaluator, setIsEvaluator] = useState(() => {
    const cached = sessionStorage.getItem(EVALUATOR_CACHE_KEY);
    return cached ? JSON.parse(cached) : false;
  });

  useEffect(() => {
    const cached = sessionStorage.getItem(APPROVER_CACHE_KEY);
    if (cached !== null) return;
    const checkApproverStatus = async () => {
      if (user?.id) {
        try {
          const result = await checkIsApprover();
          setIsUserApprover(result.isApprover);
          sessionStorage.setItem(APPROVER_CACHE_KEY, JSON.stringify(result.isApprover));
        } catch {
          setIsUserApprover(false);
        }
      }
    };
    checkApproverStatus();
  }, [user]);

  useEffect(() => {
    const cached = sessionStorage.getItem(EVALUATOR_CACHE_KEY);
    if (cached !== null) return;
    const checkEvaluatorStatus = async () => {
      if (user?.employee_id) {
        try {
          const result = await getKpiPendingCount();
          const hasPending = result.count > 0;
          setIsEvaluator(hasPending);
          sessionStorage.setItem(EVALUATOR_CACHE_KEY, JSON.stringify(hasPending));
        } catch {
          setIsEvaluator(false);
        }
      }
    };
    checkEvaluatorStatus();
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

  const canApprove = () => {
    return (
      user?.role === "ADMIN" ||
      isUserApprover
    );
  };

  const isRegularEmployee = () => {
    return user?.role === "EMPLOYEE" && !isUserApprover;
  };

  const showOvertimeDropdown = () => {
    return canApprove() || isRegularEmployee();
  };

  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.first_name && user?.last_name)
      return `${user.first_name} ${user.last_name}`;
    if (user?.first_name) return user.first_name;
    if (user?.last_name) return user.last_name;
    return "User";
  };

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

        {hasPermission("anomalies.view") && (
          <NavLink
            to="/anomalies"
            className={({ isActive }) => linkClass(isActive)}
          >
            <ShieldAlert className="h-5 w-5" />
            {!collapsed && "Anomalies"}
          </NavLink>
        )}

        {/* HR Policies - Everyone */}
        <NavLink
          to="/hr-policies"
          className={({ isActive }) => linkClass(isActive)}
        >
          <FileText className="h-5 w-5" />
          {!collapsed && "HR Policies"}
        </NavLink>

        {/* Leaves */}
        <NavLink to="/leaves" className={({ isActive }) => linkClass(isActive)}>
          <CalendarDays className="h-5 w-5" />
          {!collapsed && (canApprove() ? "Manage Leaves" : "My Leaves")}
        </NavLink>

        {(hasPermission("performance.templates.manage") || hasPermission("performance.evaluations.manage")) && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("performance")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5" />
                <span>Performance</span>
              </div>
              {openMenus["performance"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["performance"] && (
              <div className="mt-1 space-y-1">
                {hasPermission("performance.templates.manage") && (
                  <NavLink
                    to="/kpi/templates"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <FileText className="h-4 w-4" /> KPI Templates
                  </NavLink>
                )}
                {hasPermission("performance.evaluations.manage") && (
                  <NavLink
                    to="/kpi/evaluations"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <ClipboardList className="h-4 w-4" /> KPI Evaluations
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {(hasPermission("forms.view") || hasPermission("forms.builder.manage") || hasPermission("forms.assignments.manage") || hasPermission("forms.submissions.view")) && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("forms")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span>Forms</span>
              </div>
              {openMenus["forms"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["forms"] && (
              <div className="mt-1 space-y-1">
                {hasPermission("forms.builder.manage") && (
                  <NavLink
                    to="/hr-forms"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <FileText className="h-4 w-4" /> Form Templates
                  </NavLink>
                )}
                {hasPermission("forms.assignments.manage") && (
                  <NavLink
                    to="/hr-forms/assignments"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <ClipboardList className="h-4 w-4" /> Assign Forms
                  </NavLink>
                )}
                {hasPermission("forms.submissions.view") && (
                  <NavLink
                    to="/hr-forms/submissions"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <ClipboardList className="h-4 w-4" /> Form Submissions
                  </NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {(hasPermission("performance.templates.manage") || hasPermission("performance.evaluations.manage")) && collapsed && (
          <>
            {hasPermission("performance.templates.manage") && (
              <NavLink
                to="/kpi/templates"
                className={({ isActive }) => linkClass(isActive)}
                title="KPI Templates"
              >
                <FileText className="h-5 w-5" />
              </NavLink>
            )}
            {hasPermission("performance.evaluations.manage") && (
              <NavLink
                to="/kpi/evaluations"
                className={({ isActive }) => linkClass(isActive)}
                title="KPI Evaluations"
              >
                <ClipboardList className="h-5 w-5" />
              </NavLink>
            )}
          </>
        )}

        {(hasPermission("forms.view") || hasPermission("forms.builder.manage") || hasPermission("forms.assignments.manage") || hasPermission("forms.submissions.view")) && collapsed && (
          <>
            {hasPermission("forms.builder.manage") && (
              <NavLink
                to="/hr-forms"
                className={({ isActive }) => linkClass(isActive)}
                title="Form Templates"
              >
                <FileText className="h-5 w-5" />
              </NavLink>
            )}
            {hasPermission("forms.assignments.manage") && (
              <NavLink
                to="/hr-forms/assignments"
                className={({ isActive }) => linkClass(isActive)}
                title="Assign Forms"
              >
                <ClipboardList className="h-5 w-5" />
              </NavLink>
            )}
            {hasPermission("forms.submissions.view") && (
              <NavLink
                to="/hr-forms/submissions"
                className={({ isActive }) => linkClass(isActive)}
                title="Form Submissions"
              >
                <ClipboardList className="h-5 w-5" />
              </NavLink>
            )}
          </>
        )}

        {isEvaluator && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("evaluator")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5" />
                <span>Evaluator</span>
              </div>
              {openMenus["evaluator"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["evaluator"] && (
              <div className="mt-1 space-y-1">
                <NavLink
                  to="/kpi/my-evaluations"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <ClipboardList className="h-4 w-4" /> Evaluations Page
                </NavLink>
              </div>
            )}
          </div>
        )}
        {isEvaluator && collapsed && (
          <NavLink
            to="/kpi/my-evaluations"
            className={({ isActive }) => linkClass(isActive)}
            title="Evaluations Page"
          >
            <ClipboardList className="h-5 w-5" />
          </NavLink>
        )}

        {(hasPermission("my_performance.view") || hasPermission("performance.view") || hasPermission("forms.view_own")) && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("employee")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5" />
                <span>Employee KPI</span>
              </div>
              {openMenus["employee"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["employee"] && (
              <div className="mt-1 space-y-1">
                <NavLink
                  to="/my-performance/kpi-results"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <ClipboardList className="h-4 w-4" /> My KPI Results
                </NavLink>
                {user?.employment_status === "PROBATIONARY" && (
                  <NavLink
                    to="/my-performance/probation"
                    className={({ isActive }) => dropdownLinkClass(isActive)}
                  >
                    <UserCheck className="h-4 w-4" /> My Probation Status
                  </NavLink>
                )}
                <NavLink
                  to="/my-forms"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <FileText className="h-4 w-4" /> My Forms
                </NavLink>
              </div>
            )}
          </div>
        )}
        {(hasPermission("my_performance.view") || hasPermission("performance.view") || hasPermission("forms.view_own")) && collapsed && (
          <>
            <NavLink
              to="/my-performance/kpi-results"
              className={({ isActive }) => linkClass(isActive)}
              title="My KPI Results"
            >
              <ClipboardList className="h-5 w-5" />
            </NavLink>
            {user?.employment_status === "PROBATIONARY" && (
              <NavLink
                to="/my-performance/probation"
                className={({ isActive }) => linkClass(isActive)}
                title="My Probation Status"
              >
                <UserCheck className="h-5 w-5" />
              </NavLink>
            )}
            <NavLink
              to="/my-forms"
              className={({ isActive }) => linkClass(isActive)}
              title="My Forms"
            >
              <FileText className="h-5 w-5" />
            </NavLink>
          </>
        )}

        {showOvertimeDropdown() && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("overtime")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
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
                <NavLink
                  to="/myovertime"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <Clock className="h-4 w-4" />
                  My Overtime
                </NavLink>

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

        {showOvertimeDropdown() && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("manhours")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
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
                <NavLink
                  to="/my-manhours"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <FileText className="h-4 w-4" />
                  My Man Hours
                </NavLink>

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

        {hasPermission("employees.view") && (
          <NavLink
            to="/employees"
            className={({ isActive }) => linkClass(isActive)}
          >
            <IdCard className="h-5 w-5" />
            {!collapsed && "Employees"}
          </NavLink>
        )}

        {hasPermission("recruitment.view") && !collapsed && (
          <div>
            <button
              onClick={() => toggleMenu("recruitment")}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5" />
                <span>Recruitment</span>
              </div>
              {openMenus["recruitment"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {openMenus["recruitment"] && (
              <div className="mt-1 space-y-1">
                <NavLink
                  to="/recruitment/job-positions"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <Briefcase className="h-4 w-4" />
                  Job Positions
                </NavLink>
                <NavLink
                  to="/recruitment/applicants"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <UsersIcon className="h-4 w-4" />
                  Applicants
                </NavLink>
                <NavLink
                  to="/recruitment/my-interviews"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  My Recruitment Assignments
                </NavLink>
                <NavLink
                  to="/recruitment/workflows"
                  className={({ isActive }) => dropdownLinkClass(isActive)}
                >
                  <Workflow className="h-4 w-4" />
                  Workflows
                </NavLink>
              </div>
            )}
          </div>
        )}

        {hasPermission("recruitment.view") && collapsed && (
          <>
            <NavLink
              to="/recruitment/job-positions"
              className={({ isActive }) => linkClass(isActive)}
              title="Job Positions"
            >
              <Briefcase className="h-5 w-5" />
            </NavLink>
            <NavLink
              to="/recruitment/applicants"
              className={({ isActive }) => linkClass(isActive)}
              title="Applicants"
            >
              <UsersIcon className="h-5 w-5" />
            </NavLink>
            <NavLink
              to="/recruitment/my-interviews"
              className={({ isActive }) => linkClass(isActive)}
              title="My Recruitment Assignments"
            >
              <ClipboardCheck className="h-5 w-5" />
            </NavLink>
            <NavLink
              to="/recruitment/workflows"
              className={({ isActive }) => linkClass(isActive)}
              title="Workflows"
            >
              <Workflow className="h-5 w-5" />
            </NavLink>
          </>
        )}

        {hasPermission("reports.view") && (
          <NavLink
            to="/reports"
            className={({ isActive }) => linkClass(isActive)}
          >
            <BarChart3 className="h-5 w-5" />
            {!collapsed && "Reports"}
          </NavLink>
        )}

        {hasPermission("payroll.view") && (
          <NavLink
            to="/payroll"
            className={({ isActive }) => linkClass(isActive)}
          >
            <Wallet className="h-5 w-5" />
            {!collapsed && "Payroll"}
          </NavLink>
        )}

        {/* My Benefits - Everyone */}
        <NavLink
          to="/my-benefits"
          className={({ isActive }) => linkClass(isActive)}
        >
          <HeartHandshake className="h-5 w-5" />
          {!collapsed && "My Benefits"}
        </NavLink>

        {/* Calendar - Everyone */}
        <NavLink
          to="/calendar"
          className={({ isActive }) => linkClass(isActive)}
        >
          <Calendar className="h-5 w-5" />
          {!collapsed && "Calendar"}
        </NavLink>

        {hasPermission("users.view") && (
          <NavLink
            to="/users"
            className={({ isActive }) => linkClass(isActive)}
          >
            <UserCog className="h-5 w-5" />
            {!collapsed && "Accounts"}
          </NavLink>
        )}

        {hasPermission("branches.view") && (
          <NavLink
            to="/branches"
            className={({ isActive }) => linkClass(isActive)}
          >
            <Building2 className="h-5 w-5" />
            {!collapsed && "Branches"}
          </NavLink>
        )}

        {hasPermission("settings.view") && (
          <NavLink
            to="/settings"
            className={({ isActive }) => linkClass(isActive)}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && "Settings"}
          </NavLink>
        )}

        {hasPermission("users.manage") && (
          <NavLink
            to="/user-permissions"
            className={({ isActive }) => linkClass(isActive)}
          >
            <ShieldCheck className="h-5 w-5" />
            {!collapsed && "User Permissions"}
          </NavLink>
        )}
      </nav>

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
              <span className="font-medium text-sm text-foreground truncate">
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
