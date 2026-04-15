// features/leaves/pages/LeaveApprovers.tsx
import { useEffect, useState } from "react";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getActiveEmployees } from "@/services/overtimeService";
import {
  getLeaveApprovers,
  createLeaveApprover,
  updateLeaveApprover,
  deleteLeaveApprover,
} from "@/services/leaveApproverService";

type ApproverMapping = {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  approver_id: number;
  approver_name: string;
  approver_code: string;
  approval_type: "LEAVE";
  created_at: string;
};

type Employee = {
  id: number;
  name: string;
  employee_code: string;
  department: string;
};

const LeaveApprovers = () => {
  const [data, setData] = useState<ApproverMapping[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvers, setApprovers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApproverMapping | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search states for dropdowns
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [approverSearch, setApproverSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [filteredApprovers, setFilteredApprovers] = useState<Employee[]>([]);

  // Form state - only LEAVE type
  const [formData, setFormData] = useState({
    employee_id: "",
    approver_id: "",
    approval_type: "LEAVE",
  });

  // Fetch employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesRes = await getActiveEmployees();
        setEmployees(employeesRes);
        setApprovers(employeesRes);
        setFilteredEmployees(employeesRes);
        setFilteredApprovers(employeesRes);
      } catch (err: any) {
        toast.error("Failed to load employees");
      }
    };
    fetchEmployees();
  }, []);

  // Fetch approver mappings (only LEAVE type)
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoading(true);
        const res = await getLeaveApprovers(
          currentPage,
          rowsPerPage,
          search,
          "LEAVE",
        );
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to fetch leave approver mappings");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovers();
  }, [currentPage, rowsPerPage, search]);

  // Filter employees for dropdown based on search
  useEffect(() => {
    if (employeeSearch.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
          emp.employee_code
            .toLowerCase()
            .includes(employeeSearch.toLowerCase()),
      );
      setFilteredEmployees(filtered);
    }
  }, [employeeSearch, employees]);

  // Filter approvers for dropdown based on search
  useEffect(() => {
    if (approverSearch.trim() === "") {
      setFilteredApprovers(approvers);
    } else {
      const filtered = approvers.filter(
        (app) =>
          app.name.toLowerCase().includes(approverSearch.toLowerCase()) ||
          app.employee_code
            .toLowerCase()
            .includes(approverSearch.toLowerCase()),
      );
      setFilteredApprovers(filtered);
    }
  }, [approverSearch, approvers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
    toast.success("Refreshed");
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      employee_id: "",
      approver_id: "",
      approval_type: "LEAVE",
    });
    setEmployeeSearch("");
    setApproverSearch("");
    setIsModalOpen(true);
  };

  const handleEdit = (item: ApproverMapping) => {
    setEditingItem(item);
    setFormData({
      employee_id: item.employee_id.toString(),
      approver_id: item.approver_id.toString(),
      approval_type: item.approval_type,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      confirm("Are you sure you want to remove this leave approver mapping?")
    ) {
      try {
        await deleteLeaveApprover(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Leave approver mapping removed successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove leave approver mapping");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.approver_id) {
      toast.error("Please select both employee and approver");
      return;
    }

    try {
      setSubmitting(true);

      if (editingItem) {
        await updateLeaveApprover(editingItem.id, {
          employee_id: parseInt(formData.employee_id),
          approver_id: parseInt(formData.approver_id),
          approval_type: "LEAVE",
        });
        toast.success("Leave approver mapping updated successfully");

        const res = await getLeaveApprovers(
          currentPage,
          rowsPerPage,
          search,
          "LEAVE",
        );
        setData(res.data);
      } else {
        await createLeaveApprover({
          employee_id: parseInt(formData.employee_id),
          approver_id: parseInt(formData.approver_id),
          approval_type: "LEAVE",
        });
        toast.success("Leave approver mapping created successfully");

        const res = await getLeaveApprovers(1, rowsPerPage, search, "LEAVE");
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
        setCurrentPage(1);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary dark:text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leave Approval Settings</h1>
            <p className="text-sm text-muted-foreground">
              Assign employees who can approve leave requests for other
              employees
            </p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Leave Approver
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee or approver..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>

            {searchInput && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading leave approver mappings...
          </span>
        </div>
      )}

      {/* Approvers Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Approver Code</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-gray-400/50 dark:border-gray-400/50"
                    >
                      <TableCell className="font-medium">
                        {item.employee_name}
                      </TableCell>
                      <TableCell>{item.employee_code}</TableCell>
                      <TableCell>{item.approver_name}</TableCell>
                      <TableCell>{item.approver_code}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-red-100 transition"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No leave approver mappings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
                {totalRecords} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Leave Approver" : "Assign Leave Approver"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update who can approve leave for this employee"
                : "Assign an employee who can approve leave requests for another employee"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee Dropdown with Search */}
            <div className="space-y-2">
              <Label htmlFor="employee_id" className="text-sm font-medium">
                Employee (Person requesting leave){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Search employee by name or code..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-9 mb-2"
                />
              </div>
              <Select
                value={formData.employee_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} ({emp.employee_code}) - {emp.department}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      No employees found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Approver Dropdown with Search */}
            <div className="space-y-2">
              <Label htmlFor="approver_id" className="text-sm font-medium">
                Approver (Who can approve){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Search approver by name or code..."
                  value={approverSearch}
                  onChange={(e) => setApproverSearch(e.target.value)}
                  className="pl-9 mb-2"
                />
              </div>
              <Select
                value={formData.approver_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, approver_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {filteredApprovers.length > 0 ? (
                    filteredApprovers.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name} ({app.employee_code}) - {app.department}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      No approvers found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveApprovers;
