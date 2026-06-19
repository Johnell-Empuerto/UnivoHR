"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  UserCog,
  Search,
  UserPlus,
  Pencil,
  X,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getRotationGroups,
  getEmployeeRotationAssignments,
  addGroupMembers,
  updateEmployeeRotationAssignment,
  removeGroupMember,
  searchEmployees,
  getEmployeeFilterOptions,
  getBranches,
} from "@/services/rotationService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { formatDateShort } from "@/utils/formatDate";
import type {
  RotationGroup,
  EmployeeRotationAssignment,
  SimpleEmployee,
  FilterOptions,
  Branch,
} from "@/services/rotationService";

const EmployeeRotation = () => {
  const [groups, setGroups] = useState<RotationGroup[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SimpleEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<SimpleEmployee | null>(null);
  const [assignments, setAssignments] = useState<EmployeeRotationAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignDate, setAssignDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [assignSaving, setAssignSaving] = useState(false);
  const [dateError, setDateError] = useState("");

  const [editTarget, setEditTarget] = useState<EmployeeRotationAssignment | null>(null);

  const [endConfirmTarget, setEndConfirmTarget] = useState(false);

  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const EMPLOYEES_PER_PAGE = 20;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getRotationGroups();
      setGroups(data);
    } catch {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    getEmployeeFilterOptions().then(setFilterOptions).catch(() => {});
    getBranches().then(setBranches).catch(() => {});
  }, [fetchGroups]);

  useEffect(() => {
    loadSearchPage("", 1);
  }, []);

  const loadSearchPage = async (term: string, page: number, dept?: string, pos?: string, branch?: string) => {
    setSearchLoading(true);
    try {
      const result = await searchEmployees(term, page, EMPLOYEES_PER_PAGE, {
        department: dept || undefined,
        position: pos || undefined,
        branch_id: branch || undefined,
      });
      setSearchResults(result.data);
      setSearchPage(result.pagination.page);
      setSearchTotalPages(result.pagination.totalPages);
    } catch {
      setSearchResults([]);
      setSearchTotalPages(0);
    } finally {
      setSearchLoading(false);
    }
  };

  const reloadSearchPage = async (term: string, page: number) => {
    await loadSearchPage(term, page, filterDepartment, filterPosition, filterBranch);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setSearchPage(1);
    await reloadSearchPage(term, 1);
  };

  const handleFilterChange = async (field: "department" | "position" | "branch", value: string) => {
    const v = value === "__all__" ? "" : value;
    const newDept = field === "department" ? v : filterDepartment;
    const newPos = field === "position" ? v : filterPosition;
    const newBranch = field === "branch" ? v : filterBranch;
    if (field === "department") setFilterDepartment(v);
    if (field === "position") setFilterPosition(v);
    if (field === "branch") setFilterBranch(v);
    setSearchPage(1);
    await loadSearchPage(searchTerm, 1, newDept, newPos, newBranch);
  };

  const goToSearchPage = async (page: number) => {
    if (page < 1 || page > searchTotalPages) return;
    await reloadSearchPage(searchTerm, page);
  };

  const getSearchPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const tp = searchTotalPages || 1;
    if (tp <= maxPagesToShow) {
      for (let i = 1; i <= tp; i++) pageNumbers.push(i);
    } else {
      if (searchPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(tp);
      } else if (searchPage >= tp - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = tp - 3; i <= tp; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = searchPage - 1; i <= searchPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(tp);
      }
    }
    return pageNumbers;
  };

  const selectEmployee = async (emp: SimpleEmployee) => {
    setSelectedEmployee(emp);
    setSearchTerm("");
    setSearchResults([]);
    setAssignmentsLoading(true);
    try {
      const data = await getEmployeeRotationAssignments(emp.id);
      setAssignments(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const clearEmployee = () => {
    setSelectedEmployee(null);
    setAssignments([]);
    setSearchTerm("");
    reloadSearchPage("", 1);
  };

  const currentAssignment = assignments.find(
    (a) => !a.end_date
  );

  const validateDate = (): boolean => {
    if (!assignDate) {
      setDateError("Start date is required");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !assignGroupId) return;
    if (!validateDate()) return;
    try {
      setAssignSaving(true);
      if (editTarget) {
        await updateEmployeeRotationAssignment(selectedEmployee.id, editTarget.id, {
          rotation_group_id: Number(assignGroupId),
          effective_date: assignDate,
        });
        toast.success("Assignment updated");
      } else {
        await addGroupMembers(
          Number(assignGroupId),
          [selectedEmployee.id],
          assignDate
        );
        toast.success("Employee assigned to rotation group");
      }
      setAssignDialogOpen(false);
      setEditTarget(null);
      const data = await getEmployeeRotationAssignments(selectedEmployee.id);
      setAssignments(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setAssignSaving(false);
    }
  };

  const openAssignDialog = () => {
    setEditTarget(null);
    setAssignGroupId("");
    setAssignDate(new Date().toISOString().split("T")[0]);
    setDateError("");
    setAssignDialogOpen(true);
  };

  const openEditDialog = (a: EmployeeRotationAssignment) => {
    setEditTarget(a);
    setAssignGroupId(a.rotation_group_id.toString());
    setAssignDate(a.effective_date);
    setDateError("");
    setAssignDialogOpen(true);
  };

  const handleEndAssignment = async () => {
    if (!selectedEmployee || !currentAssignment) return;
    try {
      await removeGroupMember(
        currentAssignment.rotation_group_id,
        selectedEmployee.id,
        new Date().toISOString().split("T")[0]
      );
      toast.success("Rotation assignment ended");
      setEndConfirmTarget(false);
      const data = await getEmployeeRotationAssignments(selectedEmployee.id);
      setAssignments(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Employee Rotation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Search */}
          <div className="space-y-2">
            <Label>Search Employee</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Type employee name or code..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={!!selectedEmployee}
              />
              {selectedEmployee && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={clearEmployee}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            {!selectedEmployee && (
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[130px]">
                  <Select value={filterDepartment || "__all__"} onValueChange={(v) => handleFilterChange("department", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Departments</SelectItem>
                      {filterOptions?.departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <Select value={filterPosition || "__all__"} onValueChange={(v) => handleFilterChange("position", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Positions</SelectItem>
                      {filterOptions?.positions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <Select value={filterBranch || "__all__"} onValueChange={(v) => handleFilterChange("branch", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

          </div>

          {!selectedEmployee ? (
            <>
              {searchLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading employees...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No employees found.</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((emp) => (
                        <TableRow
                          key={emp.id}
                          className="cursor-pointer"
                          onClick={() => selectEmployee(emp)}
                        >
                          <TableCell className="font-mono text-xs">
                            {emp.employee_code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {emp.last_name}, {emp.first_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {emp.department}
                          </TableCell>
                          <TableCell className="text-sm">
                            {emp.position || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={emp.status === "ACTIVE" ? "default" : "secondary"}>
                              {emp.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Page {searchPage} of {searchTotalPages || 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToSearchPage(searchPage - 1)}
                        disabled={searchPage <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      {getSearchPageNumbers().map((page, index) => (
                        <Button
                          key={index}
                          variant={searchPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => typeof page === "number" && goToSearchPage(page)}
                          disabled={page === "..."}
                          className={`h-7 w-7 p-0 text-xs ${page === "..." ? "cursor-default" : ""}`}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToSearchPage(searchPage + 1)}
                        disabled={searchPage >= searchTotalPages}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <div>
                  <p className="font-medium">
                    {selectedEmployee.last_name}, {selectedEmployee.first_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedEmployee.employee_code} &middot;{" "}
                    {selectedEmployee.department}
                  </p>
                </div>
                <div className="flex gap-2">
                  {currentAssignment ? (
                    <>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {currentAssignment.group_name}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEndConfirmTarget(true)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        End Rotation
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={openAssignDialog}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Assign to Group
                    </Button>
                  )}
                </div>
              </div>

              {/* Rotation History */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4" />
                  Assignment History
                </div>
                {assignmentsLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading history...
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                    No rotation history for this employee.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.group_name}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDateShort(a.effective_date)}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {a.end_date ? formatDateShort(a.end_date) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={!a.end_date ? "default" : "secondary"}
                            >
                              {!a.end_date ? "Active" : "Ended"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {!a.end_date && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(a)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </CardContent>

        {/* Assign Dialog */}
        <Dialog
          open={assignDialogOpen}
          onOpenChange={(o) => {
            if (!o) setEditTarget(null);
            setAssignDialogOpen(o);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
              {editTarget
                ? "Edit Rotation Assignment"
                : `Assign ${selectedEmployee?.last_name}, ${selectedEmployee?.first_name} to Rotation Group`}
            </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rotation Group</Label>
                <Select
                  value={assignGroupId}
                  onValueChange={setAssignGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter((g) => g.is_active)
                      .map((g) => (
                        <SelectItem
                          key={g.id}
                          value={g.id.toString()}
                        >
                          {g.name}
                          {g.member_count !== undefined && ` (${g.member_count} members)`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={assignDate}
                  onChange={(e) => {
                    setAssignDate(e.target.value);
                    setDateError("");
                  }}
                />
                {dateError && (
                  <p className="text-sm text-destructive">{dateError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!assignGroupId || assignSaving}
              >
                {assignSaving
                  ? "Saving..."
                  : editTarget
                    ? "Save Changes"
                    : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* End Assignment Confirmation */}
      <AlertDialog open={endConfirmTarget} onOpenChange={setEndConfirmTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Rotation Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              End {selectedEmployee?.last_name}, {selectedEmployee?.first_name}'s rotation in "{currentAssignment?.group_name}"? The assignment will end as of today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndAssignment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Rotation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmployeeRotation;
