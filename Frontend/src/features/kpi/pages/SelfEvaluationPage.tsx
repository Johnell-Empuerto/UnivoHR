import { useState, useEffect } from "react";
import {
  getMyKpiEvaluations, getKpiEvaluationById, saveKpiSelfEvaluation, getFriendlyKpiError,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { FileText, Loader2, Save, ChevronLeft, ChevronRight } from "lucide-react";
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

const SelfEvaluationPage = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  const [selfEval, setSelfEval] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [page, pageSize]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const r = await getMyKpiEvaluations("", page, pageSize);
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
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary dark:text-black" /></div>
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
