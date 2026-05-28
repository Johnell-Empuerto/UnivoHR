import { useState, useEffect } from "react";
import {
  getMyKpiEvaluations, getKpiEvaluationById, saveKpiSelfEvaluation, getFriendlyKpiError,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Loader2, Save } from "lucide-react";
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

  const [evalDialog, setEvalDialog] = useState(false);
  const [currentEval, setCurrentEval] = useState<any>(null);
  const [selfEval, setSelfEval] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const all = await getMyKpiEvaluations();
      setEvaluations(all);
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
    try {
      setSaving(true);
      await saveKpiSelfEvaluation(currentEval.id, { self_evaluation: selfEval });
      toast.success("Self evaluation saved");
      fetchAll();
    } catch (err: any) { toast.error(getFriendlyKpiError(err, "Save failed")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Self Evaluation</h1><p className="text-sm text-muted-foreground">Submit your own performance assessment</p></div>
      </div>

      <Card className="shadow-sm">
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin mr-2" /><span>Loading...</span></div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No evaluations assigned to you.</div>
          ) : (
            <div className="rounded-md border">
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
                          <FileText className="h-4 w-4" /> {ev.self_evaluation ? "Edit" : "Answer"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Self Evaluation</DialogTitle></DialogHeader>
          {currentEval && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Template: {currentEval.template_name}</p>
              {(currentEval.status === "Draft" || currentEval.status === "In Progress") ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Your Achievements</p>
                    <textarea value={selfEval}
                      onChange={(e) => setSelfEval(e.target.value)}
                      className="w-full border rounded px-2 py-1 bg-background min-h-[120px]"
                      placeholder="Describe your achievements during this evaluation period..." />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-1">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Your Response</p>
                  <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{currentEval.self_evaluation || "No response submitted."}</p>
                </div>
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
