import { useState, useEffect } from "react";
import { getHrForms } from "@/services/hrFormService";
import { assignHrForm, getAllHrAssignments } from "@/services/hrFormService";
import { employees as fetchEmployees } from "@/services/employeeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Submitted: "bg-blue-100 text-blue-800",
    Reviewed: "bg-green-100 text-green-800",
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const HrFormAssignmentsPage = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1); pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1); pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("..."); pages.push(totalPages);
      }
    }
    return pages;
  };

  const [assignDialog, setAssignDialog] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [allEmps, setAllEmps] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignForm, setAssignForm] = useState({ form_id: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAssignments(); }, [page, pageSize, search]);

  const fetchAssignments = async () => {
    try { setLoading(true); const r = await getAllHrAssignments(page, pageSize, search); setAssignments(r.data); setTotal(r.pagination.total); }
    catch { setAssignments([]); }
    finally { setLoading(false); }
  };

  const handleOpenAssign = async () => {
    try {
      const [f, e] = await Promise.all([getHrForms(1, 100, ""), fetchEmployees(1, 10000, "", "ACTIVE")]);
      setForms(f.data || []);
      setAllEmps(e.data || e || []);
    } catch { setForms([]); setAllEmps([]); }
    setAssignForm({ form_id: "", due_date: "" });
    setSelectedIds(new Set());
    setAssignDialog(true);
  };

  const toggleEmp = (id: number) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleAssign = async () => {
    if (!assignForm.form_id) { toast.error("Select a form"); return; }
    if (selectedIds.size === 0) { toast.error("Select at least one employee"); return; }
    try {
      setSaving(true);
      const result = await assignHrForm({ form_id: Number(assignForm.form_id), employee_ids: Array.from(selectedIds), due_date: assignForm.due_date || undefined });
      if (result.queued) {
        toast.success(result.message);
      } else {
        toast.success(`Assigned: ${result.created_count}, Skipped: ${result.skipped_employee_ids?.length || 0}`);
      }
      setAssignDialog(false);
      fetchAssignments();
    } catch (err: any) { toast.error(err.message || "Assignment failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Form Assignments</h1><p className="text-sm text-muted-foreground">Assign forms to employees</p></div>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input placeholder="Search employee..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
          </div>
          <Button onClick={handleOpenAssign} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Assign Form</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading assignments..." />
          ) : assignments.length === 0 ? (
            <EmptyState message="No assignments found" description="Assign a form to an employee to get started." action={{ label: "Assign Form", onClick: handleOpenAssign }} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.employee_name}<p className="text-xs text-muted-foreground">{a.employee_code}</p></TableCell>
                      <TableCell>{a.form_title}</TableCell>
                      <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {total > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select value={pageSize} onChange={handleRowsPerPageChange}
                  className="border rounded px-2 py-1 text-sm bg-background">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {start} to {end} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)}
                  disabled={page === 1} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((p, i) => (
                  <Button key={i} variant={page === p ? "default" : "outline"} size="sm"
                    onClick={() => typeof p === "number" && goToPage(p)} disabled={p === "..."}
                    className={`h-8 w-8 p-0 ${p === "..." ? "cursor-default" : ""}`}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages} className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Form to Employees</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Form <span className="text-red-500">*</span></p>
                <select value={assignForm.form_id} onChange={(e) => setAssignForm({ ...assignForm, form_id: e.target.value })}
                  className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select form</option>
                  {forms.map((f: any) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                <input type="date" value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                  className="w-full border rounded px-2 py-1 bg-background" />
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-semibold mb-2">Select Employees</p>
              <div className="rounded-md border max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted sticky top-0">
                      <TableHead className="w-10"><input type="checkbox" onChange={() => {
                        if (selectedIds.size === allEmps.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(allEmps.map((e: any) => e.id)));
                      }} checked={allEmps.length > 0 && selectedIds.size === allEmps.length} /></TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allEmps.map((emp: any) => (
                      <TableRow key={emp.id} className={selectedIds.has(emp.id) ? "bg-muted/50" : ""}>
                        <TableCell><input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleEmp(emp.id)} /></TableCell>
                        <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                        <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                        <TableCell>{emp.department || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{selectedIds.size} employee(s) selected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || selectedIds.size === 0}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Assign to {selectedIds.size} employee(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HrFormAssignmentsPage;
