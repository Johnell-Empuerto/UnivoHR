import { useState, useEffect } from "react";
import {
  getMyKpiAssignments, getKpiEvaluationById, saveKpiScores, submitKpiEvaluation, getFriendlyKpiError,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, Loader2, Star } from "lucide-react";
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

const EmployeeEvaluationPage = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const [evalDialog, setEvalDialog] = useState(false);
  const [currentEval, setCurrentEval] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [managerComments, setManagerComments] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [saving, setSaving] = useState(false);

  const [submitConfirm, setSubmitConfirm] = useState(false);

  useEffect(() => { fetchAssignments(); }, [page, statusFilter]);

  const fetchAssignments = async () => {
    try { setLoading(true); const r = await getMyKpiAssignments(statusFilter, page, 10); setAssignments(r.data); setTotal(r.total); }
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
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">My Evaluations</h1><p className="text-sm text-muted-foreground">Evaluate assigned employees</p></div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-1.5 text-sm bg-background">
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted">Submitted</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin mr-2" /><span>Loading...</span></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No KPI evaluations assigned to you yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
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
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Evaluate - {currentEval?.employee_name}</DialogTitle></DialogHeader>
          {currentEval && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Template: {currentEval.template_name} | Score range: 1 (Low) - 5 (High)</p>
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
                            <input type="number" min="1" max="5" step="0.5" value={sc.manager_score}
                              onChange={(e) => handleScoreChange(sc.template_item_id, Number(e.target.value))}
                              className="w-16 border rounded px-2 py-1 text-sm bg-background" disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
                          </TableCell>
                          <TableCell>{sc.manager_score > 0 ? ws : 0}</TableCell>
                          <TableCell>
                            <input value={sc.remarks || ""} onChange={(e) => setScores(scores.map(s => s.template_item_id === sc.template_item_id ? { ...s, remarks: e.target.value } : s))}
                              className="w-full border rounded px-2 py-1 text-sm bg-background" placeholder="Optional" disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
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
                <textarea value={managerComments} onChange={(e) => setManagerComments(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background min-h-[60px]"
                  disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background"
                  disabled={currentEval.status !== "Draft" && currentEval.status !== "In Progress"}>
                  <option value="">Select recommendation</option>
                  <option value="Regularize">Regularize</option>
                  <option value="Extend Probation">Extend Probation</option>
                  <option value="Training">Training</option>
                  <option value="Warning">Warning</option>
                  <option value="Terminate">Terminate</option>
                </select>
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
