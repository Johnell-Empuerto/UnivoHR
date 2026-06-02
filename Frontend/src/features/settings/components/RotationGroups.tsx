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
} from "@/services/rotationService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { formatDate } from "@/utils/formatDate";
import type {
  RotationGroup,
  GroupMember,
  SimpleEmployee,
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

  const handleSearchEmployees = async (term: string) => {
    setEmployeeSearch(term);
    if (term.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchEmployees(term);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    }
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
                onClick={() => {
                  setAssignOpen(true);
                  setEmployeeSearch("");
                  setSearchResults([]);
                  setSelectedEmployees([]);
                }}
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

      {/* Assign Employee Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Employees to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Employees</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Type name or code..."
                  value={employeeSearch}
                  onChange={(e) => handleSearchEmployees(e.target.value)}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto mt-1">
                  {searchResults.map((emp) => (
                    <div
                      key={emp.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                        selectedEmployees.includes(emp.id) ? "bg-accent" : ""
                      }`}
                      onClick={() => toggleEmployeeSelection(emp.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {emp.employee_code}
                      </span>
                      <span>
                        {emp.last_name}, {emp.first_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selectedEmployees.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedEmployees.length} employee(s) selected
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
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
              action cannot be undone. Employees in this group will no longer
              have rotation-based shift assignments.
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
