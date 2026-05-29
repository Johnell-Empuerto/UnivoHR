import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/shared/Loader";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  getMyProbationInfo,
} from "@/services/kpiService";
import {
  UserCheck,
  CalendarDays,
  Clock,
  Target,
  Award,
  TrendingUp,
  AlertTriangle,
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

const MyProbationStatusPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const info = await getMyProbationInfo();
        setData(info);
      } catch (error) {
        console.error("Failed to load probation info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <UserCheck className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Probation Status
          </h1>
          <p className="text-sm text-muted-foreground">
            Your employment status and regularization progress
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading probation information..." />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow-sm bg-linear-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Employment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(data.employmentStatus)}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Hire Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{formatDate(data.hiredDate)}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-green-50/50 to-transparent dark:from-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" /> Expected Regularization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {formatDate(data.expectedRegularizationDate)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-linear-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Days Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.employmentStatus === "Regular"
                    ? "—"
                    : data.daysRemaining != null
                    ? data.daysRemaining
                    : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Latest KPI Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.latestEvaluation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Score:</span>
                      <span className="font-bold text-lg">{data.latestEvaluation.finalScore}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Period: </span>
                      <span className="font-medium">
                        {formatDate(data.latestEvaluation.periodStart)} to {formatDate(data.latestEvaluation.periodEnd)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Evaluator: </span>
                      <span className="font-medium">{data.latestEvaluation.evaluatorName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Recommendation: </span>
                      <span className="font-medium">{data.latestEvaluation.recommendation || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No completed evaluations yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Regularization Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getReadinessBadge(data.regularizationReadiness)}
                </div>

                {data.latestEvaluation?.hrComments && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">HR Comments</p>
                    <p className="text-sm italic border-l-2 border-muted-foreground/30 pl-3">
                      {data.latestEvaluation.hrComments}
                    </p>
                  </div>
                )}

                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <p className="text-sm font-medium flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    About Probation Milestones
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Detailed probation milestone tracking is not yet configured.
                    Your regularization status is based on the latest KPI evaluation
                    recommendation from your supervisor.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              Unable to load probation information.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProbationStatusPage;
