import { useState, useEffect } from "react";
import {
  getMyKpiAssignments, getKpiEvaluationById, saveKpiScores, submitKpiEvaluation, getFriendlyKpiError,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

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

const EmployeeEvaluationPage = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
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

  const [evalDialog, setEvalDialog] = useState(false);
  const [currentEval, setCurrentEval] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [managerComments, setManagerComments] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [saving, setSaving] = useState(false);

  const [submitConfirm, setSubmitConfirm] = useState(false);

  useEffect(() => { fetchAssignments(); }, [page, pageSize, statusFilter]);

  const fetchAssignments = async () => {
    try { setLoading(true); const r = await getMyKpiAssignments(statusFilter, page, pageSize); setAssignments(r.data); setTotal(r.pagination.total); }
    catch { } finally { setLoading(false); }
  };

  const handleOpenEval = async (id: number) => {
    try {
      const d = await getKpiEvaluationById(id);
      setCurrentEval(d);
      const initialScores = d.items.map((item: any) => {
        const existing = (d.scores || []).find((s: any) => s.template_item_id === item.id);
        return {
          template_item_id: item.id, kpi_name: item.kpi_name, weight: item.weight,
          manager_score: existing?.manager_score || 0, remarks: existing?.remarks || "",
        };
      });
      setScores(initialScores);
      setManagerComments(d.manager_comments || "");
      setRecommendation(d.recommendation || "");
      setEvalDialog(true);
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Failed to load evaluation")); }
  };

  const handleScoreChange = (templateItemId: number, value: number) => {
    setScores(scores.map(s => s.template_item_id === templateItemId ? { ...s, manager_score: Math.min(5, Math.max(1, value)) } : s));
  };

  const handleSaveScores = async () => {
    if (!currentEval) return;
    try {
      setSaving(true);
      await saveKpiScores(currentEval.id, { scores });
      toast.success("Scores saved");
      const d = await getKpiEvaluationById(currentEval.id);
      setCurrentEval(d);
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Save failed")); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!currentEval) return;
    if (!recommendation) { toast.error("Please select a recommendation"); return; }
    const hasScore = scores.some(s => s.manager_score > 0);
    if (!hasScore) {
      toast.error("Please score at least one KPI item before submitting.");
      setSubmitConfirm(false);
      return;
    }
    try {
      setSaving(true);
      await submitKpiEvaluation(currentEval.id, { manager_comments: managerComments, recommendation });
      toast.success("Evaluation submitted");
      setEvalDialog(false);
      setSubmitConfirm(false);
      fetchAssignments();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Submit failed")); }
    finally { setSaving(false); }
  };

  const totalWeighted = scores.reduce((s, sc) => {
    const ws = (sc.manager_score / 5) * sc.weight;
    return s + ws;
  }, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">My Evaluations</h1><p className="text-sm text-muted-foreground">Evaluate assigned employees</p></div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={statusFilter || undefined} onValueChange={(val) => { setStatusFilter(val === "_all" ? "" : val); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading assignments..." />
          ) : assignments.length === 0 ? (
            <EmptyState message="No KPI evaluations assigned to you yet." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Self Eval</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.employee_name}<p className="text-xs text-muted-foreground">{a.employee_code}</p></TableCell>
                      <TableCell>{a.template_name}</TableCell>
                      <TableCell>{a.final_score || "-"}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>{a.self_evaluation ? <Badge className={getStatusBadgeClass("success")}>Completed</Badge> : <Badge className={getStatusBadgeClass("danger")}>Missing</Badge>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleOpenEval(a.id)} className="flex items-center gap-1">
                          <Star className="h-4 w-4" /> Evaluate
                        </Button>
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
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                  <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
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

      <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Evaluate - {currentEval?.employee_name}</DialogTitle></DialogHeader>
          {currentEval && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Template: {currentEval.template_name} | Score range: 1 (Low) - 5 (High)</p>
              {!currentEval.self_evaluation && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                  Self Evaluation: <strong>Missing</strong> — Employee has not submitted their self-evaluation yet.
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>KPI</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Score (1-5)</TableHead>
                      <TableHead>Weighted</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((sc) => {
                      const ws = Math.round(((sc.manager_score / 5) * sc.weight) * 100) / 100;
                      return (
                        <TableRow key={sc.template_item_id}>
                          <TableCell className="font-medium">{sc.kpi_name}</TableCell>
                          <TableCell>{sc.weight}%</TableCell>
                          <TableCell>
                            <Input type="number" min={1} max={5} step="0.5" value={sc.manager_score}
                              onChange={(e) => handleScoreChange(sc.template_item_id, Number(e.target.value))}
                              className="w-20" disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
                          </TableCell>
                          <TableCell>{sc.manager_score > 0 ? ws : 0}</TableCell>
                          <TableCell>
                            <Input value={sc.remarks || ""} onChange={(e) => setScores(scores.map(s => s.template_item_id === sc.template_item_id ? { ...s, remarks: e.target.value } : s))}
                              placeholder="Optional" disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="text-right text-sm font-semibold">Total Weighted Score: {Math.round(totalWeighted * 100) / 100}</div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Manager Comments</p>
                <Textarea value={managerComments} onChange={(e) => setManagerComments(e.target.value)}
                  disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                <Select value={recommendation || undefined} onValueChange={setRecommendation}
                  disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"}>
                  <SelectTrigger><SelectValue placeholder="Select recommendation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regularize">Regularize</SelectItem>
                    <SelectItem value="Extend Probation">Extend Probation</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Terminate">Terminate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                {(currentEval.status === "Draft" || currentEval.status === "In Progress") && (
                  <>
                    <Button variant="outline" onClick={handleSaveScores} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save Scores
                    </Button>
                    <Button onClick={() => setSubmitConfirm(true)} className="bg-blue-600 hover:bg-blue-700">Submit</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={submitConfirm} onOpenChange={setSubmitConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Submit Evaluation</DialogTitle></DialogHeader>
          <p className="text-sm">Once submitted, you will not be able to edit the scores. Continue?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitConfirm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeEvaluationPage;
