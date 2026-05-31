import { useState, useEffect, useMemo } from "react";
import { Shield, Loader2, Save, RotateCcw, Search, CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getUsers, type User } from "@/services/userService";
import {
  getAllPermissions,
  getUserPermissions,
  setUserPermissions as saveUserPermissionsApi,
  resetUserPermissions,
} from "@/services/permissionService";

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "View Dashboard",
  "employees.view": "View Employees",
  "employees.create": "Create Employees",
  "employees.edit": "Edit Employees",
  "employees.delete": "Delete Employees",
  "attendance.view": "View Attendance",
  "attendance.view_own": "View Own Attendance",
  "attendance.manage": "Manage Attendance",
  "attendance.time_requests.approve": "Approve Time Requests",
  "leave.view": "View Leaves",
  "leave.view_own": "View Own Leaves",
  "leave.create": "Create Leave Requests",
  "leave.manage": "Manage Leaves",
  "leave.approve": "Approve Leaves",
  "leave.credits.view": "View Leave Credits",
  "leave.credits.manage": "Manage Leave Credits",
  "leave.conversion.view": "View Leave Conversion",
  "leave.conversion.manage": "Manage Leave Conversion",
  "overtime.view": "View Overtime",
  "overtime.view_own": "View Own Overtime",
  "overtime.create": "Create Overtime Requests",
  "overtime.manage": "Manage Overtime",
  "overtime.approve": "Approve Overtime",
  "manhours.view": "View Man Hours",
  "manhours.view_own": "View Own Man Hours",
  "manhours.manage": "Manage Man Hours",
  "manhours.approve": "Approve Man Hours",
  "payroll.view": "View Payroll",
  "payroll.generate": "Generate Payroll",
  "payroll.mark_paid": "Mark Payroll as Paid",
  "payroll.settings": "Payroll Settings",
  "payroll.salary.manage": "Manage Salaries",
  "payroll.deductions.manage": "Manage Deductions",
  "finalpay.view": "View Final Pay",
  "finalpay.manage": "Manage Final Pay",
  "recruitment.view": "View Recruitment",
  "recruitment.jobs.manage": "Manage Job Positions",
  "recruitment.applicants.manage": "Manage Applicants",
  "recruitment.applicants.delete": "Delete Applicants",
  "recruitment.interviews.manage": "Manage Interviews",
  "recruitment.approvals.manage": "Manage Approvals",
  "recruitment.convert_employee": "Convert to Employee",
  "performance.view": "View Performance",
  "my_performance.view": "View My Performance",
  "performance.templates.manage": "Manage KPI Templates",
  "performance.evaluations.manage": "Manage Evaluations",
  "forms.view": "View Forms",
  "forms.view_own": "View Own Forms",
  "forms.builder.manage": "Manage Form Builder",
  "forms.assignments.manage": "Manage Form Assignments",
  "forms.submissions.view": "View Form Submissions",
  "reports.view": "View Reports",
  "reports.employee": "Employee Reports",
  "reports.attendance": "Attendance Reports",
  "reports.leave": "Leave Reports",
  "reports.payroll": "Payroll Reports",
  "reports.benefits": "Benefits Reports",
  "reports.performance": "Performance Reports",
  "settings.view": "View Settings",
  "settings.system": "System Settings",
  "settings.attendance_rules": "Attendance Rules",
  "settings.approvals": "Approval Settings",
  "settings.notifications": "Notification Settings",
  "settings.smtp": "SMTP Settings",
  "settings.email_templates": "Email Templates",
  "settings.branding": "Company Branding",
  "users.view": "View Users",
  "users.manage": "Manage Users",
  "branches.view": "View Branches",
  "branches.manage": "Manage Branches",
  "devices.view": "View Devices",
  "devices.manage": "Manage Devices",
  "device_logs.view": "View Device Logs",
  "audit_logs.view": "View Audit Logs",
  "anomalies.view": "View Anomalies",
  "analytics.view": "View Analytics",
  "forecasting.view": "View Forecasting",
  "calendar.view": "View Calendar",
  "calendar.manage": "Manage Calendar",
  "hr_policies.view": "View HR Policies",
  "hr_policies.manage": "Manage HR Policies",
  "notifications.view": "View Notifications",
  "profile.view": "View Profile",
  "profile.edit_own": "Edit Own Profile",
  "change_password": "Change Password",
  "benefits.view_own": "View Own Benefits",
  "policies.view": "View HR Policies",
  "self_service.view": "Self Service Access",
};

const PRESETS: { name: string; label: string; keys: string[] }[] = [
  {
    name: "employee_default",
    label: "Employee Default",
    keys: [
      "dashboard.view",
      "attendance.view",
      "leave.view",
      "overtime.view",
      "manhours.view",
      "hr_policies.view",
      "calendar.view",
      "notifications.view",
      "my_performance.view",
      "profile.view",
      "change_password",
    ],
  },
  {
    name: "hr_staff",
    label: "HR Staff",
    keys: [
      "dashboard.view",
      "employees.view",
      "employees.create",
      "employees.edit",
      "attendance.view",
      "attendance.manage",
      "leave.view",
      "leave.manage",
      "leave.approve",
      "leave.credits.view",
      "leave.credits.manage",
      "overtime.view",
      "overtime.manage",
      "overtime.approve",
      "manhours.view",
      "manhours.manage",
      "manhours.approve",
      "recruitment.view",
      "recruitment.jobs.manage",
      "recruitment.applicants.manage",
      "recruitment.interviews.manage",
      "recruitment.approvals.manage",
      "performance.view",
      "reports.view",
      "reports.employee",
      "reports.attendance",
      "reports.leave",
      "calendar.view",
      "calendar.manage",
      "hr_policies.view",
      "hr_policies.manage",
      "notifications.view",
      "profile.view",
      "change_password",
    ],
  },
  {
    name: "payroll_staff",
    label: "Payroll Staff",
    keys: [
      "dashboard.view",
      "attendance.view",
      "leave.view",
      "payroll.view",
      "payroll.generate",
      "payroll.mark_paid",
      "payroll.settings",
      "payroll.salary.manage",
      "payroll.deductions.manage",
      "finalpay.view",
      "finalpay.manage",
      "reports.view",
      "reports.payroll",
      "reports.benefits",
      "calendar.view",
      "notifications.view",
      "profile.view",
      "change_password",
    ],
  },
  {
    name: "supervisor",
    label: "Supervisor",
    keys: [
      "dashboard.view",
      "employees.view",
      "attendance.view",
      "attendance.time_requests.approve",
      "leave.view",
      "leave.approve",
      "overtime.view",
      "overtime.approve",
      "manhours.view",
      "manhours.approve",
      "performance.view",
      "performance.evaluations.manage",
      "calendar.view",
      "notifications.view",
      "profile.view",
      "change_password",
    ],
  },
  {
    name: "it_staff",
    label: "IT Staff",
    keys: [
      "dashboard.view",
      "users.view",
      "users.manage",
      "devices.view",
      "devices.manage",
      "device_logs.view",
      "settings.view",
      "settings.system",
      "settings.smtp",
      "settings.email_templates",
      "audit_logs.view",
      "notifications.view",
      "profile.view",
      "change_password",
    ],
  },
  {
    name: "full_access",
    label: "Full Access",
    keys: [],
  },
];

const UserPermissionsPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permissionGroups, setPermissionGroups] = useState<Record<string, string[]>>({});
  const [allPermissionKeys, setAllPermissionKeys] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [savedPermissions, setSavedPermissions] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [usersRes, permsRes] = await Promise.all([
          getUsers(1, 100),
          getAllPermissions(),
        ]);
        setUsers(usersRes.data);
        setPermissionGroups(permsRes.groups);
        setAllPermissionKeys(permsRes.allPermissions);
      } catch (err: any) {
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setUserPermissions([]);
      setSavedPermissions([]);
      return;
    }
    const fetchPermissions = async () => {
      try {
        const res = await getUserPermissions(Number(selectedUserId));
        const perms = Array.isArray(res)
          ? res
          : Array.isArray(res.permissions)
            ? res.permissions
            : [];
        setUserPermissions(perms);
        setSavedPermissions(perms);
      } catch {
        setUserPermissions([]);
        setSavedPermissions([]);
      }
    };
    fetchPermissions();
  }, [selectedUserId]);

  const selectedUser = users.find((u) => String(u.id) === selectedUserId);
  const isAdminUser = selectedUser?.role === "ADMIN";
  const current = Array.isArray(userPermissions) ? userPermissions : [];
  const saved = Array.isArray(savedPermissions) ? savedPermissions : [];
  const hasChanges = [...current].sort().join(",") !== [...saved].sort().join(",");

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const filteredGroups = useMemo(() => {
    if (!permissionSearch) return permissionGroups;
    const q = permissionSearch.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [group, keys] of Object.entries(permissionGroups)) {
      const matched = keys.filter(
        (k) =>
          k.toLowerCase().includes(q) ||
          (PERMISSION_LABELS[k] || "").toLowerCase().includes(q) ||
          group.toLowerCase().includes(q),
      );
      if (matched.length > 0) {
        result[group] = matched;
      }
    }
    return result;
  }, [permissionGroups, permissionSearch]);

  const handleTogglePermission = (key: string) => {
    if (isAdminUser) return;
    setUserPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleToggleGroup = (keys: string[], checked: boolean) => {
    if (isAdminUser) return;
    if (checked) {
      setUserPermissions((prev) => {
        const set = new Set(prev);
        keys.forEach((k) => set.add(k));
        return Array.from(set);
      });
    } else {
      setUserPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    }
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    if (isAdminUser) return;
    if (preset.name === "full_access") {
      setUserPermissions([...allPermissionKeys]);
    } else {
      setUserPermissions(preset.keys);
    }
    toast.success(`Applied "${preset.label}" preset`);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    try {
      setSaving(true);
      await saveUserPermissionsApi(Number(selectedUserId), userPermissions);
      setSavedPermissions([...userPermissions]);
      toast.success("Permissions saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedUserId) return;
    try {
      setResetting(true);
      await resetUserPermissions(Number(selectedUserId));
      setUserPermissions([]);
      setSavedPermissions([]);
      toast.success("Permissions reset to default");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset permissions");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            User Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Grant or revoke permissions for each user. Admin users automatically
            have all permissions.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9 max-w-md"
            />
            {userSearch && (
              <button
                onClick={() => setUserSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a user to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No users found
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    <span>
                      {u.first_name} {u.last_name} ({u.username}) -{" "}
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.role}
                      </Badge>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUserId && (
        <>
          {isAdminUser && (
            <Card className="shadow-sm border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This user has the <strong>ADMIN</strong> role and
                  automatically has all permissions. Permission controls are
                  disabled for admin users.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Permission Presets */}
          {!isAdminUser && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <CardTitle>Permissions</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    className="pl-8 h-8 w-48 text-xs"
                  />
                  {permissionSearch && (
                    <button
                      onClick={() => setPermissionSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetting || isAdminUser}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || isAdminUser || !hasChanges}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Object.entries(filteredGroups).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No permissions match your search
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(filteredGroups).map(([group, keys]) => {
                    const allChecked = keys.every((k) =>
                      userPermissions.includes(k),
                    );
                    const someChecked = keys.some((k) =>
                      userPermissions.includes(k),
                    );
                    const selectedCount = keys.filter((k) =>
                      userPermissions.includes(k),
                    ).length;

                    return (
                      <div
                        key={group}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                !isAdminUser &&
                                handleToggleGroup(keys, !allChecked)
                              }
                              className={`text-primary hover:text-primary/80 transition-colors ${
                                isAdminUser
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={isAdminUser}
                            >
                              {allChecked ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : someChecked ? (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            <h3 className="font-semibold text-sm">{group}</h3>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {selectedCount}/{keys.length}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {keys.map((key) => {
                            const checked = userPermissions.includes(key);
                            const label =
                              PERMISSION_LABELS[key] ||
                              key
                                .split(".")
                                .slice(1)
                                .join(" ")
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase());
                            return (
                              <label
                                key={key}
                                className={`flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer ${
                                  isAdminUser
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked || isAdminUser}
                                  onChange={() => handleTogglePermission(key)}
                                  disabled={isAdminUser}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-xs">{label}</span>
                                <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                                  {key}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UserPermissionsPage;
