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
  }, []);

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

  const handleSave = async () => {
    if (isViewOnly) return;

    try {
      setLoading(true);

      if (!form.first_name?.trim() && !form.name?.trim()) {
        toast.error("First name or full name is required");
        return;
      }

      if (!form.employee_code?.trim()) {
        toast.error("Employee code is required");
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
                  required={true}
                  placeholder="EMP-001"
                  disabled={!canEditMode}
                />

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
