import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/shared/Loader";
import { useAuth } from "@/app/providers/AuthProvider";
import { getMyPerformanceSummary } from "@/services/kpiService";
import { toast } from "sonner";
import {
  LineChart,
  Target,
  ClipboardCheck,
  Clock,
  UserCheck,
  Award,
  TrendingUp,
  FileText,
} from "lucide-react";

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Probationary: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    Regular: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Terminated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <Badge className={map[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}>
      {status}
    </Badge>
  );
};

const getReadinessBadge = (readiness: string) => {
  const map: Record<string, string> = {
    "Recommended for Regularization": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Needs Improvement": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "Probation Extension Recommended": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "Not Recommended": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "No Evaluation Yet": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <Badge className={map[readiness] || "bg-gray-100 text-gray-800"}>
      {readiness}
    </Badge>
  );
};

const MyPerformancePage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summary = await getMyPerformanceSummary();
        setData(summary);
      } catch (error) {
        console.error("Failed to load performance summary:", error);
        toast.error("Failed to load performance summary");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <LineChart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            My Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Your performance evaluation summary and employment status
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading performance data..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Latest KPI Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data?.latestScore != null ? data.latestScore : "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-green-50/50 to-transparent dark:from-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Average KPI Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data?.averageScore != null ? data.averageScore : "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data?.completedEvaluations ?? 0}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data?.pendingEvaluations ?? 0}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Employment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {getStatusBadge(data?.employmentStatus || "Unknown")}
                </div>
              </CardContent>
            </Card>
          </div>

          {data?.latestEvaluation && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Latest Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-semibold">{data.latestEvaluation.templateName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Evaluator</p>
                    <p className="font-semibold">{data.latestEvaluation.evaluatorName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-semibold">
                      {data.latestEvaluation.periodStart || "—"} to {data.latestEvaluation.periodEnd || "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Score</p>
                    <p className="text-xl font-bold">{data.latestEvaluation.finalScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recommendation</p>
                    <p className="font-semibold">{data.latestEvaluation.recommendation || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Regularization Readiness</p>
                    <div className="mt-1">
                      {getReadinessBadge(data.latestEvaluation.recommendation
                        ? (data.latestEvaluation.recommendation === "Regularize"
                          ? "Recommended for Regularization"
                          : data.latestEvaluation.recommendation === "Extend Probation"
                          ? "Probation Extension Recommended"
                          : data.latestEvaluation.recommendation === "Terminate"
                          ? "Not Recommended"
                          : "Needs Improvement")
                        : "No Evaluation Yet")}
                    </div>
                  </div>
                </div>
                {data.latestEvaluation.hrComments && (
                  <div>
                    <p className="text-sm text-muted-foreground">HR Comments</p>
                    <p className="mt-1 text-sm italic border-l-2 border-muted-foreground/30 pl-3">
                      {data.latestEvaluation.hrComments}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!data?.latestEvaluation && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  No Evaluations Yet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You have no completed KPI evaluations yet. Once your performance is evaluated, results will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MyPerformancePage;
