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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getRotationGroups,
  createRotationGroup,
  updateRotationGroup,
  deleteRotationGroup,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  searchEmployees,
  getEmployeeFilterOptions,
  getBranches,
} from "@/services/rotationService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { formatDate } from "@/utils/formatDate";
import type {
  RotationGroup,
  GroupMember,
  SimpleEmployee,
  FilterOptions,
  Branch,
} from "@/services/rotationService";

const defaultForm = {
  name: "",
  code: "",
  description: "",
  is_active: true,
};

const RotationGroups = () => {
  const [groups, setGroups] = useState<RotationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RotationGroup | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RotationGroup | null>(
    null,
  );
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SimpleEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [assignDate, setAssignDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [assignSaving, setAssignSaving] = useState(false);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(0);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const EMPLOYEES_PER_PAGE = 20;

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<RotationGroup | null>(null);
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRotationGroups();
      setGroups(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (g: RotationGroup) => {
    setEditing(g);
    setForm({
      name: g.name,
      code: g.code || "",
      description: g.description || "",
      is_active: g.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      if (editing) {
        await updateRotationGroup(editing.id, payload);
        toast.success("Group updated");
      } else {
        await createRotationGroup(payload);
        toast.success("Group created");
      }
      setDialogOpen(false);
      fetchGroups();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRotationGroup(deleteTarget.id);
      toast.success("Group deleted");
      setDeleteTarget(null);
      fetchGroups();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  };

  const openMembers = async (g: RotationGroup) => {
    setSelectedGroup(g);
    setMembersOpen(true);
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(g.id);
      setMembers(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setMembersLoading(false);
    }
  };

  const loadEmployeePage = useCallback(async (term: string, page: number, dept?: string, pos?: string, branch?: string) => {
    setEmployeeLoading(true);
    try {
      const result = await searchEmployees(term, page, EMPLOYEES_PER_PAGE, {
        department: dept || undefined,
        position: pos || undefined,
        branch_id: branch || undefined,
      });
      setSearchResults(result.data);
      setEmployeePage(result.pagination.page);
      setEmployeeTotalPages(result.pagination.totalPages);
      setEmployeeTotal(result.pagination.total);
    } catch {
      setSearchResults([]);
      setEmployeeTotalPages(0);
      setEmployeeTotal(0);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const reloadEmployeePage = async (term: string, page: number) => {
    await loadEmployeePage(term, page, filterDepartment, filterPosition, filterBranch);
  };

  const handleSearchEmployees = async (term: string) => {
    setEmployeeSearch(term);
    setEmployeePage(1);
    await reloadEmployeePage(term, 1);
  };

  const handleFilterChange = async (field: "department" | "position" | "branch", value: string) => {
    const v = value === "__all__" ? "" : value;
    const newDept = field === "department" ? v : filterDepartment;
    const newPos = field === "position" ? v : filterPosition;
    const newBranch = field === "branch" ? v : filterBranch;
    if (field === "department") setFilterDepartment(v);
    if (field === "position") setFilterPosition(v);
    if (field === "branch") setFilterBranch(v);
    setEmployeePage(1);
    await loadEmployeePage(employeeSearch, 1, newDept, newPos, newBranch);
  };

  const goToEmployeePage = async (page: number) => {
    if (page < 1 || page > employeeTotalPages) return;
    await reloadEmployeePage(employeeSearch, page);
  };

  const getEmployeePageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const tp = employeeTotalPages || 1;
    if (tp <= maxPagesToShow) {
      for (let i = 1; i <= tp; i++) pageNumbers.push(i);
    } else {
      if (employeePage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(tp);
      } else if (employeePage >= tp - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = tp - 3; i <= tp; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = employeePage - 1; i <= employeePage + 1; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(tp);
      }
    }
    return pageNumbers;
  };

  const openAssignDialog = () => {
    setAssignOpen(true);
    setEmployeeSearch("");
    setSelectedEmployees([]);
    setSearchResults([]);
    setEmployeePage(1);
    setEmployeeTotalPages(0);
    setEmployeeTotal(0);
    setFilterDepartment("");
    setFilterPosition("");
    setFilterBranch("");
    loadEmployeePage("", 1);
    getEmployeeFilterOptions().then(setFilterOptions).catch(() => {});
    getBranches().then(setBranches).catch(() => {});
  };

  const toggleEmployeeSelection = (empId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
  };

  const handleAssignMembers = async () => {
    if (selectedEmployees.length === 0 || !selectedGroup) {
      toast.error("Select at least one employee");
      return;
    }
    try {
      setAssignSaving(true);
      await addGroupMembers(selectedGroup.id, selectedEmployees, assignDate);
      toast.success(`${selectedEmployees.length} employee(s) assigned`);
      setAssignOpen(false);
      setSelectedEmployees([]);
      setEmployeeSearch("");
      setSearchResults([]);
      const data = await getGroupMembers(selectedGroup.id);
      setMembers(data);
      fetchGroups();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setAssignSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedGroup || !removeTarget) return;
    try {
      await removeGroupMember(selectedGroup.id, removeTarget.id);
      toast.success("Employee removed from group");
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
      fetchGroups();
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rotation Groups
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Group
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading rotation groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No rotation groups yet.</p>
              <p className="text-sm mt-1">
                Create teams or production lines that rotate together.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {g.code || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.member_count ?? 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.is_active ? "default" : "secondary"}>
                        {g.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openMembers(g)}
                        title="View Members"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(g)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(g)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Rotation Group" : "Create Rotation Group"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Production Team A"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. PROD-A"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Members Dialog - FIXED: Added proper scrolling and height management */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-xl! max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members — {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            <div className="flex justify-end sticky top-0 bg-background z-10 pb-2">
              <Button
                size="sm"
                onClick={openAssignDialog}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Assign Employee
              </Button>
            </div>
            {membersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No employees assigned to this group.</p>
                <p className="text-sm mt-1">
                  Assign employees to include them in this rotation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">
                          {m.employee_code}
                        </TableCell>
                        <TableCell>
                          {m.last_name}, {m.first_name}
                        </TableCell>
                        <TableCell>{m.department}</TableCell>
                        <TableCell>{m.position_name}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(m.effective_date)}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {m.end_date ? formatDate(m.end_date) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRemoveTarget(m)}
                            title="Remove from group"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Dialog with Pagination */}
      <Dialog open={assignOpen} onOpenChange={(open) => { if (!open) { setAssignOpen(false); setSelectedEmployees([]); setEmployeeSearch(""); setSearchResults([]); } }}>
        <DialogContent className="max-w-xl! max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Assign Employees to Group</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            <div className="space-y-2">
              <Label>Search Employees</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Type name or code to filter..."
                  value={employeeSearch}
                  onChange={(e) => handleSearchEmployees(e.target.value)}
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[140px]">
                <Select value={filterDepartment || "__all__"} onValueChange={(v) => handleFilterChange("department", v)}>
                  <SelectTrigger className="h-9 text-xs">
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
              <div className="flex-1 min-w-[140px]">
                <Select value={filterPosition || "__all__"} onValueChange={(v) => handleFilterChange("position", v)}>
                  <SelectTrigger className="h-9 text-xs">
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
              <div className="flex-1 min-w-[140px]">
                <Select value={filterBranch || "__all__"} onValueChange={(v) => handleFilterChange("branch", v)}>
                  <SelectTrigger className="h-9 text-xs">
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

            {employeeLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading employees...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No employees found.
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  Showing page {employeePage} of {employeeTotalPages || 1} ({employeeTotal} total employees)
                </div>
                <div className="border rounded-md">
                  {searchResults.map((emp) => (
                    <div
                      key={emp.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent text-sm border-b last:border-b-0 ${
                        selectedEmployees.includes(emp.id) ? "bg-accent" : ""
                      }`}
                      onClick={() => toggleEmployeeSelection(emp.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => {}}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {emp.employee_code}
                          </span>
                          <span className="font-medium truncate">
                            {emp.last_name}, {emp.first_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {emp.department && <span>{emp.department}</span>}
                          {emp.position && <span>&middot; {emp.position}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToEmployeePage(employeePage - 1)}
                    disabled={employeePage <= 1 || employeeLoading}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getEmployeePageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      variant={employeePage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => typeof page === "number" && goToEmployeePage(page)}
                      disabled={page === "..." || employeeLoading}
                      className={`h-8 w-8 p-0 ${page === "..." ? "cursor-default" : ""}`}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToEmployeePage(employeePage + 1)}
                    disabled={employeePage >= employeeTotalPages || employeeLoading}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {selectedEmployees.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedEmployees.length} employee(s) selected
              </p>
            )}

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setAssignOpen(false);
                setSelectedEmployees([]);
                setEmployeeSearch("");
                setSearchResults([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignMembers}
              disabled={selectedEmployees.length === 0 || assignSaving}
            >
              {assignSaving
                ? "Assigning..."
                : `Assign (${selectedEmployees.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rotation Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This
              action cannot be undone. If the group has active employees or
              pattern assignments, deletion will be blocked — set it to
              inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee from Group</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeTarget?.last_name}, {removeTarget?.first_name} from
              this rotation group? Their rotation assignment will end as of
              today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RotationGroups;
