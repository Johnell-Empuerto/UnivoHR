import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  assignKpiEvaluation, approveKpiEvaluation, rejectKpiEvaluation, getFriendlyKpiError,
  bulkAssignKpiEvaluations,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import EmployeePickerDialog from "@/components/shared/EmployeePickerDialog";
import { type EmployeeSearchResult } from "@/services/overtimeService";
import { ClipboardList, Plus, ChevronLeft, ChevronRight, Loader2, Eye, CheckCircle, XCircle, CheckSquare, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import { useKpiHrView } from "../hooks/useKpiHrView";
import { useKpiActiveTemplates } from "../hooks/useKpiActiveTemplates";
import { useKpiEvaluationDetail } from "@/hooks/useKpiEvaluationDetail";
import { useSearchEmployeesPaginated } from "../hooks/useSearchEmployeesPaginated";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Draft: getStatusBadgeClass("neutral"),
    "In Progress": getStatusBadgeClass("info"),
    Submitted: getStatusBadgeClass("warning"),
    Completed: getStatusBadgeClass("success"),
    Approved: getStatusBadgeClass("success"),
  };
  return <Badge className={map[s] || getStatusBadgeClass("neutral")}>{s}</Badge>;
};

const KpiEvaluationPage = () => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const isHr = hasPermission("performance.evaluations.manage");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const activeFilterCount = [search, statusFilter].filter(Boolean).length;

  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: "", evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [selectedEvaluator, setSelectedEvaluator] = useState<EmployeeSearchResult | null>(null);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [evaluatorPickerOpen, setEvaluatorPickerOpen] = useState(false);

  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedEvalId, setSelectedEvalId] = useState<number | null>(null);

  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkForm, setBulkForm] = useState({ template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
  const [selectedBulkEvaluator, setSelectedBulkEvaluator] = useState<EmployeeSearchResult | null>(null);
  const [bulkEvaluatorPickerOpen, setBulkEvaluatorPickerOpen] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPage, setBulkPage] = useState(1);
  const [bulkSearch, setBulkSearch] = useState("");
  const BULK_PAGE_SIZE = 10;

  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [hrComment, setHrComment] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [terminationReason, setTerminationReason] = useState("");

  const { data: evaluationsData, isLoading } = useKpiHrView(search, statusFilter, page, pageSize);
  const evaluations = evaluationsData?.data ?? [];
  const total = evaluationsData?.pagination?.total ?? 0;

  const { data: activeTemplates } = useKpiActiveTemplates();
  const templates = activeTemplates ?? [];
  const bulkTemplates = activeTemplates ?? [];

  const { data: detail } = useKpiEvaluationDetail(selectedEvalId);

  const { data: bulkEmpsData, isLoading: bulkLoadingEmps } = useSearchEmployeesPaginated(
    bulkSearch, bulkPage, BULK_PAGE_SIZE, bulkDialog
  );
  const bulkEmps = bulkEmpsData?.data ?? [];
  const bulkTotal = bulkEmpsData?.pagination?.total ?? 0;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const handleOpenAssign = () => {
    setAssignForm({ employee_id: "", evaluator_id: "", template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
    setSelectedEmployee(null);
    setSelectedEvaluator(null);
    setAssignDialog(true);
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedEvaluator || !assignForm.template_id) {
      toast.error("Employee, Evaluator, and Template are required"); return;
    }
    try {
      await assignKpiEvaluation({
        employee_id: selectedEmployee.id,
        evaluator_id: selectedEvaluator.id,
        template_id: Number(assignForm.template_id),
        evaluation_period_start: assignForm.evaluation_period_start || null,
        evaluation_period_end: assignForm.evaluation_period_end || null,
      });
      toast.success("Evaluation assigned");
      setAssignDialog(false);
      queryClient.invalidateQueries({ queryKey: ["kpi-hr-view"] });
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Assignment failed")); }
  };

  const handleViewDetail = (id: number) => {
    setSelectedEvalId(id);
    setDetailDialog(true);
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
      queryClient.invalidateQueries({ queryKey: ["kpi-hr-view"] });
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Unable to approve evaluation.")); }
  };

  const handleOpenReject = (ev: any) => { setSelectedEval(ev); setHrComment(""); setRejectDialog(true); };
  const handleConfirmReject = async () => {
    if (!selectedEval) return;
    try {
      await rejectKpiEvaluation(selectedEval.id, { hr_comments: hrComment || null });
      toast.success("Evaluation rejected");
      setRejectDialog(false);
      queryClient.invalidateQueries({ queryKey: ["kpi-hr-view"] });
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Unable to reject evaluation.")); }
  };

  const handleOpenBulkAssign = () => {
    setBulkForm({ template_id: "", evaluation_period_start: "", evaluation_period_end: "" });
    setSelectedBulkEvaluator(null);
    setSelectedEmpIds(new Set());
    setBulkPage(1);
    setBulkSearch("");
    setBulkDialog(true);
  };

  const toggleEmpSelect = (id: number) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkTotalPages = Math.ceil(bulkTotal / BULK_PAGE_SIZE) || 1;

  const handleBulkSelectAll = () => {
    if (bulkEmps.length === 0) return;
    const allOnPageSelected = bulkEmps.every((e: any) => selectedEmpIds.has(e.id));
    if (allOnPageSelected) {
      const next = new Set(selectedEmpIds);
      bulkEmps.forEach((e: any) => next.delete(e.id));
      setSelectedEmpIds(next);
    } else {
      const next = new Set(selectedEmpIds);
      bulkEmps.forEach((e: any) => next.add(e.id));
      setSelectedEmpIds(next);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedBulkEvaluator || !bulkForm.template_id) {
      toast.error("Evaluator and Template are required"); return;
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
        evaluator_id: selectedBulkEvaluator.id,
        template_id: Number(bulkForm.template_id),
        evaluation_period_start: bulkForm.evaluation_period_start,
        evaluation_period_end: bulkForm.evaluation_period_end,
      });
      toast.success(`Assigned: ${result.created_count}, Skipped: ${result.skipped_count}`);
      setBulkDialog(false);
      queryClient.invalidateQueries({ queryKey: ["kpi-hr-view"] });
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Bulk assignment failed")); }
    finally { setBulkLoading(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">KPI Evaluations</h1><p className="text-sm text-muted-foreground">Manage performance evaluations and approvals</p></div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employee..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8" />
            </div>
            <Select value={statusFilter || undefined} onValueChange={(val) => { setStatusFilter(val === "_all" ? "" : val); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          {isHr && <div className="flex gap-2"><Button onClick={handleOpenAssign} className="flex items-center gap-2"><Plus className="h-4 w-4" /> Assign</Button><Button onClick={handleOpenBulkAssign} variant="outline" className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Bulk Assign</Button></div>}
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                          <Button variant="ghost" size="icon-sm" title="View" onClick={() => handleViewDetail(ev.id)}><Eye className="h-4 w-4" /></Button>
                          {isHr && ev.status === "Submitted" && (
                            <>
                              <Button variant="ghost" size="icon-sm" className="text-green-600" title="Approve" onClick={() => handleOpenApprove(ev)}><CheckCircle className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon-sm" className="text-red-600" title="Reject" onClick={() => handleOpenReject(ev)}><XCircle className="h-4 w-4" /></Button>
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
          <TablePagination
            page={page}
            totalPages={Math.ceil(total / pageSize)}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Assign Evaluation</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Employee <span className="text-red-500">*</span></Label>
              {selectedEmployee ? (
                <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {selectedEmployee.employee_code} — {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {selectedEmployee.department || selectedEmployee.branch_name || ""}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setSelectedEmployee(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setEmployeePickerOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Select employee
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Evaluator <span className="text-red-500">*</span></Label>
              {selectedEvaluator ? (
                <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {selectedEvaluator.employee_code} — {selectedEvaluator.first_name} {selectedEvaluator.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {selectedEvaluator.department || selectedEvaluator.branch_name || ""}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setSelectedEvaluator(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setEvaluatorPickerOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Select evaluator
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>KPI Template <span className="text-red-500">*</span></Label>
              <Select value={assignForm.template_id || undefined} onValueChange={(val) => setAssignForm({ ...assignForm, template_id: val })}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period Start</Label>
                <Input type="date" value={assignForm.evaluation_period_start} onChange={(e) => setAssignForm({ ...assignForm, evaluation_period_start: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Period End</Label>
                <Input type="date" value={assignForm.evaluation_period_end} onChange={(e) => setAssignForm({ ...assignForm, evaluation_period_end: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployeePickerDialog
        open={employeePickerOpen}
        onOpenChange={setEmployeePickerOpen}
        title="Select Employee"
        onSelect={(emp) => {
          setSelectedEmployee(emp);
          setEmployeePickerOpen(false);
        }}
        activeOnly={true}
        requireUserAccount={false}
      />

      <EmployeePickerDialog
        open={evaluatorPickerOpen}
        onOpenChange={setEvaluatorPickerOpen}
        title="Select Evaluator"
        onSelect={(emp) => {
          setSelectedEvaluator(emp);
          setEvaluatorPickerOpen(false);
        }}
        excludeEmployeeId={selectedEmployee ? selectedEmployee.id : undefined}
        activeOnly={true}
        requireUserAccount={true}
      />

      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bulk Assign Evaluations</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>KPI Template <span className="text-red-500">*</span></Label>
                <Select value={bulkForm.template_id || undefined} onValueChange={(val) => setBulkForm({ ...bulkForm, template_id: val })}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {bulkTemplates.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Evaluator <span className="text-red-500">*</span></Label>
                {selectedBulkEvaluator ? (
                  <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {selectedBulkEvaluator.employee_code} — {selectedBulkEvaluator.first_name} {selectedBulkEvaluator.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {selectedBulkEvaluator.department || selectedBulkEvaluator.branch_name || ""}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setSelectedBulkEvaluator(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={() => setBulkEvaluatorPickerOpen(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Select evaluator
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Period Start <span className="text-red-500">*</span></Label>
                <Input type="date" value={bulkForm.evaluation_period_start} onChange={(e) => setBulkForm({ ...bulkForm, evaluation_period_start: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Period End <span className="text-red-500">*</span></Label>
                <Input type="date" value={bulkForm.evaluation_period_end} onChange={(e) => setBulkForm({ ...bulkForm, evaluation_period_end: e.target.value })} />
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Select Employees</p>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search name/code/department..." value={bulkSearch}
                    onChange={(e) => { setBulkSearch(e.target.value); setBulkPage(1); }}
                    className="w-64" />
                </div>
              </div>
              {bulkLoadingEmps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : bulkEmps.length === 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-10" />
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Emp Status</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No employees found.</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="w-10">
                          <input type="checkbox"
                            checked={bulkEmps.length > 0 && bulkEmps.every((e: any) => selectedEmpIds.has(e.id))}
                            onChange={handleBulkSelectAll} />
                        </TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Emp Status</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkEmps.map((emp: any) => (
                        <TableRow key={emp.id} className={selectedEmpIds.has(emp.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <input type="checkbox" checked={selectedEmpIds.has(emp.id)} onChange={() => toggleEmpSelect(emp.id)} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                          <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                          <TableCell>{emp.branch_name || "-"}</TableCell>
                          <TableCell>{emp.department || "-"}</TableCell>
                          <TableCell>{emp.position || "-"}</TableCell>
                          <TableCell>{emp.employment_status || "-"}</TableCell>
                          <TableCell>{emp.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {bulkTotal > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={bulkPage <= 1}
                      onClick={() => { setBulkPage((p) => Math.max(1, p - 1)); }}
                      className="h-7 px-2 text-xs">
                      <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {bulkPage} of {bulkTotalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={bulkPage >= bulkTotalPages}
                      onClick={() => setBulkPage((p) => p + 1)}
                      className="h-7 px-2 text-xs">
                      Next <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">{BULK_PAGE_SIZE} per page</span>
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

      <EmployeePickerDialog
        open={bulkEvaluatorPickerOpen}
        onOpenChange={setBulkEvaluatorPickerOpen}
        title="Select Evaluator"
        onSelect={(emp) => {
          setSelectedBulkEvaluator(emp);
          setBulkEvaluatorPickerOpen(false);
        }}
        activeOnly={true}
        requireUserAccount={true}
      />

      <Dialog open={detailDialog} onOpenChange={(v) => { if (!v) setSelectedEvalId(null); setDetailDialog(v); }}>
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
                  This will change the employee's employment status from <strong>PROBATIONARY</strong> to <strong>REGULAR</strong>.
                </div>
              )}
              {selectedEval.recommendation === "Terminate" && (
                <div className="space-y-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-semibold text-red-700">This will terminate the employee.</p>
                  <div className="space-y-1">
                    <Label>Termination Date <span className="text-red-500">*</span></Label>
                    <Input type="date" value={terminationDate} onChange={(e) => setTerminationDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Termination Reason</Label>
                    <Textarea value={terminationReason} onChange={(e) => setTerminationReason(e.target.value)} placeholder="e.g., Failed probationary" />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label>HR Comments</Label>
                <Textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} />
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
              <div className="space-y-1">
                <Label>HR Comments</Label>
                <Textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} />
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
