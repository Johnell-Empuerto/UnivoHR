import { useState, useEffect } from "react";
import {
  getMyKpiEvaluations,
  getKpiEvaluationById,
} from "@/services/kpiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";
import {
  ClipboardList,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Submitted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };
  return <Badge className={map[s] || ""}>{s}</Badge>;
};

const MyKpiResultsPage = () => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const r = await getMyKpiEvaluations("", page, pageSize);
      setEvaluations(r.data || (Array.isArray(r) ? r : []));
      setTotal(r.pagination?.total || (Array.isArray(r) ? r.length : 0));
    } catch (error) {
      console.error("Failed to load evaluations:", error);
      toast.error("Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [page, pageSize]);

  const handleViewDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const data = await getKpiEvaluationById(id);
      setSelectedEval(data);
    } catch (error) {
      console.error("Failed to load evaluation detail:", error);
      toast.error("Failed to load evaluation detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            KPI Results
          </h1>
          <p className="text-sm text-muted-foreground">
            View your performance evaluation results and scores
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading KPI results..." />
      ) : evaluations.length === 0 ? (
        <EmptyState message="No KPI evaluations found" />
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              My Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border shadow-sm mx-4 mb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Period</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Evaluator</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((ev: any) => (
                    <TableRow key={ev.id}>
                      <TableCell className="text-sm">
                        {formatDate(ev.evaluation_period_start)} to {formatDate(ev.evaluation_period_end)}
                      </TableCell>
                      <TableCell className="font-medium">{ev.template_name}</TableCell>
                      <TableCell>{ev.evaluator_name || "—"}</TableCell>
                      <TableCell className="font-bold">
                        {ev.final_score != null ? ev.final_score : "—"}
                      </TableCell>
                      <TableCell>{ev.recommendation || "—"}</TableCell>
                      <TableCell>{statusBadge(ev.status)}</TableCell>
                      <TableCell className="text-sm">{formatDate(ev.updated_at || ev.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(ev.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {total > 0 && (
              <div className="flex items-center justify-between px-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {start} to {end} of {total} entries
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)}
                    disabled={page === 1} className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="sm"
                      onClick={() => goToPage(p)} className="h-8 w-8 p-0">{p}</Button>
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
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <Loader message="Loading details..." />
          ) : selectedEval ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Template</p>
                  <p className="font-semibold">{selectedEval.template_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Evaluator</p>
                  <p className="font-semibold">{selectedEval.evaluator_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-semibold">
                    {formatDate(selectedEval.evaluation_period_start)} to{" "}
                    {formatDate(selectedEval.evaluation_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{statusBadge(selectedEval.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Final Score</p>
                  <p className="text-xl font-bold">
                    {selectedEval.final_score != null ? selectedEval.final_score : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recommendation</p>
                  <p className="font-semibold">{selectedEval.recommendation || "—"}</p>
                </div>
              </div>

              {selectedEval.scores && selectedEval.scores.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Score Breakdown</h3>
                  <div className="rounded-md border shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead>KPI Name</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Weighted Score</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEval.scores.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.kpi_name}</TableCell>
                            <TableCell>{s.weight}%</TableCell>
                            <TableCell>{s.manager_score ?? "—"}</TableCell>
                            <TableCell>{s.weighted_score ?? "—"}</TableCell>
                            <TableCell className="text-sm">{s.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {(selectedEval.self_evaluation ||
                selectedEval.manager_comments ||
                selectedEval.hr_comments) && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Comments</h3>
                  {selectedEval.self_evaluation && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                        Self Evaluation
                      </p>
                      <p className="text-sm">{selectedEval.self_evaluation}</p>
                    </div>
                  )}
                  {selectedEval.manager_comments && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                        Manager Comments
                      </p>
                      <p className="text-sm">{selectedEval.manager_comments}</p>
                    </div>
                  )}
                  {selectedEval.hr_comments && (
                    <div className="bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                        HR Comments
                      </p>
                      <p className="text-sm">{selectedEval.hr_comments}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load evaluation details.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyKpiResultsPage;
