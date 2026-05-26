import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Clock, UserX } from "lucide-react";
import { getLatestForecasts } from "@/services/forecastService";

const metricConfig: Record<string, { label: string; icon: React.ReactNode; color: string; format: (v: number | string) => string }> = {
  attendance_rate: {
    label: "Attendance Rate",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-green-600",
    format: (v) => `${Number(v).toFixed(1)}%`,
  },
  absenteeism_rate: {
    label: "Absenteeism Rate",
    icon: <UserX className="h-4 w-4" />,
    color: "text-red-600",
    format: (v) => `${Number(v).toFixed(1)}%`,
  },
  payroll_cost: {
    label: "Payroll Cost",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-blue-600",
    format: (v) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  overtime_hours: {
    label: "Overtime Hours",
    icon: <Clock className="h-4 w-4" />,
    color: "text-purple-600",
    format: (v) => `${Number(v).toFixed(1)}h`,
  },
};

const ForecastCard = () => {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLatestForecasts();
        setForecasts(data);
      } catch (err) {
        console.error("[ForecastCard] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader>
        <CardContent><Skeleton className="h-48" /></CardContent>
      </Card>
    );
  }

  const grouped = forecasts.reduce((acc, f) => {
    if (!acc[f.metric_name]) acc[f.metric_name] = [];
    acc[f.metric_name].push(f);
    return acc;
  }, {} as Record<string, any[]>);

  const metrics = Object.keys(grouped).filter((k) => metricConfig[k]);

  if (metrics.length === 0) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold">Forecast Predictions</CardTitle>
            <CardDescription>AI-driven predictions for upcoming periods</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((name) => {
            const cfg = metricConfig[name];
            const latest = grouped[name][0];
            const confidencePct = Math.round((latest.confidence || 0) * 100);
            return (
              <div key={name} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <span className="text-sm font-medium">{cfg.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase">{latest.period_type}</span>
                </div>
                <p className="text-2xl font-bold mb-1">{cfg.format(latest.predicted_value)}</p>
                <div className="flex items-center gap-2">
                  <Progress value={confidencePct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-10 text-right">{confidencePct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastCard;
