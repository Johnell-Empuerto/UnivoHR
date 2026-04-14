// features/users/components/UserDrawerForm.tsx
"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  type User,
  type EmployeeWithoutAccount,
  getEmployeesWithoutAccounts,
} from "@/services/userService";

type UserDrawerFormProps = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  mode: "create" | "edit";
  onSubmit: (data: any) => Promise<void>;
};

const UserDrawerForm = ({
  open,
  onClose,
  user,
  mode,
  onSubmit,
}: UserDrawerFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
    employee_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<
    EmployeeWithoutAccount[]
  >([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (mode === "create" && open && availableEmployees.length === 0) {
      fetchAvailableEmployees();
    }
  }, [mode, open]);

  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        username: user.username,
        password: "",
        confirmPassword: "",
        role: user.role,
        employee_id: user.employee_id.toString(),
      });
    } else if (mode === "create") {
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        role: "EMPLOYEE",
        employee_id: "",
      });
    }
  }, [user, mode, open]);

  const fetchAvailableEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const employees = await getEmployeesWithoutAccounts();
      setAvailableEmployees(employees);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleNavigateToEmployees = () => {
    onClose();
    navigate("/employees");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (mode === "create" && !formData.employee_id) {
      toast.error("Please select an employee");
      return;
    }

    if (mode === "create" && !formData.password) {
      toast.error("Password is required for new users");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password && formData.password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    try {
      setSubmitting(true);
      const submitData: any = {
        username: formData.username,
        role: formData.role,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      if (mode === "create") {
        submitData.employee_id = parseInt(formData.employee_id);
      }

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    return mode === "create" ? "Add New User" : "Edit User";
  };

  const getDescription = () => {
    return mode === "create"
      ? "Create a new user account and assign to an employee"
      : "Update user account information";
  };

  // Check if no employees available
  const noEmployeesAvailable =
    mode === "create" && !loadingEmployees && availableEmployees.length === 0;

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="z-50" style={{ zIndex: 9999 }}>
        <DrawerHeader>
          <DrawerTitle>{getTitle()}</DrawerTitle>
          <DrawerDescription>{getDescription()}</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 px-4 py-6 space-y-5 overflow-y-auto">
            {/* Employee Selection (only for new users) */}
            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="employee_id" className="text-sm font-medium">
                  Employee <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employee_id: value })
                  }
                  disabled={loadingEmployees || noEmployeesAvailable}
                >
                  <SelectTrigger
                    className={
                      noEmployeesAvailable
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  >
                    <SelectValue
                      placeholder={
                        noEmployeesAvailable
                          ? "No employees available"
                          : "Select employee"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-10000">
                    {availableEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code}) -{" "}
                        {emp.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* ✅ Show helpful message when no employees available */}
                {loadingEmployees && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading employees...
                  </p>
                )}

                {noEmployeesAvailable && (
                  <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                          No employees available
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                          All employees already have user accounts. You need to
                          create an employee first before adding a user account.
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={handleNavigateToEmployees}
                          className="p-0 h-auto mt-2 text-yellow-800 dark:text-yellow-400 hover:text-yellow-900"
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Go to Employees
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {!noEmployeesAvailable && !loadingEmployees && (
                  <p className="text-xs text-muted-foreground">
                    Only employees without existing user accounts are shown
                  </p>
                )}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Enter username"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password{" "}
                {mode === "create" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current password"
                    : "Enter password (min. 4 characters)"
                }
              />
            </div>

            {/* Confirm Password */}
            {(mode === "create" || formData.password) && (
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password{" "}
                  {mode === "create" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm password"
                />
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-10000">
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DrawerFooter>
            <Button
              type="submit"
              disabled={
                submitting || (mode === "create" && noEmployeesAvailable)
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create User" : "Save Changes"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default UserDrawerForm;
