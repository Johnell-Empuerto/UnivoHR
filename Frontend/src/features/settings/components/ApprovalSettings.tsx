import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/utils/formatDate";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Users,
  User,
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
import EmployeePickerDialog from "@/components/shared/EmployeePickerDialog";
import type { EmployeeSearchResult } from "@/services/overtimeService";
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
  approver_employee_id?: number;
  approver_name: string;
  approver_code: string;
  approval_type: "OVERTIME" | "LEAVE" | "MAN_HOUR";
  created_at: string;
};

const ApprovalSettings = () => {
  const [data, setData] = useState<ApproverMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApproverMapping | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<EmployeeSearchResult | null>(null);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [approverPickerOpen, setApproverPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: "",
    approver_id: "",
    approval_type: "OVERTIME",
  });

  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoading(true);
        const res = await getApprovers(currentPage, rowsPerPage, search, typeFilter);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

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
    setSelectedEmployee(null);
    setSelectedApprover(null);
    setFormData({
      employee_id: "",
      approver_id: "",
      approval_type: "OVERTIME",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: ApproverMapping) => {
    setEditingItem(item);
    const empNameParts = item.employee_name.split(" ");
    const appNameParts = item.approver_name.split(" ");
    setSelectedEmployee({
      id: item.employee_id,
      employee_code: item.employee_code,
      first_name: empNameParts[0],
      last_name: empNameParts.slice(1).join(" "),
      department: null,
      position: null,
      employment_status: null,
      status: "ACTIVE",
      branch_id: null,
      branch_name: null,
    });
    setSelectedApprover({
      id: item.approver_employee_id || item.approver_id,
      employee_code: item.approver_code,
      first_name: appNameParts[0],
      last_name: appNameParts.slice(1).join(" "),
      department: null,
      position: null,
      employment_status: null,
      status: "ACTIVE",
      branch_id: null,
      branch_name: null,
    });
    setFormData({
      employee_id: item.employee_id.toString(),
      approver_id: (item.approver_employee_id || item.approver_id).toString(),
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

  const handleSelectEmployee = (emp: EmployeeSearchResult) => {
    setSelectedEmployee(emp);
    setFormData((prev) => ({ ...prev, employee_id: emp.id.toString() }));
  };

  const handleSelectApprover = (emp: EmployeeSearchResult) => {
    setSelectedApprover(emp);
    setFormData((prev) => ({ ...prev, approver_id: emp.id.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.approver_id) {
      toast.error("Please select both employee and approver");
      return;
    }

    if (formData.employee_id === formData.approver_id) {
      toast.error("Employee and approver cannot be the same person");
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

        const res = await getApprovers(currentPage, rowsPerPage, search, typeFilter);
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
        <Button onClick={handleAddNew} className="flex items-center gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Add Approver
        </Button>
      </CardHeader>
      <CardContent>
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

          <Select value={typeFilter || "all"} onValueChange={handleTypeFilterChange}>
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

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Loading approver mappings...</span>
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
                      <TableRow key={item.id} className="border-b border-gray-400/50 dark:border-gray-400/50">
                        <TableCell className="font-medium">{item.employee_name}</TableCell>
                        <TableCell>{item.employee_code}</TableCell>
                        <TableCell>{item.approver_name}</TableCell>
                        <TableCell>{item.approver_code}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getApprovalTypeBadge(item.approval_type)}`}>
                            {item.approval_type === "MAN_HOUR" ? "MAN HOUR" : item.approval_type}
                          </span>
                        </TableCell>
                        <TableCell>{formatDateShort(item.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button className="p-1 rounded hover:bg-muted transition" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                            <button className="p-1 rounded hover:bg-red-100 transition" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No approver mappings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={rowsPerPage}
              showPageSize={false}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={() => {}}
            />
          </>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg! w-full sm:max-w-lg!">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Approver Mapping" : "Add Approver Mapping"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the approver assignment for this employee"
                : "Assign an approver to an employee for overtime, leave, or man hour requests"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Employee <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setEmployeePickerOpen(true)}
              >
                <User className="h-4 w-4 mr-2 shrink-0" />
                {selectedEmployee
                  ? `${selectedEmployee.employee_code} - ${selectedEmployee.first_name} ${selectedEmployee.last_name}${selectedEmployee.department ? ` - ${selectedEmployee.department}` : ""}`
                  : "Select employee"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Approver <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setApproverPickerOpen(true)}
              >
                <User className="h-4 w-4 mr-2 shrink-0" />
                {selectedApprover
                  ? `${selectedApprover.employee_code} - ${selectedApprover.first_name} ${selectedApprover.last_name}${selectedApprover.department ? ` - ${selectedApprover.department}` : ""}`
                  : "Select approver"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval_type" className="text-sm font-medium">
                Approval Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.approval_type}
                onValueChange={(value) => setFormData({ ...formData, approval_type: value as any })}
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

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <EmployeePickerDialog
        open={employeePickerOpen}
        onOpenChange={setEmployeePickerOpen}
        title="Select Employee"
        onSelect={handleSelectEmployee}
        activeOnly={true}
        requireUserAccount={false}
      />

      <EmployeePickerDialog
        open={approverPickerOpen}
        onOpenChange={setApproverPickerOpen}
        title="Select Approver"
        onSelect={handleSelectApprover}
        excludeEmployeeId={selectedEmployee ? selectedEmployee.id : undefined}
        activeOnly={true}
        requireUserAccount={true}
      />
    </Card>
  );
};

export default ApprovalSettings;
