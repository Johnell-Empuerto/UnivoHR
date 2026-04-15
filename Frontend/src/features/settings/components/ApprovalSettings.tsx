// components/settings/ApprovalSettings.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
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
  getApprovers,
  createApprover,
  updateApprover,
  deleteApprover,
} from "@/services/approverService";

type ApproverMapping = {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  approver_id: number;
  approver_name: string;
  approver_code: string;
  approval_type: "OVERTIME" | "LEAVE" | "MAN_HOUR";
  created_at: string;
};

type Employee = {
  id: number;
  name: string;
  employee_code: string;
  department: string;
};

const ApprovalSettings = () => {
  const [data, setData] = useState<ApproverMapping[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [approvers, setApprovers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    approver_id: "",
    approval_type: "OVERTIME",
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

  // Fetch approver mappings
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoading(true);
        const res = await getApprovers(
          currentPage,
          rowsPerPage,
          search,
          typeFilter,
        );
        setData(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to fetch approver mappings");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovers();
  }, [currentPage, rowsPerPage, search, typeFilter]);

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

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setSearch("");
    setTypeFilter("");
    setCurrentPage(1);
    toast.success("Refreshed");
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      employee_id: "",
      approver_id: "",
      approval_type: "OVERTIME",
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
    if (confirm("Are you sure you want to remove this approver mapping?")) {
      try {
        await deleteApprover(id);
        setData(data.filter((item) => item.id !== id));
        toast.success("Approver mapping removed successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove approver mapping");
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
        await updateApprover(editingItem.id, {
          employee_id: parseInt(formData.employee_id),
          approver_id: parseInt(formData.approver_id),
          approval_type: formData.approval_type,
        });
        toast.success("Approver mapping updated successfully");

        const res = await getApprovers(
          currentPage,
          rowsPerPage,
          search,
          typeFilter,
        );
        setData(res.data);
      } else {
        await createApprover({
          employee_id: parseInt(formData.employee_id),
          approver_id: parseInt(formData.approver_id),
          approval_type: formData.approval_type,
        });
        toast.success("Approver mapping created successfully");

        const res = await getApprovers(1, rowsPerPage, search, typeFilter);
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

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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

  const getApprovalTypeBadge = (type: string) => {
    switch (type) {
      case "OVERTIME":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "LEAVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "MAN_HOUR":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Employee Approver Mappings
        </CardTitle>
        <Button
          onClick={handleAddNew}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add Approver
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee or approver..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <Select
            value={typeFilter || "all"}
            onValueChange={handleTypeFilterChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="OVERTIME">Overtime</SelectItem>
              <SelectItem value="LEAVE">Leave</SelectItem>
              <SelectItem value="MAN_HOUR">Man Hour</SelectItem>
            </SelectContent>
          </Select>

          {(searchInput || typeFilter) && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}

          <Button onClick={handleRefresh} variant="ghost">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading approver mappings...
            </span>
          </div>
        )}

        {!loading && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Approver Code</TableHead>
                    <TableHead>Approval Type</TableHead>
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
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getApprovalTypeBadge(item.approval_type)}`}
                          >
                            {item.approval_type === "MAN_HOUR"
                              ? "MAN HOUR"
                              : item.approval_type}
                          </span>
                        </TableCell>
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
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No approver mappings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalRecords > 0 && (
              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <span className="text-sm">{rowsPerPage}</span>
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
                      onClick={() => typeof page === "number" && goToPage(page)}
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
          </>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Approver Mapping" : "Add Approver Mapping"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the approver assignment for this employee"
                : "Assign an approver to an employee for overtime, leave, or man hour requests"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Employee Dropdown with Search */}
            <div className="space-y-2">
              <Label htmlFor="employee_id" className="text-sm font-medium">
                Employee <span className="text-red-500">*</span>
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
                Approver <span className="text-red-500">*</span>
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

            {/* Approval Type Dropdown - Now includes MAN_HOUR */}
            <div className="space-y-2">
              <Label htmlFor="approval_type" className="text-sm font-medium">
                Approval Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.approval_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, approval_type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approval type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERTIME">Overtime</SelectItem>
                  <SelectItem value="LEAVE">Leave</SelectItem>
                  <SelectItem value="MAN_HOUR">Man Hour</SelectItem>
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
    </Card>
  );
};

export default ApprovalSettings;
