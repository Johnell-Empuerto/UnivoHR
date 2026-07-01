import { useState, useEffect, useRef, useCallback } from "react";
import { getHrForms } from "@/services/hrFormService";
import { assignHrForm, updateHrAssignment, deleteHrAssignment } from "@/services/hrFormService";
import { useHrFormAssignments } from "@/hooks/useHrFormAssignments";
import { employees as fetchEmployees } from "@/services/employeeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Plus, Search, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import { TablePagination } from "@/components/shared/TablePagination";
import { formatDateShort } from "@/utils/formatDate";
import EmptyState from "@/components/shared/EmptyState";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Pending: getStatusBadgeClass("warning"),
    Submitted: getStatusBadgeClass("info"),
    Reviewed: getStatusBadgeClass("success"),
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const HrFormAssignmentsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [search, setSearch] = useState("");

  const { data: assignmentResponse, isFetching, refetch } = useHrFormAssignments(page, Number(pageSize), search);
  const assignments = assignmentResponse?.data ?? [];
  const total = assignmentResponse?.pagination?.total ?? 0;

  const [assignDialog, setAssignDialog] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignForm, setAssignForm] = useState({ form_id: "", due_date: "" });
  const [assignAllMatching, setAssignAllMatching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editDialog, setEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [empData, setEmpData] = useState<any[]>([]);
  const [empTotal, setEmpTotal] = useState(0);
  const [empPage, setEmpPage] = useState(1);
  const [empSearch, setEmpSearch] = useState("");
  const [empLoading, setEmpLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpenAssign = async () => {
    try {
      const f = await getHrForms(1, 100, "");
      setForms(f.data || []);
    } catch { setForms([]); }
    setAssignForm({ form_id: "", due_date: "" });
    setSelectedIds(new Set());
    setAssignAllMatching(false);
    setEmpData([]);
    setEmpTotal(0);
    setEmpPage(1);
    setEmpSearch("");
    setAssignDialog(true);
  };

  const fetchEmployeesForPicker = useCallback(async (page: number, search: string) => {
    setEmpLoading(true);
    try {
      const r = await fetchEmployees(page, 20, search, "ACTIVE");
      setEmpData(r.data || []);
      setEmpTotal(r.pagination?.total || 0);
    } catch { setEmpData([]); setEmpTotal(0); }
    finally { setEmpLoading(false); }
  }, []);

  useEffect(() => {
    if (!assignDialog) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchEmployeesForPicker(empPage, empSearch);
    }, empSearch ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [assignDialog, empPage, empSearch, fetchEmployeesForPicker]);

  const handleAssign = async () => {
    if (!assignForm.form_id) { toast.error("Select a form"); return; }
    if (!assignAllMatching && selectedIds.size === 0) { toast.error("Select at least one employee"); return; }
    try {
      setSaving(true);
      let result: any;
      if (assignAllMatching) {
        result = await assignHrForm({ form_id: Number(assignForm.form_id), assign_all_matching: true, search: empSearch, due_date: assignForm.due_date || undefined });
        toast.success(`Assigned form to ${result.created_count} matching employees`);
      } else {
        result = await assignHrForm({ form_id: Number(assignForm.form_id), employee_ids: Array.from(selectedIds), due_date: assignForm.due_date || undefined });
        if (result.queued) {
          toast.success(result.message);
        } else {
          toast.success(`Assigned: ${result.created_count}, Skipped: ${result.skipped_employee_ids?.length || 0}`);
        }
      }
      setAssignDialog(false);
      refetch();
    } catch (err: any) { toast.error(err.message || "Assignment failed"); }
    finally { setSaving(false); }
  };

  const handleOpenEdit = (a: any) => {
    setEditTarget(a);
    setEditEmployeeId(String(a.employee_id));
    setEditDueDate(a.due_date || "");
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editEmployeeId) { toast.error("Select an employee"); return; }
    try {
      await updateHrAssignment(editTarget.id, { employee_id: Number(editEmployeeId), due_date: editDueDate || undefined });
      toast.success("Assignment updated");
      setEditDialog(false);
      setEditTarget(null);
      refetch();
    } catch (err: any) { toast.error(err.message || "Update failed"); }
  };

  const handleOpenDelete = (a: any) => {
    setDeleteTarget(a);
    setDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHrAssignment(deleteTarget.id);
      toast.success("Assignment deleted");
      setDeleteDialog(false);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) { toast.error(err.message || "Delete failed"); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Form Assignments</h1><p className="text-sm text-muted-foreground">Assign forms to employees</p></div>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Input placeholder="Search employee..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64" />
          </div>
          <Button onClick={handleOpenAssign} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Assign Form</Button>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <Loader message="Loading assignments..." />
          ) : assignments.length === 0 ? (
            <EmptyState message="No assignments found" description="Assign a form to an employee to get started." action={{ label: "Assign Form", onClick: handleOpenAssign }} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.employee_name}<p className="text-xs text-muted-foreground">{a.employee_code}</p></TableCell>
                      <TableCell className="text-sm">{a.department || "-"}</TableCell>
                      <TableCell>{a.form_title}</TableCell>
                      <TableCell className="text-sm">{a.created_at ? formatDateShort(a.created_at) : "-"}</TableCell>
                      <TableCell className="text-sm">{a.due_date ? formatDateShort(a.due_date) : "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>{a.submitted_at ? formatDateShort(a.submitted_at) : "-"}</TableCell>
                      <TableCell>
                        {a.status === "Pending" ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenEdit(a)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Edit">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleOpenDelete(a)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <TablePagination
            page={page}
            totalPages={Math.ceil(total / Number(pageSize))}
            totalItems={total}
            pageSize={Number(pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(String(size)); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Dialog open={assignDialog} onOpenChange={(open) => {
        if (!open) { setAssignDialog(false); setEmpData([]); setEmpTotal(0); setEmpPage(1); setEmpSearch(""); setSelectedIds(new Set()); setAssignAllMatching(false); }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Form to Employees</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Form <span className="text-red-500">*</span></p>
                <Select value={assignForm.form_id} onValueChange={(v) => setAssignForm({ ...assignForm, form_id: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select form" /></SelectTrigger>
                  <SelectContent>
                    {forms.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <Input type="date" value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} />
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold">Select Employees</p>
                <div className="relative flex-1 max-w-sm ml-auto">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or department..."
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(1); setSelectedIds(new Set()); setAssignAllMatching(false); }}
                    className="pl-7 pr-7"
                  />
                  {empSearch && (
                    <X
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                      onClick={() => { setEmpSearch(""); setEmpPage(1); setSelectedIds(new Set()); setAssignAllMatching(false); }}
                    />
                  )}
                </div>
              </div>
              <div className="rounded-md border max-h-64 overflow-y-auto">
                {empLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : empData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No employees found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted sticky top-0">
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            onChange={() => {
                              if (empData.every((e: any) => selectedIds.has(e.id))) {
                                setSelectedIds((prev) => { const next = new Set(prev); empData.forEach((e: any) => next.delete(e.id)); return next; });
                              } else {
                                setSelectedIds((prev) => { const next = new Set(prev); empData.forEach((e: any) => next.add(e.id)); return next; });
                              }
                              setAssignAllMatching(false);
                            }}
                            checked={empData.length > 0 && empData.every((e: any) => selectedIds.has(e.id))}
                          />
                        </TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empData.map((emp: any) => (
                        <TableRow key={emp.id} className={selectedIds.has(emp.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(emp.id)}
                              onChange={() => {
                                setSelectedIds((prev) => { const next = new Set(prev); if (next.has(emp.id)) next.delete(emp.id); else next.add(emp.id); return next; });
                                setAssignAllMatching(false);
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                          <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                          <TableCell>{emp.department || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {assignAllMatching
                    ? `Assigning to all ${empTotal} matching employees`
                    : `${selectedIds.size} employee(s) selected${empTotal > 0 ? ` of ${empTotal} matching` : ""}`
                  }
                </p>
                <div className="flex items-center gap-2">
                  {!assignAllMatching && empData.length > 0 && (
                    <button className="text-xs text-primary hover:underline" onClick={() => {
                      setSelectedIds(new Set(empData.map((e: any) => e.id)));
                      setAssignAllMatching(false);
                    }}>
                      Select visible ({empData.length})
                    </button>
                  )}
                  {!assignAllMatching && empTotal > 20 && (
                    <button className="text-xs text-primary hover:underline" onClick={() => {
                      setSelectedIds(new Set());
                      setAssignAllMatching(true);
                      toast.info(`Will assign to all ${empTotal} matching employees`);
                    }}>
                      Assign to all matching ({empTotal})
                    </button>
                  )}
                  {assignAllMatching && (
                    <button className="text-xs text-destructive hover:underline" onClick={() => setAssignAllMatching(false)}>
                      Cancel select all
                    </button>
                  )}
                  {selectedIds.size > 0 && !assignAllMatching && (
                    <button className="text-xs text-destructive hover:underline" onClick={() => setSelectedIds(new Set())}>
                      Clear selection
                    </button>
                  )}
                </div>
              </div>
              {empTotal > 0 && !assignAllMatching && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEmpPage(p => Math.max(1, p - 1))}
                      disabled={empPage <= 1} className="h-7 text-xs px-2">
                      <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {empTotal > 0 ? empPage : 0} of {Math.ceil(empTotal / 20) || 1}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEmpPage(p => p + 1)}
                      disabled={empPage >= Math.ceil(empTotal / 20)} className="h-7 text-xs px-2">
                      Next <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">{empData.length} per page</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(false); setEmpData([]); setEmpTotal(0); setEmpPage(1); setEmpSearch(""); setSelectedIds(new Set()); setAssignAllMatching(false); }}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || (!assignAllMatching && selectedIds.size === 0)}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {assignAllMatching ? `Assign to all ${empTotal} matching` : `Assign to ${selectedIds.size} employee(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={(open) => { if (!open) { setEditDialog(false); setEditTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {editTarget && (
              <div className="text-sm text-muted-foreground">
                Re-assigning: <strong>{editTarget.employee_name}</strong> &mdash; {editTarget.form_title}
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">New Employee ID <span className="text-red-500">*</span></p>
              <Input type="number" value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} placeholder="Enter employee ID" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog(false); setEditTarget(null); }}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={(open) => { if (!open) { setDeleteDialog(false); setDeleteTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete Assignment</DialogTitle></DialogHeader>
          {deleteTarget && (
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the assignment for <strong>{deleteTarget.employee_name}</strong> &mdash; {deleteTarget.form_title}?
              <br /><br />This action cannot be undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog(false); setDeleteTarget(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HrFormAssignmentsPage;
