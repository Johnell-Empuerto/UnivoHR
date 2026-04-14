import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import {
  getEmployeeSalary,
  updateEmployeeSalary,
  getDeductions,
  createDeduction,
  deleteDeduction,
} from "@/services/payrollService";

//  Helper to format employee name
const formatEmployeeName = (emp: any) => {
  if (emp.first_name && emp.last_name) {
    return `${emp.first_name} ${emp.middle_name || ""} ${emp.last_name}${emp.suffix ? `, ${emp.suffix}` : ""}`.trim();
  }
  return emp.name || "";
};

const PayrollSettings = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    basic_salary: "",
    overtime_rate: "",
    working_days_per_month: "26",
  });

  const [deductions, setDeductions] = useState<any[]>([]);
  const [newDeduction, setNewDeduction] = useState({
    type: "",
    amount: "",
  });

  const [lateType, setLateType] = useState("");
  const [lateAmount, setLateAmount] = useState("");

  // Debounce effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeSalary(currentPage, rowsPerPage, search);
      setEmployees(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, rowsPerPage, search]);

  const fetchDeductions = async (employeeId: number) => {
    try {
      const data = await getDeductions(employeeId);
      const nonLateDeductions = data.filter(
        (d: any) => !d.type.startsWith("LATE"),
      );
      setDeductions(nonLateDeductions);

      // Extract late deduction if exists
      const late = data.find((d: any) => d.type.startsWith("LATE"));
      if (late) {
        setLateType(late.type);
        setLateAmount(late.amount || "");
      } else {
        setLateType("");
        setLateAmount("");
      }
    } catch {
      toast.error("Failed to load deductions");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (emp: any) => {
    setSelected(emp);
    setForm({
      basic_salary: emp.basic_salary || "",
      overtime_rate: emp.overtime_rate || "",
      working_days_per_month: emp.working_days_per_month || "26",
    });
    fetchDeductions(emp.id);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateEmployeeSalary(selected.id, {
        basic_salary: Number(form.basic_salary) || 0,
        overtime_rate: Number(form.overtime_rate) || 0,
        working_days_per_month: Number(form.working_days_per_month) || 26,
      });
      toast.success("Salary updated");
      setOpen(false);
      fetchEmployees();
    } catch {
      toast.error("Failed to update salary");
    }
  };

  const handleAddDeduction = async () => {
    if (!newDeduction.type || !newDeduction.amount) {
      return toast.error("Fill all fields");
    }

    try {
      await createDeduction({
        employee_id: selected.id,
        type: newDeduction.type,
        amount: Number(newDeduction.amount),
      });
      toast.success("Deduction added");
      setNewDeduction({ type: "", amount: "" });
      fetchDeductions(selected.id);
    } catch {
      toast.error("Failed to add deduction");
    }
  };

  const handleDeleteDeduction = async (id: number) => {
    try {
      await deleteDeduction(id);
      toast.success("Deleted");
      fetchDeductions(selected.id);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSaveLate = async () => {
    if (!lateType) {
      return toast.error("Select late deduction type");
    }

    if (
      lateType !== "LATE_SALARY_BASED" &&
      (!lateAmount || Number(lateAmount) <= 0)
    ) {
      return toast.error("Enter valid amount");
    }

    try {
      // First, remove any existing late deduction
      const existingLate = deductions.find((d) => d.type.startsWith("LATE"));
      if (existingLate) {
        await deleteDeduction(existingLate.id);
      }

      await createDeduction({
        employee_id: selected.id,
        type: lateType,
        amount: lateType === "LATE_SALARY_BASED" ? 0 : Number(lateAmount),
      });

      toast.success("Late deduction saved");
      fetchDeductions(selected.id);
    } catch {
      toast.error("Failed to save late deduction");
    }
  };

  const handleDeleteLate = async () => {
    try {
      const existingLate = deductions.find((d) => d.type.startsWith("LATE"));
      if (existingLate) {
        await deleteDeduction(existingLate.id);
        toast.success("Late deduction removed");
        setLateType("");
        setLateAmount("");
        fetchDeductions(selected.id);
      }
    } catch {
      toast.error("Failed to delete late deduction");
    }
  };

  const computedDailyRate = () => {
    const basicSalary = Number(form.basic_salary) || 0;
    const workingDays = Number(form.working_days_per_month) || 26;
    if (basicSalary === 0) return 0;
    return (basicSalary / workingDays).toFixed(2);
  };

  const getDisplayDailyRate = (emp: any) => {
    if (emp.basic_salary && emp.working_days_per_month) {
      return (emp.basic_salary / emp.working_days_per_month).toFixed(2);
    }
    if (emp.basic_salary) {
      return (emp.basic_salary / 26).toFixed(2);
    }
    return "0";
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRows = Number(e.target.value);
    setRowsPerPage(newRows);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employee Salary Settings</h1>
        <p className="text-muted-foreground">
          Manage salary and deductions per employee
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Salary List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee code..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9 max-w-sm"
              />
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="rounded-md border shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="py-3 px-4 text-left font-medium">Name</th>
                    <th className="py-3 px-4 text-left font-medium">
                      Employee Code
                    </th>
                    <th className="py-3 px-4 text-left font-medium">
                      Basic Salary
                    </th>
                    <th className="py-3 px-4 text-left font-medium">
                      Daily Rate
                    </th>
                    <th className="py-3 px-4 text-left font-medium">OT Rate</th>
                    <th className="py-3 px-4 text-left font-medium">
                      Working Days
                    </th>
                    <th className="py-3 px-4 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchInput
                          ? "No employees found matching your search"
                          : "No employees found"}
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="border-b">
                        <td className="py-2 px-4">{formatEmployeeName(emp)}</td>
                        <td className="py-2 px-4">{emp.employee_code}</td>
                        <td className="py-2 px-4">
                          ₱{Number(emp.basic_salary || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          ₱{getDisplayDailyRate(emp)}
                        </td>
                        <td className="py-2 px-4">
                          ₱{Number(emp.overtime_rate || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          {emp.working_days_per_month || 26}
                        </td>
                        <td className="py-2 px-4">
                          <Button size="sm" onClick={() => handleEdit(emp)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {employees.length > 0 && (
                <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rows per page:
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {start} to {end} of {totalRecords} entries
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageNumbers().map((page, index) => (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          typeof page === "number" && goToPage(page)
                        }
                        disabled={page === "..."}
                        className={`h-8 w-8 p-0 ${page === "..." ? "cursor-default" : ""}`}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Salary & Deductions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selected &&
                `${formatEmployeeName(selected)} - ${selected?.employee_code}`}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Basic Salary (Monthly)
              </label>
              <Input
                name="basic_salary"
                placeholder="Basic Salary"
                type="number"
                value={form.basic_salary}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Working Days per Month
              </label>
              <Input
                type="number"
                name="working_days_per_month"
                placeholder="26"
                value={form.working_days_per_month}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to compute daily rate for deductions
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Daily Rate (Auto-computed)
              </label>
              <Input
                type="text"
                value={`₱${computedDailyRate()}`}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Based on {form.working_days_per_month || 26} working days per
                month
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Overtime Rate (per hour)
              </label>
              <Input
                name="overtime_rate"
                placeholder="Overtime Rate"
                type="number"
                value={form.overtime_rate}
                onChange={handleChange}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Government Deductions</h3>

              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newDeduction.type}
                  onChange={(e) =>
                    setNewDeduction({
                      ...newDeduction,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="">Select Type</option>
                  <option value="SSS">SSS</option>
                  <option value="PHILHEALTH">PhilHealth</option>
                  <option value="PAGIBIG">Pag-IBIG</option>
                  <option value="TAX">Tax Withholding</option>
                  <option value="LOAN">Loan</option>
                  <option value="OTHER">Other</option>
                </select>

                <Input
                  placeholder="Amount"
                  type="number"
                  value={newDeduction.amount}
                  onChange={(e) =>
                    setNewDeduction({
                      ...newDeduction,
                      amount: e.target.value,
                    })
                  }
                />

                <Button onClick={handleAddDeduction} size="sm">
                  Add
                </Button>
              </div>

              {deductions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No government deductions yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {deductions.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center border p-2 rounded"
                    >
                      <span className="text-sm">
                        <strong>{d.type}</strong> - ₱
                        {Number(d.amount).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDeduction(d.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LATE DEDUCTION SETTINGS */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Late Deduction Settings</h3>

              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={lateType}
                  onChange={(e) => setLateType(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="LATE_FIXED">Fixed (per late)</option>
                  <option value="LATE_PER_MINUTE">Per Minute</option>
                  <option value="LATE_SALARY_BASED">Salary Based</option>
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={lateAmount}
                  onChange={(e) => setLateAmount(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  disabled={lateType === "LATE_SALARY_BASED"}
                />

                <Button onClick={handleSaveLate} size="sm">
                  Save
                </Button>
              </div>

              {lateType === "LATE_SALARY_BASED" && (
                <p className="text-xs text-muted-foreground">
                  Auto computed from employee salary based on minutes late
                </p>
              )}

              {lateType && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">
                    {lateType === "LATE_FIXED" && "Fixed"}
                    {lateType === "LATE_PER_MINUTE" && "Per Minute"}
                    {lateType === "LATE_SALARY_BASED" && "Salary Based"}
                  </span>
                  {lateAmount && lateType !== "LATE_SALARY_BASED" && (
                    <span className="text-muted-foreground">
                      - ₱{Number(lateAmount).toLocaleString()}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteLate}
                    className="ml-auto"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Salary Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollSettings;
