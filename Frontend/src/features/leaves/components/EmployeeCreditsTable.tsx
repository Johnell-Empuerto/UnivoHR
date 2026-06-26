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
import { Button } from "@/components/ui/button";
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
import { useEnabledLeaveTypes } from "@/hooks/useLeaveTypes";
import {
  Loader2,
  Search,
  Edit,
  Save,
  X,
  RefreshCw,
  CalendarDays,

} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";


interface BalanceItem {
  code: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

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
  balances?: BalanceItem[];
  sick_leave?: number;
  vacation_leave?: number;
  maternity_leave?: number;
  emergency_leave?: number;
  used_sick_leave?: number;
  used_vacation_leave?: number;
  used_maternity_leave?: number;
  used_emergency_leave?: number;
  sick_leave_remaining?: number;
  vacation_leave_remaining?: number;
  maternity_leave_remaining?: number;
  emergency_leave_remaining?: number;
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

  // Leave types for dynamic columns
  const { data: leaveTypesRaw = [] } = useEnabledLeaveTypes();
  const leaveTypes = leaveTypesRaw.filter((t: any) => t.include_in_credits !== false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LeaveCredits | null>(null);
  const [editData, setEditData] = useState<Record<string, number>>({});
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
        departmentFilter,
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
    const data: Record<string, number> = {};
    const balances = employee.balances || [];
    if (balances.length > 0) {
      for (const b of balances) {
        data[b.code] = b.total_days || 0;
      }
    } else {
      const codeMap: Record<string, string> = { sick_leave: 'SL', vacation_leave: 'VL', maternity_leave: 'ML', emergency_leave: 'EL' };
      for (const [field, code] of Object.entries(codeMap)) {
        data[code] = (employee as any)[field] || 0;
      }
    }
    setEditData(data);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingEmployee) return;

    try {
      setSaving(true);
      const balances = Object.entries(editData).map(([code, total_days]) => ({
        code,
        total_days,
      }));
      await leaveService.updateEmployeeCredits(editingEmployee.employee_id, { balances });
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
      <Card>
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
            <CalendarDays className="h-5 w-5" />
            Employee Leave Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : credits.length === 0 ? (
            <EmptyState message="No employee credits found" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    {leaveTypes.filter((lt: { code: string }) => lt.code !== 'NP').map((lt: any) => (
                      <TableHead key={lt.id} className="text-center">
                        {lt.name}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          (Used / Total / Remaining)
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((employee) => {
                    const getVal = (code: string, field: 'total_days' | 'used_days' | 'remaining_days'): number => {
                      const balances = employee.balances || [];
                      const bal = balances.find((b: any) => b.code === code);
                      if (bal) return bal[field] ?? 0;
                      const flatMap: Record<string, Record<string, string>> = {
                        SL: { total_days: 'sick_leave', used_days: 'used_sick_leave', remaining_days: 'sick_leave_remaining' },
                        VL: { total_days: 'vacation_leave', used_days: 'used_vacation_leave', remaining_days: 'vacation_leave_remaining' },
                        ML: { total_days: 'maternity_leave', used_days: 'used_maternity_leave', remaining_days: 'maternity_leave_remaining' },
                        EL: { total_days: 'emergency_leave', used_days: 'used_emergency_leave', remaining_days: 'emergency_leave_remaining' },
                      };
                      const flatField = flatMap[code]?.[field];
                      return flatField ? (employee as any)[flatField] ?? 0 : 0;
                    };
                    return (
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
                        {leaveTypes.filter((lt: any) => lt.code !== 'NP').map((lt: any) => {
                          const total = getVal(lt.code, 'total_days');
                          const used = getVal(lt.code, 'used_days');
                          const rem = getVal(lt.code, 'remaining_days');
                          return (
                            <TableCell key={lt.code} className="text-center">
                              <div className="text-sm">
                                {used} / <span className="font-medium">{total}</span> /{" "}
                                <span className={getRemainingClass(rem, total)}>{rem}</span>
                              </div>
                            </TableCell>
                          );
                        })}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={rowsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setRowsPerPage(size); setCurrentPage(1); }}
          />
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
            {leaveTypes.filter((lt: any) => lt.code !== 'NP').map((lt: any) => (
              <div key={lt.code} className="space-y-2">
                <label className="text-sm font-medium">{lt.name} Credits ({lt.code})</label>
                <Input
                  type="number"
                  min="0"
                  value={editData[lt.code] ?? 0}
                  onChange={(e) =>
                    setEditData({ ...editData, [lt.code]: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
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
