"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Loader2 } from "lucide-react";

import { leaveService } from "@/services/leaveService";

import { formatDateForInput } from "@/utils/formatDate";

type Leave = {
  id: number;
  employee_name: string;
  employee_code?: string;
  employee_id?: number;
  type: string;
  from_date?: string;
  to_date?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  status: string;
  day_fraction?: number;
  half_day_type?: string | null;
  rejection_reason?: string | null;
};

type LeaveDrawerProps = {
  open: boolean;
  onClose: () => void;
  leave: Leave | null;
  mode: "view" | "edit" | "create";
  onUpdate: (leave: Leave) => void;
  isAdmin?: boolean;
};

const LeaveDrawer = ({
  open,
  onClose,
  leave,
  mode,
  onUpdate,
  isAdmin = false,
}: LeaveDrawerProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employee_name: "",
    employee_code: "",
    employee_id: 0,
    type: "",
    from_date: "",
    to_date: "",
    start_date: "",
    end_date: "",
    reason: "",
    status: "PENDING",
    day_fraction: 1,
    half_day_type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [isHalfDay, setIsHalfDay] = useState(false);

  // Auto-populate employee info when in create mode and user is employee
  useEffect(() => {
    if (mode === "create" && user && user.role !== "ADMIN") {
      setFormData((prev) => ({
        ...prev,
        employee_name:
          user.name || (user.first_name && user.last_name)
            ? `${user.first_name} ${user.last_name}`
            : "",
        employee_code: user.employee_code || "",
        employee_id: user.employee_id || 0,
      }));
    }
  }, [mode, user]);

  // Load employees for admin selection
  useEffect(() => {
    if (isAdmin && mode === "create" && availableEmployees.length === 0) {
      fetchEmployees();
    }
  }, [isAdmin, mode]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setAvailableEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Handle employee selection for admin
  const handleEmployeeSelect = (employeeId: string) => {
    const selected = availableEmployees.find(
      (emp) => emp.id === parseInt(employeeId),
    );
    if (selected) {
      setFormData({
        ...formData,
        employee_name:
          selected.name || `${selected.first_name} ${selected.last_name}`,
        employee_code: selected.employee_code,
        employee_id: selected.id,
      });
    }
  };

  useEffect(() => {
    if (leave && (mode === "edit" || mode === "view")) {
      setFormData({
        employee_name: leave.employee_name || "",
        employee_code: leave.employee_code || "",
        employee_id: leave.employee_id || 0,
        type: leave.type || "",
        from_date: formatDateForInput(leave.from_date || leave.start_date),
        to_date: formatDateForInput(leave.to_date || leave.end_date),
        start_date: formatDateForInput(leave.start_date || leave.from_date),
        end_date: formatDateForInput(leave.end_date || leave.to_date),
        reason: leave.reason || "",
        status: leave.status || "PENDING",
        day_fraction: leave.day_fraction || 1,
        half_day_type: leave.half_day_type || "",
      });
      setIsHalfDay(leave.day_fraction === 0.5);
    } else if (mode === "create" && user?.role === "ADMIN") {
      setFormData({
        employee_name: "",
        employee_code: "",
        employee_id: 0,
        type: "",
        from_date: "",
        to_date: "",
        start_date: "",
        end_date: "",
        reason: "",
        status: "PENDING",
        day_fraction: 1,
        half_day_type: "",
      });
      setIsHalfDay(false);
    }
  }, [leave, mode, user]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload: any = {
        type: formData.type,
        from_date: formData.from_date || formData.start_date,
        to_date: formData.to_date || formData.end_date,
        reason: formData.reason,
        day_fraction: isHalfDay ? 0.5 : 1,
        half_day_type: isHalfDay ? formData.half_day_type : null,
        ...(isAdmin && formData.employee_id
          ? { employee_id: formData.employee_id }
          : {}),
      };

      const newLeave = await leaveService.createLeave(payload);
      onUpdate(newLeave);
      onClose();
    } catch (error: any) {
      console.error("Create leave error:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      from_date: value,
      start_date: value,
    });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      to_date: value,
      end_date: value,
    });
  };

  const handleFromDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input && (input as any).showPicker) {
      try {
        (input as any).showPicker();
      } catch (err) {
        console.log("Native showPicker not supported");
      }
    }
  };

  const handleToDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input && (input as any).showPicker) {
      try {
        (input as any).showPicker();
      } catch (err) {
        console.log("Native showPicker not supported");
      }
    }
  };

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  const getTitle = () => {
    if (isCreateMode) return "Request Leave";
    if (isViewMode) return "Leave Details";
    return "Edit Leave Request";
  };

  const canEdit = () => {
    if (isViewMode) return false;
    if (isCreateMode) return true;
    return isAdmin;
  };

  // Check if employee fields should be disabled
  const isEmployeeFieldsDisabled = () => {
    // Always disabled for non-admin in create mode (auto-filled)
    if (!isAdmin && isCreateMode) return true;
    // Disabled in view mode
    if (isViewMode) return true;
    // Disabled in edit mode for non-admin
    if (isEditMode && !isAdmin) return true;
    return false;
  };

  // Get placeholder text for employee name
  const getEmployeeNamePlaceholder = () => {
    if (user?.role === "EMPLOYEE" && isCreateMode) {
      return "Auto-filled from your account";
    }
    return "Employee name will be auto-filled";
  };

  // Get placeholder text for employee code
  const getEmployeeCodePlaceholder = () => {
    if (user?.role === "EMPLOYEE" && isCreateMode) {
      return "Auto-filled from your account";
    }
    return "Employee code will be auto-filled";
  };

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="ml-auto w-125 max-w-full">
        <DrawerHeader>
          <DrawerTitle>{getTitle()}</DrawerTitle>
          <DrawerDescription>
            {isCreateMode
              ? "Fill in the details to request leave"
              : isViewMode
                ? "View leave request details"
                : "Update leave request information"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* EMPLOYEE INFO SECTION */}
          <div className="rounded-xl border p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Employee Information
            </p>

            {/* Only show employee selector for admin in create mode */}
            {isAdmin && isCreateMode && (
              <div className="space-y-2">
                <Label>Select Employee *</Label>
                <Select onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name || `${emp.first_name} ${emp.last_name}`} (
                        {emp.employee_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Employee Name - DISABLED but still sends data */}
            <div className="space-y-2">
              <Label>Employee Name *</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employee_name: e.target.value,
                  })
                }
                disabled={isEmployeeFieldsDisabled()}
                placeholder={getEmployeeNamePlaceholder()}
                className={
                  isEmployeeFieldsDisabled()
                    ? "bg-muted cursor-not-allowed"
                    : ""
                }
              />
              {user?.role === "EMPLOYEE" && isCreateMode && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Auto-filled from your profile
                </p>
              )}
            </div>

            {/* Employee Code - DISABLED but still sends data */}
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={formData.employee_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employee_code: e.target.value,
                  })
                }
                disabled={isEmployeeFieldsDisabled()}
                placeholder={getEmployeeCodePlaceholder()}
                className={
                  isEmployeeFieldsDisabled()
                    ? "bg-muted cursor-not-allowed"
                    : ""
                }
              />
              {user?.role === "EMPLOYEE" && isCreateMode && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Auto-filled from your profile
                </p>
              )}
            </div>
          </div>

          {/* LEAVE INFO SECTION */}
          <div className="rounded-xl border p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Leave Information
            </p>

            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={!canEdit()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency Leave</SelectItem>
                  <SelectItem value="NO_PAY">No Pay Leave</SelectItem>
                  <SelectItem value="ANNUAL">Vacation Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Half-Day Option */}
            <div className="space-y-2 pt-2">
              <Label>Leave Duration</Label>
              <Select
                value={isHalfDay ? "half" : "full"}
                onValueChange={(value) => {
                  const isHalf = value === "half";
                  setIsHalfDay(isHalf);
                  if (!isHalf) {
                    setFormData({ ...formData, half_day_type: "" });
                  }
                }}
                disabled={!canEdit()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Day</SelectItem>
                  <SelectItem value="half">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Half-Day Type Selection */}
            {isHalfDay && (
              <div className="space-y-2">
                <Label>Half Day Type *</Label>
                <Select
                  value={formData.half_day_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, half_day_type: value })
                  }
                  disabled={!canEdit()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select morning or afternoon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Morning (AM)</SelectItem>
                    <SelectItem value="AFTERNOON">Afternoon (PM)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select whether you need morning or afternoon off
                </p>
              </div>
            )}
          </div>

          {/* SCHEDULE SECTION */}
          <div className="rounded-xl border p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Schedule
            </p>

            <div className="space-y-2">
              <Label>From Date *</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.from_date || formData.start_date}
                  onChange={handleFromDateChange}
                  onClick={handleFromDateClick}
                  disabled={!canEdit()}
                  min={new Date().toISOString().split("T")[0]}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>To Date *</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.to_date || formData.end_date}
                  onChange={handleToDateChange}
                  onClick={handleToDateClick}
                  disabled={!canEdit()}
                  min={formData.from_date || formData.start_date}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {(formData.from_date || formData.start_date) &&
              (formData.to_date || formData.end_date) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Duration:{" "}
                  {(() => {
                    const start = new Date(
                      formData.from_date || formData.start_date,
                    );
                    const end = new Date(formData.to_date || formData.end_date);
                    const days =
                      Math.ceil(
                        (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1;
                    const totalDays = isHalfDay ? days * 0.5 : days;
                    return `${totalDays} day${totalDays !== 1 ? "s" : ""} (${days} calendar day${days !== 1 ? "s" : ""})`;
                  })()}
                </p>
              )}
          </div>

          {/* REASON SECTION */}
          <div className="rounded-xl border p-4 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Reason
            </p>

            <Textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reason: e.target.value,
                })
              }
              disabled={!canEdit()}
              rows={4}
              placeholder="Please provide reason for leave (optional)"
            />
          </div>

          {/* STATUS SECTION */}
          {isAdmin && (isEditMode || isViewMode) && (
            <div className="rounded-xl border p-4 space-y-3 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Status
              </p>

              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* REJECTION REASON DISPLAY */}
          {isViewMode &&
            leave?.status === "REJECTED" &&
            leave?.rejection_reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase flex items-center gap-1">
                  <span>❌</span> Rejection Reason
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {leave.rejection_reason}
                </p>
              </div>
            )}
        </div>

        <DrawerFooter>
          {canEdit() && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCreateMode ? "Submit Request" : "Save Changes"}
            </Button>
          )}

          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default LeaveDrawer;
