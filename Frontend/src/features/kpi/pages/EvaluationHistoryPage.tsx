import { useState, useEffect } from "react";
import { getKpiHistory, getKpiEvaluationById, getFriendlyKpiError } from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { History, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";

const EvaluationHistoryPage = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  const isHr = user?.role === "ADMIN" || user?.role === "HR_ADMIN";
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const [viewEmployeeId, setViewEmployeeId] = useState<number | undefined>(undefined);
  const [searchEmp, setSearchEmp] = useState("");

  useEffect(() => { fetchHistory(); }, [page, viewEmployeeId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const r = await getKpiHistory(viewEmployeeId, page, 10);
      setRecords(Array.isArray(r) ? r : r.data || []);
      setTotal(r.total || r.length || 0);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  };

  const handleViewDetail = async (id: number) => {
    try { const d = await getKpiEvaluationById(id); setDetail(d); setDetailDialog(true); }
    catch (err: any) { toast.error(err.message || "Failed to load"); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Approved: "bg-green-100 text-green-800", Completed: "bg-green-100 text-green-800", Submitted: "bg-amber-100 text-amber-800" };
    return <Badge className={map[s] || ""}>{s}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><History className="h-5 w-5 text-primary dark:text-black" /></div>
        <div><h1 className="text-2xl font-bold text-muted-foreground">Evaluation History</h1><p className="text-sm text-muted-foreground">View completed performance evaluations</p></div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {isHr && (
              <input placeholder="Search by employee code or name..."
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setViewEmployeeId(undefined); }}
                className="border rounded px-3 py-1.5 text-sm bg-background w-64" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader message="Loading evaluation history..." />
          ) : records.length === 0 ? (
            <EmptyState message="No completed evaluations found." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    {isHr && <TableHead>Employee</TableHead>}
                    <TableHead>Template</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id}>
                      {isHr && <TableCell className="font-medium">{r.employee_name}</TableCell>}
                      <TableCell>{r.template_name}</TableCell>
                      <TableCell><span className="font-semibold">{r.final_score || "-"}</span></TableCell>
                      <TableCell>{r.recommendation ? <Badge variant="outline">{r.recommendation}</Badge> : "-"}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-sm">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" title="View" onClick={() => handleViewDetail(r.id)}><Eye className="h-4 w-4" /></Button>
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

      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Evaluation Detail</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.employee_name && <div><span className="text-muted-foreground">Employee:</span> {detail.employee_name}</div>}
                <div><span className="text-muted-foreground">Evaluator:</span> {detail.evaluator_name}</div>
                <div><span className="text-muted-foreground">Template:</span> {detail.template_name}</div>
                <div><span className="text-muted-foreground">Final Score:</span> <span className="font-semibold">{detail.final_score || "-"}</span></div>
                <div><span className="text-muted-foreground">Recommendation:</span> {detail.recommendation || "-"}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusBadge(detail.status)}</div>
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
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDetailDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluationHistoryPage;
