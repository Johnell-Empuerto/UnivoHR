import { useState, useEffect } from "react";
import {
  getKpiHrView, getKpiEvaluationById, assignKpiEvaluation,
  approveKpiEvaluation, rejectKpiEvaluation, getActiveKpiTemplates, getFriendlyKpiError,
  bulkAssignKpiEvaluations,
} from "@/services/kpiService";
import { employees as fetchEmployees } from "@/services/employeeService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { ClipboardList, Plus, ChevronLeft, ChevronRight, Loader2, Eye, CheckCircle, XCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800", "In Progress": "bg-blue-100 text-blue-800",
    Submitted: "bg-amber-100 text-amber-800", Completed: "bg-green-100 text-green-800",
    Approved: "bg-green-100 text-green-800",
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const KpiEvaluationPage = () => {
  const { user } = useAuth();
  const isHr = user?.role === "ADMIN" || user?.role === "HR_USER";
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
  const [assignForm, setAssignForm] = useState({ employee_id: "", evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({ evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
  const [allActiveEmps, setAllActiveEmps] = useState<any[]>([]);
  const [bulkTemplates, setBulkTemplates] = useState<any[]>([]);
  const [bulkEmpSearch, setBulkEmpSearch] = useState("");
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectAllPage, setSelectAllPage] = useState(false);

  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [hrComment, setHrComment] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [terminationReason, setTerminationReason] = useState("");

  useEffect(() => { fetchEvaluations(); }, [page, pageSize, search, statusFilter]);

  const fetchEvaluations = async () => {
    try { setLoading(true); const r = await getKpiHrView(search, statusFilter, page, pageSize); setEvaluations(r.data); setTotal(r.pagination.total); }
    catch (err: any) { toast.error(err.message || "Failed to load"); } finally { setLoading(false); }
  };

  const handleOpenAssign = async () => {
    try {
      const [emps, tmps] = await Promise.all([fetchEmployees(1, 10000, "", "ACTIVE"), getActiveKpiTemplates()]);
      setEmployees(emps.data || emps);
      setTemplates(tmps);
    } catch { }
    setAssignForm({ employee_id: "", evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
    setAssignDialog(true);
  };

  const handleAssign = async () => {
    if (!assignForm.employee_id || !assignForm.evaluator_id || !assignForm.template_id) {
      toast.error("Employee, Evaluator, and Template are required"); return;
    }
    try {
      await assignKpiEvaluation({
        employee_id: Number(assignForm.employee_id),
        evaluator_id: Number(assignForm.evaluator_id),
        template_id: Number(assignForm.template_id),
        evaluation_period_start: assignForm.evaluation_period_start || null,
        evaluation_period_end: assignForm.evaluation_period_end || null,
      });
      toast.success("Evaluation assigned");
      setAssignDialog(false);
      fetchEvaluations();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Assignment failed")); }
  };

  const handleViewDetail = async (id: number) => {
    try { const d = await getKpiEvaluationById(id); setDetail(d); setDetailDialog(true); }
    catch (err: any) { toast.error(err.message || "Failed to load detail"); }
  };

  const handleOpenApprove = (ev: any) => {
    setSelectedEval(ev);
    setHrComment("");
    setTerminationDate("");
    setTerminationReason("");
    setApproveDialog(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedEval) return;
    const payload: any = { hr_comments: hrComment || null };
    if (selectedEval.recommendation === "Terminate") {
      if (!terminationDate) { toast.error("Termination date is required"); return; }
      payload.termination_date = terminationDate;
      payload.termination_reason = terminationReason || null;
    }
    try {
      await approveKpiEvaluation(selectedEval.id, payload);
      toast.success(selectedEval.recommendation === "Regularize" ? "Employee regularized!" : selectedEval.recommendation === "Terminate" ? "Employee terminated" : "Evaluation approved");
      setApproveDialog(false);
      fetchEvaluations();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Unable to approve evaluation.")); }
  };

  const handleOpenReject = (ev: any) => { setSelectedEval(ev); setHrComment(""); setRejectDialog(true); };
  const handleConfirmReject = async () => {
    if (!selectedEval) return;
    try { await rejectKpiEvaluation(selectedEval.id, { hr_comments: hrComment || null }); toast.success("Evaluation rejected"); setRejectDialog(false); fetchEvaluations(); }
    catch (err: any) { toast.error(getFriendlyKpiError(err, "Unable to reject evaluation.")); }
  };

  const handleOpenBulkAssign = async () => {
    try {
      setBulkLoading(true);
      const [emps, tmps] = await Promise.all([fetchEmployees(1, 10000, "", "ACTIVE"), getActiveKpiTemplates()]);
      setAllActiveEmps(emps.data || emps || []);
      setBulkTemplates(tmps || []);
    } catch { setAllActiveEmps([]); setBulkTemplates([]); }
    finally { setBulkLoading(false); }
    setBulkForm({ evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
    setBulkEmpSearch("");
    setSelectedEmpIds(new Set());
    setSelectAllPage(false);
    setBulkDialog(true);
  };

  const toggleEmpSelect = (id: number) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredBulkEmps = allActiveEmps.filter((e: any) => {
    if (!bulkEmpSearch) return true;
    const q = bulkEmpSearch.toLowerCase();
    return (e.first_name + " " + e.last_name).toLowerCase().includes(q)
      || (e.employee_code || "").toLowerCase().includes(q)
      || (e.department || "").toLowerCase().includes(q);
  });

  const handleBulkSelectAll = () => {
    if (selectAllPage) {
      setSelectedEmpIds(new Set());
      setSelectAllPage(false);
    } else {
      setSelectedEmpIds(new Set(filteredBulkEmps.map((e: any) => e.id)));
      setSelectAllPage(true);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkForm.evaluator_id || !bulkForm.template_id) {
      toast.error("Evaluator, and Template are required"); return;
    }
    if (!bulkForm.evaluation_period_start || !bulkForm.evaluation_period_end) {
      toast.error("Evaluation period is required"); return;
    }
    if (selectedEmpIds.size === 0) {
      toast.error("Select at least one employee"); return;
    }
    try {
      setBulkLoading(true);
      const result = await bulkAssignKpiEvaluations({
        employee_ids: Array.from(selectedEmpIds),
        evaluator_id: Number(bulkForm.evaluator_id),
        template_id: Number(bulkForm.template_id),
        evaluation_period_start: bulkForm.evaluation_period_start,
        evaluation_period_end: bulkForm.evaluation_period_end,
      });
      toast.success(`Assigned: ${result.created_count}, Skipped: ${result.skipped_count}`);
      setBulkDialog(false);
      fetchEvaluations();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Bulk assignment failed")); }
    finally { setBulkLoading(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">KPI Evaluations</h1><p className="text-sm text-muted-foreground">Manage performance evaluations and approvals</p></div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <input placeholder="Search employee..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm bg-background">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
          {isHr && <div className="flex gap-2"><Button onClick={handleOpenAssign} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Assign</Button><Button onClick={handleOpenBulkAssign} variant="outline" className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Bulk Assign</Button></div>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading evaluations..." />
          ) : evaluations.length === 0 ? (
            <EmptyState message="No evaluations found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Evaluator</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((ev: any) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium">{ev.employee_name}</TableCell>
                      <TableCell>{ev.evaluator_name}</TableCell>
                      <TableCell>{ev.template_name}</TableCell>
                      <TableCell>{ev.final_score || "-"}</TableCell>
                      <TableCell>{ev.recommendation ? <Badge variant="outline">{ev.recommendation}</Badge> : "-"}</TableCell>
                      <TableCell>{statusBadge(ev.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" title="View" onClick={() => handleViewDetail(ev.id)}><Eye className="h-4 w-4" /></Button>
                          {isHr && ev.status === "Submitted" && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600" title="Approve" onClick={() => handleOpenApprove(ev)}><CheckCircle className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600" title="Reject" onClick={() => handleOpenReject(ev)}><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Evaluation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Employee <span className="text-red-500">*</span></p>
              <select value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select employee</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Evaluator <span className="text-red-500">*</span></p>
              <select value={assignForm.evaluator_id} onChange={(e) => setAssignForm({ ...assignForm, evaluator_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select evaluator</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">KPI Template <span className="text-red-500">*</span></p>
              <select value={assignForm.template_id} onChange={(e) => setAssignForm({ ...assignForm, template_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                <option value="">Select template</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Period Start</p>
                <input type="date" value={assignForm.evaluation_period_start} onChange={(e) => setAssignForm({ ...assignForm, evaluation_period_start: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Period End</p>
                <input type="date" value={assignForm.evaluation_period_end} onChange={(e) => setAssignForm({ ...assignForm, evaluation_period_end: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Assign Evaluations</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">KPI Template <span className="text-red-500">*</span></p>
                <select value={bulkForm.template_id} onChange={(e) => setBulkForm({ ...bulkForm, template_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select template</option>
                  {bulkTemplates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Evaluator <span className="text-red-500">*</span></p>
                <select value={bulkForm.evaluator_id} onChange={(e) => setBulkForm({ ...bulkForm, evaluator_id: e.target.value })} className="w-full border rounded px-2 py-1 bg-background">
                  <option value="">Select evaluator</option>
                  {allActiveEmps.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Period Start <span className="text-red-500">*</span></p>
                <input type="date" value={bulkForm.evaluation_period_start} onChange={(e) => setBulkForm({ ...bulkForm, evaluation_period_start: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Period End <span className="text-red-500">*</span></p>
                <input type="date" value={bulkForm.evaluation_period_end} onChange={(e) => setBulkForm({ ...bulkForm, evaluation_period_end: e.target.value })} className="w-full border rounded px-2 py-1 bg-background" />
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Select Employees</p>
                <input placeholder="Search name/code/department..." value={bulkEmpSearch} onChange={(e) => { setBulkEmpSearch(e.target.value); setSelectAllPage(false); }} className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
              </div>
              {bulkLoading ? (
                <Loader message="Loading employees..." />
              ) : (
                <div className="rounded-md border max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted sticky top-0">
                        <TableHead className="w-10">
                          <input type="checkbox" checked={selectAllPage && filteredBulkEmps.length > 0 && filteredBulkEmps.every((e: any) => selectedEmpIds.has(e.id))}
                            onChange={handleBulkSelectAll} />
                        </TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBulkEmps.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No employees found.</TableCell></TableRow>
                      ) : filteredBulkEmps.map((emp: any) => (
                        <TableRow key={emp.id} className={selectedEmpIds.has(emp.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <input type="checkbox" checked={selectedEmpIds.has(emp.id)} onChange={() => toggleEmpSelect(emp.id)} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                          <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                          <TableCell>{emp.department || "-"}</TableCell>
                          <TableCell>{emp.position || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{emp.employment_status || emp.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">{selectedEmpIds.size} employee(s) selected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkAssign} disabled={bulkLoading || selectedEmpIds.size === 0}>
              {bulkLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Assign to {selectedEmpIds.size} employee(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Evaluation Detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> {detail.employee_name}</div>
                <div><span className="text-muted-foreground">Evaluator:</span> {detail.evaluator_name}</div>
                <div><span className="text-muted-foreground">Template:</span> {detail.template_name}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusBadge(detail.status)}</div>
                <div><span className="text-muted-foreground">Final Score:</span> <span className="font-semibold">{detail.final_score || "-"}</span></div>
                <div><span className="text-muted-foreground">Recommendation:</span> {detail.recommendation || "-"}</div>
              </div>
              {detail.self_evaluation && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Self Evaluation</p><p className="text-sm bg-muted p-2 rounded">{detail.self_evaluation}</p></div>
              )}
              {detail.manager_comments && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">Manager Comments</p><p className="text-sm bg-muted p-2 rounded">{detail.manager_comments}</p></div>
              )}
              {detail.hr_comments && (
                <div><p className="text-xs font-semibold text-muted-foreground mb-1">HR Comments</p><p className="text-sm bg-muted p-2 rounded">{detail.hr_comments}</p></div>
              )}
              {detail.scores && detail.scores.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Scores</p>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader><TableRow className="bg-muted"><TableHead>KPI</TableHead><TableHead>Weight</TableHead><TableHead>Score</TableHead><TableHead>Weighted</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {detail.scores.map((sc: any) => (
                          <TableRow key={sc.id}>
                            <TableCell>{sc.kpi_name}</TableCell><TableCell>{sc.weight}%</TableCell>
                            <TableCell>{sc.manager_score}/5</TableCell><TableCell>{sc.weighted_score}</TableCell>
                            <TableCell className="text-xs">{sc.remarks || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Approve Evaluation</DialogTitle></DialogHeader>
          {selectedEval && (
            <div className="space-y-4">
              <p className="text-sm">Employee: <strong>{selectedEval.employee_name}</strong></p>
              <p className="text-sm">Recommendation: <Badge variant="outline">{selectedEval.recommendation}</Badge></p>
              {selectedEval.recommendation === "Regularize" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                  This will change the employee's employment status from <strong>Probationary</strong> to <strong>Regular</strong>.
                </div>
              )}
              {selectedEval.recommendation === "Terminate" && (
                <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-semibold text-red-700">This will terminate the employee.</p>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Termination Date <span className="text-red-500">*</span></p>
                    <input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} className="w-full border rounded px-2 py-1 bg-background" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Termination Reason</p>
                    <textarea value={terminationReason} onChange={(e) => setTerminationReason(e.target.value)} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" placeholder="e.g., Failed probationary" />
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">HR Comments</p>
                <textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmApprove} className="bg-green-600 hover:bg-green-700">Confirm Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reject Evaluation</DialogTitle></DialogHeader>
          {selectedEval && (
            <div className="space-y-4">
              <p className="text-sm">Reject evaluation for <strong>{selectedEval.employee_name}</strong>?</p>
              <div>
                <p className="text-xs text-muted-foreground mb-1">HR Comments</p>
                <textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmReject} variant="destructive">Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KpiEvaluationPage;
