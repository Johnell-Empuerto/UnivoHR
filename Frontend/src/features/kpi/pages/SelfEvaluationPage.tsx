import { useState, useEffect } from "react";
import {
  getMyKpiEvaluations, getKpiEvaluationById, saveKpiSelfEvaluation, getFriendlyKpiError,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import { getStatusBadgeClass } from "@/utils/statusBadge";

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

const SelfEvaluationPage = () => {
  useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [evalDialog, setEvalDialog] = useState(false);
  const [currentEval, setCurrentEval] = useState<any>(null);
  const [selfEval, setSelfEval] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [page, pageSize]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const r = await getMyKpiEvaluations("");
      setEvaluations(r.data || (Array.isArray(r) ? r : []));
      setTotal(r.pagination?.total || (Array.isArray(r) ? r.length : 0));
    } catch { setEvaluations([]); }
    finally { setLoading(false); }
  };

  const handleOpen = async (id: number) => {
    try {
      const d = await getKpiEvaluationById(id);
      setCurrentEval(d);
      setSelfEval(d.self_evaluation || "");
      setEvalDialog(true);
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Failed to load")); }
  };

  const handleSave = async () => {
    if (!currentEval) return;
    const isAckMode = currentEval.status !== "Draft" && currentEval.status !== "In Progress";
    try {
      setSaving(true);
      await saveKpiSelfEvaluation(currentEval.id, { self_evaluation: selfEval });
      toast.success(isAckMode ? "Acknowledgement saved" : "Self evaluation saved");
      fetchAll();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Save failed")); }
    finally { setSaving(false); }
  };

  const isEditable = (s: string) => s === "Draft" || s === "In Progress";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Self Evaluation</h1><p className="text-sm text-muted-foreground">Submit your own performance assessment</p></div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Loader message="Loading evaluations..." /></div>
          ) : evaluations.length === 0 ? (
            <div className="p-6"><EmptyState message="No evaluations assigned to you." /></div>
          ) : (
            <>
              <div className="rounded-md border m-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Template</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((ev: any) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium">{ev.template_name}</TableCell>
                        <TableCell>{ev.final_score || "-"}</TableCell>
                        <TableCell>{statusBadge(ev.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleOpen(ev.id)} className="flex items-center gap-1">
                            <FileText className="h-4 w-4" /> {isEditable(ev.status) ? (ev.self_evaluation ? "Edit" : "Answer") : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={page}
                totalPages={Math.ceil(total / pageSize)}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{currentEval && isEditable(currentEval.status) ? "Self Evaluation" : "Employee Acknowledgement"}</DialogTitle></DialogHeader>
          {currentEval && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Template: {currentEval.template_name}</p>
              {isEditable(currentEval.status) ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Your Achievements</p>
                    <Textarea value={selfEval}
                      onChange={(e) => setSelfEval(e.target.value)}
                      className="min-h-[120px]"
                      placeholder="Describe your achievements during this evaluation period..." />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Final Score</p>
                      <p className="text-lg font-bold">{currentEval.final_score ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Recommendation</p>
                      <p>{currentEval.recommendation || "-"}</p>
                    </div>
                  </div>
                  {currentEval.manager_comments && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Evaluator Comments</p>
                      <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{currentEval.manager_comments}</p>
                    </div>
                  )}
                  {currentEval.hr_comments && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">HR Comments</p>
                      <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{currentEval.hr_comments}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Your Acknowledgement</p>
                    <Textarea value={selfEval}
                      onChange={(e) => setSelfEval(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="No acknowledgement submitted yet." />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEvalDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelfEvaluationPage;
