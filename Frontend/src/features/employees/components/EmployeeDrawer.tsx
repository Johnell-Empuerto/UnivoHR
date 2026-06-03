"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

import { formatDate, formatDateForInput } from "@/utils/formatDate";

import { useState, useEffect } from "react";
import { updateEmployee, createEmployee } from "@/services/employeeService";
import { getActiveBranches } from "@/services/branchService";
import {
  getEmployeeFamily,
  createEmployeeFamily,
  updateEmployeeFamily,
  deleteEmployeeFamily,
  getEmployeeEducation,
  createEmployeeEducation,
  updateEmployeeEducation,
  deleteEmployeeEducation,
  getEmployeeExperience,
  createEmployeeExperience,
  updateEmployeeExperience,
  deleteEmployeeExperience,
} from "@/services/employeeBiodataService";
import { getActiveShifts, assignShift } from "@/services/shiftService";
import type { Shift } from "@/services/shiftService";
import {
  getEmployeeRestDays,
  createEmployeeRestDay,
  deleteEmployeeRestDay,
  getBranchRestDays,
  getDayLabel,
  getAllDayLabels,
} from "@/services/restDayService";
import type { EmployeeRestDay, BranchRestDay } from "@/services/restDayService";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

type Employee = {
  id: number;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  employee_code: string;
  department: string;
  position: string;
  status: string;
  rfid_tag?: string | null;
  fingerprint_id?: string | null;
  birthday?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  contact_number?: string | null;
  address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  emergency_contact_address?: string | null;
  emergency_contact_relation?: string | null;
  hired_date?: string | null;
  created_at?: string | null;
  profile_image?: string | null;
  sss_number?: string | null;
  philhealth_number?: string | null;
  hdmf_number?: string | null;
  tin_number?: string | null;
  resignation_date?: string | null;
  termination_date?: string | null;
  termination_reason?: string | null;
  last_working_date?: string | null;
  final_pay_processed?: boolean;
  final_pay_date?: string | null;
  final_pay_amount?: number | null;
  branch_id?: number | null;
  branch_name?: string | null;
  employment_status?: string | null;
  probation_period_months?: number | null;
  regularization_date?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  mode: "view" | "edit" | "create";
  onUpdate: (data: any) => void;
  canEdit: boolean;
  canCreate: boolean;
  canView: boolean;
};

const formatValue = (value: any) => value || "-";

const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{formatValue(value)}</p>
  </div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder = "",
  disabled = false,
}: any) => (
  <div>
    <p className="text-xs text-muted-foreground">
      {label} {required && <span className="text-red-500">*</span>}
    </p>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full border rounded px-2 py-1 bg-background"
      placeholder={placeholder}
      disabled={disabled}
    />
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
}: any) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full border rounded px-2 py-1 bg-background"
      disabled={disabled}
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const EmployeeDrawer = ({
  open,
  onClose,
  employee,
  mode,
  onUpdate,
  canEdit,
  canCreate,
}: Props) => {
  useAuth();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string; code: string }[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [restDays, setRestDays] = useState<EmployeeRestDay[]>([]);
  const [restDaysLoading, setRestDaysLoading] = useState(false);
  const [branchRestDays, setBranchRestDays] = useState<BranchRestDay[]>([]);
  const [branchRestDaysLoading, setBranchRestDaysLoading] = useState(false);

  const [familyOpen, setFamilyOpen] = useState(false);
  const [familyData, setFamilyData] = useState<any[]>([]);
  const [familyDialog, setFamilyDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingFamily, setEditingFamily] = useState<any>({});

  const [educationOpen, setEducationOpen] = useState(false);
  const [educationData, setEducationData] = useState<any[]>([]);
  const [educationDialog, setEducationDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingEducation, setEditingEducation] = useState<any>({});

  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [experienceDialog, setExperienceDialog] = useState<{ open: boolean; mode: "create" | "edit"; item: any }>({ open: false, mode: "create", item: null });
  const [editingExperience, setEditingExperience] = useState<any>({});

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getActiveBranches();
        setBranches(data);
      } catch {
        // silently fail - branches are optional for the form
      }
    };
    fetchBranches();
    const fetchShifts = async () => {
      try { setShifts(await getActiveShifts()); } catch { /* silent */ }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    if (employee?.id && (mode === "edit" || mode === "view")) {
      setRestDaysLoading(true);
      getEmployeeRestDays(employee.id)
        .then(setRestDays)
        .catch(() => {})
        .finally(() => setRestDaysLoading(false));
    }
  }, [employee?.id, mode]);

  useEffect(() => {
    const branchId = employee?.branch_id;
    if (branchId && (mode === "edit" || mode === "view")) {
      setBranchRestDaysLoading(true);
      getBranchRestDays(branchId)
        .then(setBranchRestDays)
        .catch(() => setBranchRestDays([]))
        .finally(() => setBranchRestDaysLoading(false));
    } else {
      setBranchRestDays([]);
    }
  }, [employee?.branch_id, mode]);

  const canEditMode =
    (mode === "edit" && canEdit) || (mode === "create" && canCreate);
  const isViewOnly = mode === "view" || !canEditMode;

  const getFullName = () => {
    if (mode === "create") {
      const parts = [
        form.first_name,
        form.middle_name,
        form.last_name,
        form.suffix ? `, ${form.suffix}` : "",
      ].filter(Boolean);
      return parts.join(" ").replace(/\s+,/, ",");
    }
    if (employee) {
      if (employee.first_name && employee.last_name) {
        return `${employee.first_name} ${employee.middle_name || ""} ${employee.last_name}${employee.suffix ? `, ${employee.suffix}` : ""}`.trim();
      }
      return employee.name;
    }
    return "";
  };

  useEffect(() => {
    if (mode === "edit" && employee) {
      setForm({
        ...employee,
        birthday: formatDateForInput(employee.birthday || ""),
        hired_date: formatDateForInput(employee.hired_date || ""),
        resignation_date: employee.resignation_date
          ? formatDateForInput(employee.resignation_date)
          : "",
        termination_date: employee.termination_date
          ? formatDateForInput(employee.termination_date)
          : "",
        termination_reason: employee.termination_reason || "",
        last_working_date: employee.last_working_date
          ? formatDateForInput(employee.last_working_date)
          : "",
      });
    } else if (mode === "create") {
      setForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        employee_code: "",
        department: "",
        position: "",
        status: "ACTIVE",
        employment_status: "REGULAR",
        probation_period_months: "",
        rfid_tag: "",
        fingerprint_id: "",
        birthday: "",
        gender: "",
        marital_status: "",
        contact_number: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_number: "",
        emergency_contact_address: "",
        emergency_contact_relation: "",
        hired_date: new Date().toISOString().split("T")[0],
        sss_number: "",
        philhealth_number: "",
        hdmf_number: "",
        tin_number: "",
        resignation_date: "",
        termination_date: "",
        termination_reason: "",
        last_working_date: "",
        branch_id: branches.length > 0 ? branches[0].id : "",
        shift_id: "",
      });
    } else if (mode === "view" && employee) {
      setForm(employee);
    }
  }, [employee, mode, branches]);

  const handleChange = (e: any) => {
    if (isViewOnly) return;
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, birthday: value });
  };

  const handleHiredDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({ ...form, hired_date: value });
  };

  const handleBirthdayClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input && (input as any).showPicker) {
      try {
        (input as any).showPicker();
      } catch (err) {}
    }
  };

  const handleHiredDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input && (input as any).showPicker) {
      try {
        (input as any).showPicker();
      } catch (err) {}
    }
  };

  const loadFamily = async () => {
    if (!employee?.id) return;
    try { setFamilyData(await getEmployeeFamily(employee.id)); } catch { /* silent */ }
  };

  const loadEducation = async () => {
    if (!employee?.id) return;
    try { setEducationData(await getEmployeeEducation(employee.id)); } catch { /* silent */ }
  };

  const loadExperience = async () => {
    if (!employee?.id) return;
    try { setExperienceData(await getEmployeeExperience(employee.id)); } catch { /* silent */ }
  };

  useEffect(() => { if (employee?.id) { loadFamily(); loadEducation(); loadExperience(); } }, [employee?.id]);

  const handleCreateFamily = async () => {
    if (!employee?.id) return;
    try {
      await createEmployeeFamily(employee.id, editingFamily);
      toast.success("Family member added");
      setFamilyDialog({ open: false, mode: "create", item: null });
      setEditingFamily({});
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateFamily = async () => {
    if (!employee?.id || !familyDialog.item) return;
    try {
      await updateEmployeeFamily(employee.id, familyDialog.item.id, editingFamily);
      toast.success("Family member updated");
      setFamilyDialog({ open: false, mode: "create", item: null });
      setEditingFamily({});
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteFamily = async (id: number) => {
    if (!employee?.id) return;
    if (!confirm("Delete this family member?")) return;
    try {
      await deleteEmployeeFamily(employee.id, id);
      toast.success("Family member deleted");
      loadFamily();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCreateEducation = async () => {
    if (!employee?.id) return;
    try {
      await createEmployeeEducation(employee.id, editingEducation);
      toast.success("Education record added");
      setEducationDialog({ open: false, mode: "create", item: null });
      setEditingEducation({});
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateEducation = async () => {
    if (!employee?.id || !educationDialog.item) return;
    try {
      await updateEmployeeEducation(employee.id, educationDialog.item.id, editingEducation);
      toast.success("Education record updated");
      setEducationDialog({ open: false, mode: "create", item: null });
      setEditingEducation({});
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteEducation = async (id: number) => {
    if (!employee?.id) return;
    if (!confirm("Delete this education record?")) return;
    try {
      await deleteEmployeeEducation(employee.id, id);
      toast.success("Education record deleted");
      loadEducation();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCreateExperience = async () => {
    if (!employee?.id) return;
    try {
      await createEmployeeExperience(employee.id, editingExperience);
      toast.success("Work experience added");
      setExperienceDialog({ open: false, mode: "create", item: null });
      setEditingExperience({});
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateExperience = async () => {
    if (!employee?.id || !experienceDialog.item) return;
    try {
      await updateEmployeeExperience(employee.id, experienceDialog.item.id, editingExperience);
      toast.success("Work experience updated");
      setExperienceDialog({ open: false, mode: "create", item: null });
      setEditingExperience({});
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteExperience = async (id: number) => {
    if (!employee?.id) return;
    if (!confirm("Delete this work experience?")) return;
    try {
      await deleteEmployeeExperience(employee.id, id);
      toast.success("Work experience deleted");
      loadExperience();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSave = async () => {
    if (isViewOnly) return;

    try {
      setLoading(true);

      if (!form.first_name?.trim() && !form.name?.trim()) {
        toast.error("First name or full name is required");
        return;
      }

      if (!form.department?.trim()) {
        toast.error("Department is required");
        return;
      }

      if (!form.position?.trim()) {
        toast.error("Position is required");
        return;
      }

      const probationMonths = form.probation_period_months !== "" && form.probation_period_months != null
        ? Number(form.probation_period_months)
        : null;

      const apiData = {
        ...form,
        probation_period_months: probationMonths,
        name: form.name || `${form.first_name} ${form.last_name || ""}`.trim(),
      };

      let result;

      if (mode === "edit") {
        if (!employee) return;
        result = await updateEmployee(employee.id, apiData);
        toast.success("Employee updated successfully");
      } else if (mode === "create") {
        result = await createEmployee(apiData);
        toast.success("Employee created successfully");
      } else {
        return;
      }

      const employeeId = result.id || result.employee_id;
      if (form.shift_id && employeeId) {
        const effectiveDate = form.hired_date || new Date().toISOString().split("T")[0];
        try {
          await assignShift(employeeId, Number(form.shift_id), effectiveDate, null);
        } catch {
          console.warn("Shift assignment failed (non-critical)");
        }
      }

      onUpdate(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (mode !== "create" && !employee) return null;

  return (
    <Drawer open={open} onOpenChange={onClose} direction="right">
      <DrawerContent className="z-50" style={{ zIndex: 9999 }}>
        <DrawerHeader>
          <DrawerTitle>
            {mode === "view"
              ? "Employee Details"
              : mode === "edit"
                ? "Edit Employee"
                : "Add Employee"}
          </DrawerTitle>
          <DrawerDescription>
            {mode === "view"
              ? "View employee information"
              : mode === "edit"
                ? "Update employee details"
                : "Add a new employee to the system"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* PROFILE HEADER */}
          {mode !== "create" && employee && (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/40">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                {(employee.first_name || employee.name)
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{getFullName()}</p>
                <p className="text-xs text-muted-foreground">
                  {employee.employee_code}
                </p>
              </div>
            </div>
          )}

          {mode === "view" ? (
            // VIEW MODE
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Basic Information
                </p>
                <Info label="Employee Code" value={employee?.employee_code} />
                <Info label="Full Name" value={getFullName()} />
                {employee?.first_name && (
                  <>
                    <Info label="First Name" value={employee?.first_name} />
                    <Info label="Middle Name" value={employee?.middle_name} />
                    <Info label="Last Name" value={employee?.last_name} />
                    <Info label="Suffix" value={employee?.suffix} />
                  </>
                )}
                <Info label="Department" value={employee?.department} />
                <Info label="Position" value={employee?.position} />
                <div>
                  <p className="text-xs text-muted-foreground">Employment Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded font-semibold ${
                    employee?.employment_status === "REGULAR"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : employee?.employment_status === "PROBATIONARY"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}>
                    {employee?.employment_status || "REGULAR"}
                  </span>
                </div>
                {employee?.employment_status === "PROBATIONARY" ? (
                  <>
                    <Info
                      label="Probation Period"
                      value={employee?.probation_period_months
                        ? `${employee.probation_period_months} months`
                        : "Company Default (6 months)"
                      }
                    />
                    <Info
                      label="Regularization Date"
                      value={employee?.regularization_date
                        ? formatDate(employee.regularization_date)
                        : "Not set"
                      }
                    />
                    {employee?.regularization_date && (() => {
                      const daysLeft = Math.ceil(
                        (new Date(employee.regularization_date!).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div>
                          <p className="text-xs text-muted-foreground">Days Remaining</p>
                          <p className={`text-sm font-medium ${daysLeft <= 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-green-600"}`}>
                            {daysLeft <= 0 ? "Due for Regularization" : `${daysLeft} days`}
                          </p>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <Info
                    label="Probation Period"
                    value="Not Applicable"
                  />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                      employee?.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : employee?.status === "RESIGNED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : employee?.status === "TERMINATED"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            : "bg-secondary text-foreground"
                    }`}
                  >
                    {employee?.status}
                  </span>
                </div>
              </div>

              {/* Show separation info in view mode */}
              {(employee?.status === "RESIGNED" ||
                employee?.status === "TERMINATED") && (
                <div className="rounded-lg border border-red-200 p-4 space-y-3">
                  <p className="text-xs font-semibold text-red-600 uppercase">
                    Separation Information
                  </p>

                  {employee?.status === "RESIGNED" &&
                    employee?.resignation_date && (
                      <Info
                        label="Resignation Date"
                        value={formatDate(employee.resignation_date)}
                      />
                    )}

                  {employee?.status === "TERMINATED" &&
                    employee?.termination_date && (
                      <Info
                        label="Termination Date"
                        value={formatDate(employee.termination_date)}
                      />
                    )}

                  {employee?.status === "TERMINATED" &&
                    employee?.termination_reason && (
                      <Info
                        label="Termination Reason"
                        value={employee.termination_reason}
                      />
                    )}

                  {employee?.last_working_date && (
                    <Info
                      label="Last Working Date"
                      value={formatDate(employee.last_working_date)}
                    />
                  )}

                  {employee?.final_pay_processed && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                      <Info label="Final Pay Processed" value="✅ Yes" />
                      {employee?.final_pay_date && (
                        <Info
                          label="Final Pay Date"
                          value={formatDate(employee.final_pay_date)}
                        />
                      )}
                      {employee?.final_pay_amount && (
                        <Info
                          label="Final Pay Amount"
                          value={`₱${Number(employee.final_pay_amount).toLocaleString()}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Personal Information
                </p>
                <Info
                  label="Birthday"
                  value={
                    employee?.birthday ? formatDate(employee.birthday) : "-"
                  }
                />
                <Info label="Gender" value={employee?.gender} />
                <Info label="Marital Status" value={employee?.marital_status} />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Contact Information
                </p>
                <Info label="Contact Number" value={employee?.contact_number} />
                <Info label="Address" value={employee?.address} />

                {employee?.emergency_contact_name && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Emergency Contact
                    </p>
                    <Info
                      label="Name"
                      value={employee?.emergency_contact_name}
                    />
                    {employee?.emergency_contact_number && (
                      <Info
                        label="Phone"
                        value={employee?.emergency_contact_number}
                      />
                    )}
                    {employee?.emergency_contact_relation && (
                      <Info
                        label="Relation"
                        value={employee?.emergency_contact_relation}
                      />
                    )}
                    {employee?.emergency_contact_address && (
                      <Info
                        label="Address"
                        value={employee?.emergency_contact_address}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Government Information
                </p>
                <Info label="SSS Number" value={employee?.sss_number} />
                <Info
                  label="PhilHealth Number"
                  value={employee?.philhealth_number}
                />
                <Info label="Pag-IBIG Number" value={employee?.hdmf_number} />
                <Info label="TIN Number" value={employee?.tin_number} />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Branch
                </p>
                <Info
                  label="Branch"
                  value={employee?.branch_name || "Main Branch"}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  System Information
                </p>
                <Info label="RFID Tag" value={employee?.rfid_tag} />
                <Info label="Fingerprint ID" value={employee?.fingerprint_id} />
                <Info
                  label="Hired Date"
                  value={
                    employee?.hired_date ? formatDate(employee.hired_date) : "-"
                  }
                />
                <Info
                  label="Created At"
                  value={
                    employee?.created_at ? formatDate(employee.created_at) : "-"
                  }
                />
              </div>

              {/* FAMILY MEMBERS VIEW */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setFamilyOpen(!familyOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Family Members</p>
                  <span className="text-xs text-muted-foreground">{familyOpen ? '▲' : '▼'}</span>
                </div>
                {familyOpen && (
                  <>
                    {familyData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No family members recorded.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">Name</th>
                            <th className="text-left py-1 font-medium">Relationship</th>
                            <th className="text-left py-1 font-medium">Occupation</th>
                            <th className="text-left py-1 font-medium">Contact</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {familyData.map((m: any) => (
                            <tr key={m.id} className="border-b last:border-0">
                              <td className="py-1.5">{m.full_name}</td>
                              <td className="py-1.5 capitalize">{m.relationship_type}</td>
                              <td className="py-1.5">{m.occupation || '—'}</td>
                              <td className="py-1.5">{m.contact_number || '—'}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingFamily({ ...m, birthdate: m.birthdate?.split('T')[0] || '' }); setFamilyDialog({ open: true, mode: "edit", item: m }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteFamily(m.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingFamily({ relationship_type: "spouse", is_dependent: false }); setFamilyDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Family Member</button>
                    )}
                    {familyDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{familyDialog.mode === "create" ? "Add Family Member" : "Edit Family Member"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <InputField label="Full Name" name="full_name" value={editingFamily.full_name} onChange={e => setEditingFamily({ ...editingFamily, full_name: e.target.value })} required />
                            <div>
                              <p className="text-xs text-muted-foreground">Relationship <span className="text-red-500">*</span></p>
                              <select name="relationship_type" value={editingFamily.relationship_type || ""} onChange={e => setEditingFamily({ ...editingFamily, relationship_type: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                                <option value="">Select...</option>
                                <option value="spouse">Spouse</option>
                                <option value="child">Child</option>
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="parent">Parent</option>
                                <option value="dependent">Dependent</option>
                              </select>
                            </div>
                            <InputField label="Birthdate" name="birthdate" type="date" value={editingFamily.birthdate || ""} onChange={e => setEditingFamily({ ...editingFamily, birthdate: e.target.value })} />
                            <InputField label="Occupation" name="occupation" value={editingFamily.occupation || ""} onChange={e => setEditingFamily({ ...editingFamily, occupation: e.target.value })} />
                            <InputField label="Contact Number" name="contact_number" value={editingFamily.contact_number || ""} onChange={e => setEditingFamily({ ...editingFamily, contact_number: e.target.value })} />
                            <InputField label="Address" name="address" value={editingFamily.address || ""} onChange={e => setEditingFamily({ ...editingFamily, address: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={editingFamily.is_dependent || false} onChange={e => setEditingFamily({ ...editingFamily, is_dependent: e.target.checked })} className="accent-primary" />
                              Is Dependent
                            </label>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={familyDialog.mode === "create" ? handleCreateFamily : handleUpdateFamily} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{familyDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* EDUCATION VIEW */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setEducationOpen(!educationOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Education</p>
                  <span className="text-xs text-muted-foreground">{educationOpen ? '▲' : '▼'}</span>
                </div>
                {educationOpen && (
                  <>
                    {educationData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No education records.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">School</th>
                            <th className="text-left py-1 font-medium">Level</th>
                            <th className="text-left py-1 font-medium">Course</th>
                            <th className="text-left py-1 font-medium">Year</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {educationData.map((e: any) => (
                            <tr key={e.id} className="border-b last:border-0">
                              <td className="py-1.5">{e.school_name}</td>
                              <td className="py-1.5 capitalize">{e.education_level.replace('_', ' ')}</td>
                              <td className="py-1.5">{e.course_or_degree || '—'}</td>
                              <td className="py-1.5">{e.year_started || '—'}{e.year_graduated ? ` - ${e.year_graduated}` : ''}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingEducation({ ...e }); setEducationDialog({ open: true, mode: "edit", item: e }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteEducation(e.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingEducation({ education_level: "college" }); setEducationDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Education</button>
                    )}
                    {educationDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setEducationDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{educationDialog.mode === "create" ? "Add Education" : "Edit Education"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <div>
                              <p className="text-xs text-muted-foreground">Education Level <span className="text-red-500">*</span></p>
                              <select name="education_level" value={editingEducation.education_level || ""} onChange={e => setEditingEducation({ ...editingEducation, education_level: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                                <option value="">Select...</option>
                                <option value="elementary">Elementary</option>
                                <option value="high_school">High School</option>
                                <option value="college">College</option>
                                <option value="masters">Masters</option>
                                <option value="doctorate">Doctorate</option>
                                <option value="vocational">Vocational</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <InputField label="School Name" name="school_name" value={editingEducation.school_name || ""} onChange={e => setEditingEducation({ ...editingEducation, school_name: e.target.value })} required />
                            <InputField label="Course / Degree" name="course_or_degree" value={editingEducation.course_or_degree || ""} onChange={e => setEditingEducation({ ...editingEducation, course_or_degree: e.target.value })} />
                            <InputField label="Year Started" name="year_started" type="number" value={editingEducation.year_started || ""} onChange={e => setEditingEducation({ ...editingEducation, year_started: e.target.value })} />
                            <InputField label="Year Graduated" name="year_graduated" type="number" value={editingEducation.year_graduated || ""} onChange={e => setEditingEducation({ ...editingEducation, year_graduated: e.target.value })} />
                            <InputField label="Honors / Awards" name="honors_awards" value={editingEducation.honors_awards || ""} onChange={e => setEditingEducation({ ...editingEducation, honors_awards: e.target.value })} />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEducationDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={educationDialog.mode === "create" ? handleCreateEducation : handleUpdateEducation} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{educationDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* WORK EXPERIENCE VIEW */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExperienceOpen(!experienceOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Work Experience</p>
                  <span className="text-xs text-muted-foreground">{experienceOpen ? '▲' : '▼'}</span>
                </div>
                {experienceOpen && (
                  <>
                    {experienceData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No work experience recorded.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">Company</th>
                            <th className="text-left py-1 font-medium">Position</th>
                            <th className="text-left py-1 font-medium">Period</th>
                            <th className="text-left py-1 font-medium">Reason for Leaving</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {experienceData.map((x: any) => (
                            <tr key={x.id} className="border-b last:border-0">
                              <td className="py-1.5">{x.company_name}</td>
                              <td className="py-1.5">{x.position}</td>
                              <td className="py-1.5">{x.start_date?.split('T')[0] || '—'} to {x.end_date?.split('T')[0] || 'Present'}</td>
                              <td className="py-1.5">{x.reason_for_leaving || '—'}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingExperience({ ...x, start_date: x.start_date?.split('T')[0] || '', end_date: x.end_date?.split('T')[0] || '' }); setExperienceDialog({ open: true, mode: "edit", item: x }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteExperience(x.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingExperience({}); setExperienceDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Work Experience</button>
                    )}
                    {experienceDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{experienceDialog.mode === "create" ? "Add Work Experience" : "Edit Work Experience"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <InputField label="Company Name" name="company_name" value={editingExperience.company_name || ""} onChange={e => setEditingExperience({ ...editingExperience, company_name: e.target.value })} required />
                            <InputField label="Position" name="position" value={editingExperience.position || ""} onChange={e => setEditingExperience({ ...editingExperience, position: e.target.value })} required />
                            <InputField label="Start Date" name="start_date" type="date" value={editingExperience.start_date || ""} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} />
                            <InputField label="End Date" name="end_date" type="date" value={editingExperience.end_date || ""} onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })} />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Reason for Leaving</p>
                              <textarea name="reason_for_leaving" value={editingExperience.reason_for_leaving || ""} onChange={e => setEditingExperience({ ...editingExperience, reason_for_leaving: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm min-h-[60px]" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={experienceDialog.mode === "create" ? handleCreateExperience : handleUpdateExperience} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{experienceDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            // EDIT/CREATE MODE
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Basic Information
                </p>
                <InputField
                  label="Employee Code"
                  name="employee_code"
                  value={form.employee_code}
                  onChange={handleChange}
                  placeholder="EMP-001"
                  disabled={!canEditMode}
                />
                <p className="text-xs text-muted-foreground -mt-2">
                  Leave blank to auto-generate when enabled.
                </p>

                <InputField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required={true}
                  placeholder="First name"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Middle Name"
                  name="middle_name"
                  value={form.middle_name}
                  onChange={handleChange}
                  placeholder="Middle name (optional)"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required={true}
                  placeholder="Last name"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Suffix"
                  name="suffix"
                  value={form.suffix}
                  onChange={handleChange}
                  placeholder="Jr., Sr., III, etc."
                  disabled={!canEditMode}
                />

                {mode === "edit" && !form.first_name && (
                  <InputField
                    label="Full Name (Legacy)"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required={true}
                    placeholder="Full name"
                    disabled={!canEditMode}
                  />
                )}

                <InputField
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required={true}
                  placeholder="e.g., Engineering"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Position"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required={true}
                  placeholder="e.g., Software Engineer"
                  disabled={!canEditMode}
                />

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Branch</p>
                  <select
                    name="branch_id"
                    value={form.branch_id || ""}
                    onChange={handleChange}
                    disabled={!canEditMode}
                    className="w-full border rounded px-2 py-1 bg-background"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <SelectField
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={["ACTIVE", "RESIGNED", "TERMINATED"]}
                  disabled={!canEditMode}
                />

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Employment Status</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="employment_status"
                        value="REGULAR"
                        checked={form.employment_status === "REGULAR"}
                        onChange={handleChange}
                        disabled={!canEditMode}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">REGULAR</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="employment_status"
                        value="PROBATIONARY"
                        checked={form.employment_status === "PROBATIONARY"}
                        onChange={handleChange}
                        disabled={!canEditMode}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium">PROBATIONARY</span>
                    </label>
                  </div>
                </div>

                {form.employment_status === "REGULAR" ? (
                  <div className="p-3 bg-muted/30 rounded border text-sm text-muted-foreground">
                    Probation is not applicable for Regular employees.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Probation Period (Months)</p>
                      <input
                        type="number"
                        name="probation_period_months"
                        value={form.probation_period_months ?? ""}
                        onChange={handleChange}
                        disabled={!canEditMode}
                        min={1}
                        max={24}
                        placeholder="Company Default (6 months)"
                        className="w-full border rounded px-2 py-1 bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Leave blank to use company default (6 months)</p>
                    </div>
                    {form.hired_date && (form.probation_period_months || form.probation_period_months === "") && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Expected Regularization Date</p>
                        <p className="font-medium">
                          {(() => {
                            const hireDate = new Date(form.hired_date);
                            const months = form.probation_period_months
                              ? Number(form.probation_period_months)
                              : 6;
                            hireDate.setMonth(hireDate.getMonth() + months);
                            return formatDate(hireDate.toISOString().split("T")[0]);
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on {form.probation_period_months || "6"} month{form.probation_period_months !== "1" ? "s" : ""} from hire date
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Show separation date fields when status is RESIGNED or TERMINATED */}

                {(form.status === "RESIGNED" ||
                  form.status === "TERMINATED") && (
                  <div className="space-y-3 pt-2 border-t border-red-200">
                    <p className="text-xs font-semibold text-red-600 uppercase">
                      Separation Information
                    </p>

                    {form.status === "RESIGNED" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Resignation Date
                        </p>
                        <input
                          type="date"
                          name="resignation_date"
                          value={form.resignation_date || ""}
                          onChange={handleChange}
                          disabled={!canEditMode}
                          className="w-full border rounded px-2 py-1 bg-background cursor-pointer"
                          style={{ position: "relative", zIndex: 10000 }}
                          onClick={(e) => {
                            const input = e.currentTarget;
                            if (input && (input as any).showPicker) {
                              try {
                                (input as any).showPicker();
                              } catch (err) {}
                            }
                          }}
                        />
                      </div>
                    )}

                    {form.status === "TERMINATED" && (
                      <>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Termination Date
                          </p>
                          <input
                            type="date"
                            name="termination_date"
                            value={form.termination_date || ""}
                            onChange={handleChange}
                            disabled={!canEditMode}
                            className="w-full border rounded px-2 py-1 bg-background cursor-pointer"
                            style={{ position: "relative", zIndex: 10000 }}
                            onClick={(e) => {
                              const input = e.currentTarget;
                              if (input && (input as any).showPicker) {
                                try {
                                  (input as any).showPicker();
                                } catch (err) {}
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Termination Reason
                          </p>
                          <textarea
                            name="termination_reason"
                            value={form.termination_reason || ""}
                            onChange={handleChange}
                            disabled={!canEditMode}
                            className="w-full border rounded px-2 py-1 bg-background min-h-[60px]"
                            placeholder="e.g., Failed probationary, Violation of company policy"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Last Working Date
                      </p>
                      <input
                        type="date"
                        name="last_working_date"
                        value={form.last_working_date || ""}
                        onChange={handleChange}
                        disabled={!canEditMode}
                        className="w-full border rounded px-2 py-1 bg-background cursor-pointer"
                        style={{ position: "relative", zIndex: 10000 }}
                        onClick={(e) => {
                          const input = e.currentTarget;
                          if (input && (input as any).showPicker) {
                            try {
                              (input as any).showPicker();
                            } catch (err) {}
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        The last day the employee actually worked
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Personal Information
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Birthday</p>
                  <input
                    type="date"
                    name="birthday"
                    value={form.birthday || ""}
                    onChange={handleBirthdayChange}
                    onClick={handleBirthdayClick}
                    disabled={!canEditMode}
                    className="w-full border rounded px-2 py-1 bg-background cursor-pointer"
                    style={{ position: "relative", zIndex: 10000 }}
                  />
                </div>
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={["Male", "Female"]}
                  disabled={!canEditMode}
                />
                <SelectField
                  label="Marital Status"
                  name="marital_status"
                  value={form.marital_status}
                  onChange={handleChange}
                  options={["Single", "Married", "Divorced", "Widowed"]}
                  disabled={!canEditMode}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Contact Information
                </p>
                <InputField
                  label="Contact Number"
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  placeholder="+63 912 345 6789"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Full address"
                  disabled={!canEditMode}
                />

                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Emergency Contact
                  </p>
                  <InputField
                    label="Contact Name"
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Full name of emergency contact"
                    disabled={!canEditMode}
                  />
                  <InputField
                    label="Contact Number"
                    name="emergency_contact_number"
                    value={form.emergency_contact_number}
                    onChange={handleChange}
                    placeholder="Emergency contact phone number"
                    disabled={!canEditMode}
                  />
                  <InputField
                    label="Relation"
                    name="emergency_contact_relation"
                    value={form.emergency_contact_relation}
                    onChange={handleChange}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    disabled={!canEditMode}
                  />
                  <InputField
                    label="Address"
                    name="emergency_contact_address"
                    value={form.emergency_contact_address}
                    onChange={handleChange}
                    placeholder="Emergency contact address (optional)"
                    disabled={!canEditMode}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Government Information
                </p>
                <InputField
                  label="SSS Number"
                  name="sss_number"
                  value={form.sss_number}
                  onChange={handleChange}
                  placeholder="SSS number"
                  disabled={!canEditMode}
                />
                <InputField
                  label="PhilHealth Number"
                  name="philhealth_number"
                  value={form.philhealth_number}
                  onChange={handleChange}
                  placeholder="PhilHealth number"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Pag-IBIG Number"
                  name="hdmf_number"
                  value={form.hdmf_number}
                  onChange={handleChange}
                  placeholder="Pag-IBIG number"
                  disabled={!canEditMode}
                />
                <InputField
                  label="TIN Number"
                  name="tin_number"
                  value={form.tin_number}
                  onChange={handleChange}
                  placeholder="TIN number"
                  disabled={!canEditMode}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  System Information
                </p>
                <InputField
                  label="RFID Tag"
                  name="rfid_tag"
                  value={form.rfid_tag}
                  onChange={handleChange}
                  placeholder="RFID card number"
                  disabled={!canEditMode}
                />
                <InputField
                  label="Fingerprint ID"
                  name="fingerprint_id"
                  value={form.fingerprint_id}
                  onChange={handleChange}
                  placeholder="Fingerprint scanner ID"
                  disabled={!canEditMode}
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Hired Date</p>
                  <input
                    type="date"
                    name="hired_date"
                    value={form.hired_date || ""}
                    onChange={handleHiredDateChange}
                    onClick={handleHiredDateClick}
                    disabled={!canEditMode}
                    className="w-full border rounded px-2 py-1 bg-background cursor-pointer"
                    style={{ position: "relative", zIndex: 10000 }}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Shift Assignment</p>
                  <select
                    name="shift_id"
                    value={form.shift_id || ""}
                    onChange={handleChange}
                    disabled={!canEditMode}
                    className="w-full border rounded px-2 py-1 bg-background"
                  >
                    <option value="">Default (8AM-5PM)</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* REST DAY OVERRIDES */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Rest Day Overrides {restDaysLoading && <span className="text-xs italic">(loading...)</span>}
                  </p>

                  {!employee?.id ? (
                    // ── CREATE MODE: explain inheritance, no Add button ──
                    <p className="text-xs text-muted-foreground italic">
                      Rest days are inherited from the selected branch. Save employee first to configure individual overrides.
                    </p>
                  ) : (
                    // ── EDIT / VIEW MODE ──
                    <>
                      <p className="text-xs text-muted-foreground italic">
                        Overrides the branch default rest days for this employee.
                      </p>

                      {/* Branch default rest days (informational) */}
                      {branchRestDays.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">Branch Default Rest Days</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {branchRestDays.map((brd) => (
                              <span
                                key={brd.id}
                                className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              >
                                {getDayLabel(brd.day_of_week)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Employee overrides */}
                      {restDays.length === 0 && !restDaysLoading && (
                        <p className="text-xs text-muted-foreground italic">No rest days configured.</p>
                      )}
                      {restDays.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {restDays.map((rd) => (
                            <span
                              key={rd.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {getDayLabel(rd.day_of_week)}
                              {canEditMode && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteEmployeeRestDay(rd.id);
                                      setRestDays((prev) => prev.filter((r) => r.id !== rd.id));
                                      toast.success("Rest day removed");
                                    } catch { toast.error("Failed to remove rest day"); }
                                  }}
                                  className="text-blue-800 hover:text-red-600 ml-0.5 dark:text-blue-400"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add button and selector (edit mode only) */}
                      {canEditMode && (
                        <div className="flex gap-1">
                          <select
                            id="rest-day-select"
                            className="flex-1 border rounded px-2 py-1 text-xs bg-background"
                            defaultValue=""
                          >
                            <option value="" disabled>Select day...</option>
                            {getAllDayLabels().map((label, idx) => (
                              <option key={idx} value={idx}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={async () => {
                              const sel = document.getElementById("rest-day-select") as HTMLSelectElement;
                              const dow = parseInt(sel?.value);
                              if (isNaN(dow) || !employee?.id) return;
                              if (restDays.some((r) => r.day_of_week === dow)) {
                                toast.error("Rest day already added");
                                return;
                              }
                              try {
                                const created = await createEmployeeRestDay(employee.id, { day_of_week: dow });
                                setRestDays((prev) => [...prev, created]);
                                sel.value = "";
                                toast.success("Rest day added");
                              } catch { toast.error("Failed to add rest day"); }
                            }}
                            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                          >
                            + Add
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* FAMILY MEMBERS EDIT */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setFamilyOpen(!familyOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Family Members</p>
                  <span className="text-xs text-muted-foreground">{familyOpen ? '▲' : '▼'}</span>
                </div>
                {familyOpen && (
                  <>
                    {familyData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No family members recorded.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">Name</th>
                            <th className="text-left py-1 font-medium">Relationship</th>
                            <th className="text-left py-1 font-medium">Occupation</th>
                            <th className="text-left py-1 font-medium">Contact</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {familyData.map((m: any) => (
                            <tr key={m.id} className="border-b last:border-0">
                              <td className="py-1.5">{m.full_name}</td>
                              <td className="py-1.5 capitalize">{m.relationship_type}</td>
                              <td className="py-1.5">{m.occupation || '—'}</td>
                              <td className="py-1.5">{m.contact_number || '—'}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingFamily({ ...m, birthdate: m.birthdate?.split('T')[0] || '' }); setFamilyDialog({ open: true, mode: "edit", item: m }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteFamily(m.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingFamily({ relationship_type: "spouse", is_dependent: false }); setFamilyDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Family Member</button>
                    )}
                    {familyDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{familyDialog.mode === "create" ? "Add Family Member" : "Edit Family Member"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <InputField label="Full Name" name="full_name" value={editingFamily.full_name} onChange={e => setEditingFamily({ ...editingFamily, full_name: e.target.value })} required />
                            <div>
                              <p className="text-xs text-muted-foreground">Relationship <span className="text-red-500">*</span></p>
                              <select name="relationship_type" value={editingFamily.relationship_type || ""} onChange={e => setEditingFamily({ ...editingFamily, relationship_type: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                                <option value="">Select...</option>
                                <option value="spouse">Spouse</option>
                                <option value="child">Child</option>
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="parent">Parent</option>
                                <option value="dependent">Dependent</option>
                              </select>
                            </div>
                            <InputField label="Birthdate" name="birthdate" type="date" value={editingFamily.birthdate || ""} onChange={e => setEditingFamily({ ...editingFamily, birthdate: e.target.value })} />
                            <InputField label="Occupation" name="occupation" value={editingFamily.occupation || ""} onChange={e => setEditingFamily({ ...editingFamily, occupation: e.target.value })} />
                            <InputField label="Contact Number" name="contact_number" value={editingFamily.contact_number || ""} onChange={e => setEditingFamily({ ...editingFamily, contact_number: e.target.value })} />
                            <InputField label="Address" name="address" value={editingFamily.address || ""} onChange={e => setEditingFamily({ ...editingFamily, address: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={editingFamily.is_dependent || false} onChange={e => setEditingFamily({ ...editingFamily, is_dependent: e.target.checked })} className="accent-primary" />
                              Is Dependent
                            </label>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setFamilyDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={familyDialog.mode === "create" ? handleCreateFamily : handleUpdateFamily} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{familyDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* EDUCATION EDIT */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setEducationOpen(!educationOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Education</p>
                  <span className="text-xs text-muted-foreground">{educationOpen ? '▲' : '▼'}</span>
                </div>
                {educationOpen && (
                  <>
                    {educationData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No education records.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">School</th>
                            <th className="text-left py-1 font-medium">Level</th>
                            <th className="text-left py-1 font-medium">Course</th>
                            <th className="text-left py-1 font-medium">Year</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {educationData.map((e: any) => (
                            <tr key={e.id} className="border-b last:border-0">
                              <td className="py-1.5">{e.school_name}</td>
                              <td className="py-1.5 capitalize">{e.education_level.replace('_', ' ')}</td>
                              <td className="py-1.5">{e.course_or_degree || '—'}</td>
                              <td className="py-1.5">{e.year_started || '—'}{e.year_graduated ? ` - ${e.year_graduated}` : ''}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingEducation({ ...e }); setEducationDialog({ open: true, mode: "edit", item: e }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteEducation(e.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingEducation({ education_level: "college" }); setEducationDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Education</button>
                    )}
                    {educationDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setEducationDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{educationDialog.mode === "create" ? "Add Education" : "Edit Education"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <div>
                              <p className="text-xs text-muted-foreground">Education Level <span className="text-red-500">*</span></p>
                              <select name="education_level" value={editingEducation.education_level || ""} onChange={e => setEditingEducation({ ...editingEducation, education_level: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm">
                                <option value="">Select...</option>
                                <option value="elementary">Elementary</option>
                                <option value="high_school">High School</option>
                                <option value="college">College</option>
                                <option value="masters">Masters</option>
                                <option value="doctorate">Doctorate</option>
                                <option value="vocational">Vocational</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <InputField label="School Name" name="school_name" value={editingEducation.school_name || ""} onChange={e => setEditingEducation({ ...editingEducation, school_name: e.target.value })} required />
                            <InputField label="Course / Degree" name="course_or_degree" value={editingEducation.course_or_degree || ""} onChange={e => setEditingEducation({ ...editingEducation, course_or_degree: e.target.value })} />
                            <InputField label="Year Started" name="year_started" type="number" value={editingEducation.year_started || ""} onChange={e => setEditingEducation({ ...editingEducation, year_started: e.target.value })} />
                            <InputField label="Year Graduated" name="year_graduated" type="number" value={editingEducation.year_graduated || ""} onChange={e => setEditingEducation({ ...editingEducation, year_graduated: e.target.value })} />
                            <InputField label="Honors / Awards" name="honors_awards" value={editingEducation.honors_awards || ""} onChange={e => setEditingEducation({ ...editingEducation, honors_awards: e.target.value })} />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEducationDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={educationDialog.mode === "create" ? handleCreateEducation : handleUpdateEducation} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{educationDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* WORK EXPERIENCE EDIT */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExperienceOpen(!experienceOpen)}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Work Experience</p>
                  <span className="text-xs text-muted-foreground">{experienceOpen ? '▲' : '▼'}</span>
                </div>
                {experienceOpen && (
                  <>
                    {experienceData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No work experience recorded.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1 font-medium">Company</th>
                            <th className="text-left py-1 font-medium">Position</th>
                            <th className="text-left py-1 font-medium">Period</th>
                            <th className="text-left py-1 font-medium">Reason for Leaving</th>
                            {canEdit && <th className="text-right py-1 font-medium">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {experienceData.map((x: any) => (
                            <tr key={x.id} className="border-b last:border-0">
                              <td className="py-1.5">{x.company_name}</td>
                              <td className="py-1.5">{x.position}</td>
                              <td className="py-1.5">{x.start_date?.split('T')[0] || '—'} to {x.end_date?.split('T')[0] || 'Present'}</td>
                              <td className="py-1.5">{x.reason_for_leaving || '—'}</td>
                              {canEdit && (
                                <td className="py-1.5 text-right whitespace-nowrap">
                                  <button onClick={() => { setEditingExperience({ ...x, start_date: x.start_date?.split('T')[0] || '', end_date: x.end_date?.split('T')[0] || '' }); setExperienceDialog({ open: true, mode: "edit", item: x }); }} className="text-primary hover:underline mr-2">Edit</button>
                                  <button onClick={() => handleDeleteExperience(x.id)} className="text-red-500 hover:underline">Delete</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditingExperience({}); setExperienceDialog({ open: true, mode: "create", item: null }); }} className="text-xs text-primary hover:underline">+ Add Work Experience</button>
                    )}
                    {experienceDialog.open && (
                      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })}>
                        <div className="bg-background rounded-lg border p-4 w-full max-w-md mx-4 space-y-3 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                          <p className="text-sm font-semibold">{experienceDialog.mode === "create" ? "Add Work Experience" : "Edit Work Experience"}</p>
                          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            <InputField label="Company Name" name="company_name" value={editingExperience.company_name || ""} onChange={e => setEditingExperience({ ...editingExperience, company_name: e.target.value })} required />
                            <InputField label="Position" name="position" value={editingExperience.position || ""} onChange={e => setEditingExperience({ ...editingExperience, position: e.target.value })} required />
                            <InputField label="Start Date" name="start_date" type="date" value={editingExperience.start_date || ""} onChange={e => setEditingExperience({ ...editingExperience, start_date: e.target.value })} />
                            <InputField label="End Date" name="end_date" type="date" value={editingExperience.end_date || ""} onChange={e => setEditingExperience({ ...editingExperience, end_date: e.target.value })} />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Reason for Leaving</p>
                              <textarea name="reason_for_leaving" value={editingExperience.reason_for_leaving || ""} onChange={e => setEditingExperience({ ...editingExperience, reason_for_leaving: e.target.value })} className="w-full border rounded px-2 py-1 bg-background text-sm min-h-[60px]" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setExperienceDialog({ open: false, mode: "create", item: null })} className="px-3 py-1.5 text-sm border rounded hover:bg-muted">Cancel</button>
                            <button onClick={experienceDialog.mode === "create" ? handleCreateExperience : handleUpdateExperience} className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90">{experienceDialog.mode === "create" ? "Add" : "Save"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* SAVE BUTTON */}
        {(mode === "edit" && canEdit) || (mode === "create" && canCreate) ? (
          <div className="p-4 border-t flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Employee"
                  : "Save Changes"}
            </button>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};

export default EmployeeDrawer;
