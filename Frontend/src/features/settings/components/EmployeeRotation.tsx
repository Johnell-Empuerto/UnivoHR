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
import { Input } from "@/components/ui/input";
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
  X,
  History,
} from "lucide-react";
import {
  getRotationGroups,
  getEmployeeRotationAssignments,
  addGroupMembers,
  removeGroupMember,
  searchEmployees,
} from "@/services/rotationService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import type {
  RotationGroup,
  EmployeeRotationAssignment,
  SimpleEmployee,
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

  const [endConfirmTarget, setEndConfirmTarget] = useState(false);

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
  }, [fetchGroups]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
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
    setSearchResults([]);
  };

  const currentAssignment = assignments.find(
    (a) => !a.end_date
  );

  const handleAssign = async () => {
    if (!selectedEmployee || !assignGroupId) return;
    try {
      setAssignSaving(true);
      await addGroupMembers(
        Number(assignGroupId),
        [selectedEmployee.id],
        assignDate
      );
      toast.success("Employee assigned to rotation group");
      setAssignDialogOpen(false);
      const data = await getEmployeeRotationAssignments(selectedEmployee.id);
      setAssignments(data);
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    } finally {
      setAssignSaving(false);
    }
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
            {searchResults.length > 0 && !selectedEmployee && (
              <div className="border rounded-md max-h-48 overflow-y-auto mt-1">
                {searchResults.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                    onClick={() => selectEmployee(emp)}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {emp.employee_code}
                    </span>
                    <span>
                      {emp.last_name}, {emp.first_name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {emp.department}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Employee */}
          {selectedEmployee && (
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
                      onClick={() => {
                        setAssignGroupId("");
                        setAssignDate(
                          new Date().toISOString().split("T")[0]
                        );
                        setAssignDialogOpen(true);
                      }}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.group_name}
                          </TableCell>
                          <TableCell className="text-xs">
                            {a.effective_date}
                          </TableCell>
                          <TableCell className="text-xs">
                            {a.end_date || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={!a.end_date ? "default" : "secondary"}
                            >
                              {!a.end_date ? "Active" : "Ended"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}

          {!selectedEmployee && (
            <div className="text-center py-8 text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Search and select an employee to manage their rotation.</p>
              <p className="text-sm mt-1">
                Assign employees to a rotation group and view assignment history.
              </p>
            </div>
          )}
        </CardContent>

        {/* Assign Dialog */}
        <Dialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Assign {selectedEmployee?.last_name},{" "}
                {selectedEmployee?.first_name} to Rotation Group
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
                  onChange={(e) => setAssignDate(e.target.value)}
                />
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
                {assignSaving ? "Assigning..." : "Assign"}
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
