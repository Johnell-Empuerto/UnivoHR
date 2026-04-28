// features/leaves/components/EmployeeCreditsTable.tsx
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { leaveService } from "@/services/leaveService";
import {
  Loader2,
  Search,
  Edit,
  Save,
  X,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface LeaveCredits {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  suffix: string;
  employee_code: string;
  department: string;
  position: string;
  sick_leave: number;
  vacation_leave: number;
  maternity_leave: number;
  emergency_leave: number;
  used_sick_leave: number;
  used_vacation_leave: number;
  used_maternity_leave: number;
  used_emergency_leave: number;
  sick_leave_remaining: number;
  vacation_leave_remaining: number;
  maternity_leave_remaining: number;
  emergency_leave_remaining: number;
}

interface EditData {
  sick_leave: number;
  vacation_leave: number;
  maternity_leave: number;
  emergency_leave: number;
}

const EmployeeCreditsTable = () => {
  const [credits, setCredits] = useState<LeaveCredits[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [departmentFilter, setDepartmentFilter] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LeaveCredits | null>(
    null
  );
  const [editData, setEditData] = useState<EditData>({
    sick_leave: 0,
    vacation_leave: 0,
    maternity_leave: 0,
    emergency_leave: 0,
  });
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch credits
  useEffect(() => {
    fetchCredits();
  }, [currentPage, rowsPerPage, search, departmentFilter]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAllEmployeeCredits(
        currentPage,
        rowsPerPage,
        search,
        departmentFilter
      );
      setCredits(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      console.error("Error fetching credits:", err);
      toast.error(err.message || "Failed to load employee credits");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: LeaveCredits) => {
    setEditingEmployee(employee);
    setEditData({
      sick_leave: employee.sick_leave,
      vacation_leave: employee.vacation_leave,
      maternity_leave: employee.maternity_leave,
      emergency_leave: employee.emergency_leave,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingEmployee) return;

    try {
      setSaving(true);
      await leaveService.updateEmployeeCredits(
        editingEmployee.employee_id,
        editData
      );
      toast.success("Credits updated successfully");
      setEditDialogOpen(false);
      fetchCredits();
    } catch (err: any) {
      toast.error(err.message || "Failed to update credits");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setSearchInput("");
    setSearch("");
    setDepartmentFilter("");
    setCurrentPage(1);
  };

  const getDepartmentOptions = () => {
    const departments = new Set(credits.map((c) => c.department));
    return Array.from(departments);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRemainingClass = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 25) return "text-red-600 dark:text-red-400 font-semibold";
    if (percentage <= 50)
      return "text-yellow-600 dark:text-yellow-400 font-medium";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <>
      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={departmentFilter || "all"}
              onValueChange={(value) =>
                setDepartmentFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartmentOptions().map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchInput || departmentFilter) && (
              <Button variant="ghost" onClick={handleRefresh}>
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Employee Leave Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : credits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employee credits found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">
                      Sick Leave
                      <br />
                      <span className="text-xs text-muted-foreground">
                        (Used / Total / Remaining)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Vacation Leave
                      <br />
                      <span className="text-xs text-muted-foreground">
                        (Used / Total / Remaining)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Maternity Leave
                      <br />
                      <span className="text-xs text-muted-foreground">
                        (Used / Total / Remaining)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Emergency Leave
                      <br />
                      <span className="text-xs text-muted-foreground">
                        (Used / Total / Remaining)
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {employee.first_name} {employee.last_name}
                            {employee.suffix && `, ${employee.suffix}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.employee_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {employee.used_sick_leave} /{" "}
                          <span className="font-medium">
                            {employee.sick_leave}
                          </span>{" "}
                          /{" "}
                          <span
                            className={getRemainingClass(
                              employee.sick_leave_remaining,
                              employee.sick_leave
                            )}
                          >
                            {employee.sick_leave_remaining}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {employee.used_vacation_leave} /{" "}
                          <span className="font-medium">
                            {employee.vacation_leave}
                          </span>{" "}
                          /{" "}
                          <span
                            className={getRemainingClass(
                              employee.vacation_leave_remaining,
                              employee.vacation_leave
                            )}
                          >
                            {employee.vacation_leave_remaining}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {employee.used_maternity_leave} /{" "}
                          <span className="font-medium">
                            {employee.maternity_leave}
                          </span>{" "}
                          /{" "}
                          <span
                            className={getRemainingClass(
                              employee.maternity_leave_remaining,
                              employee.maternity_leave
                            )}
                          >
                            {employee.maternity_leave_remaining}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {employee.used_emergency_leave} /{" "}
                          <span className="font-medium">
                            {employee.emergency_leave}
                          </span>{" "}
                          /{" "}
                          <span
                            className={getRemainingClass(
                              employee.emergency_leave_remaining,
                              employee.emergency_leave
                            )}
                          >
                            {employee.emergency_leave_remaining}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
                {totalRecords} entries
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Credits</DialogTitle>
            <DialogDescription>
              Update leave credits for{" "}
              {editingEmployee &&
                `${editingEmployee.first_name} ${editingEmployee.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sick Leave Credits</label>
              <Input
                type="number"
                min="0"
                value={editData.sick_leave}
                onChange={(e) =>
                  setEditData({ ...editData, sick_leave: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Vacation Leave Credits
              </label>
              <Input
                type="number"
                min="0"
                value={editData.vacation_leave}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    vacation_leave: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Maternity Leave Credits
              </label>
              <Input
                type="number"
                min="0"
                value={editData.maternity_leave}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    maternity_leave: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Emergency Leave Credits
              </label>
              <Input
                type="number"
                min="0"
                value={editData.emergency_leave}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    emergency_leave: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmployeeCreditsTable;
