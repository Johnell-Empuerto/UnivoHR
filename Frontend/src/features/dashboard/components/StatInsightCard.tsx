import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo, memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnomalyTrend } from "../hooks/useAnomalyTrend";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 border-border/50 shadow-sm">
        <p className="text-xs font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </Card>
    );
  }
  return null;
};

const StatInsightCard = () => {
  const { data: rawData = [], isLoading } = useAnomalyTrend(30);

  const { data, total, highTotal, trend } = useMemo(() => {
    const d = rawData.map((item: any) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
    const t = d.reduce((s: number, item: any) => s + item.total, 0);
    const h = d.reduce((s: number, item: any) => s + item.high, 0);
    const tr = d.length >= 2 ? d[d.length - 1].total - d[0].total : 0;
    return { data: d, total: t, highTotal: h, trend: tr };
  }, [rawData]);

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader>
        <CardContent><Skeleton className="h-48" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Anomaly Detection Trend
            </CardTitle>
            <CardDescription>Daily anomaly detection count over the last 30 days</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-destructive">{highTotal}</p>
              <p className="text-xs text-muted-foreground">High Sev.</p>
            </div>
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={trend >= 0 ? "text-red-500" : "text-green-500"}>
                {Math.abs(trend)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200} debounce={200}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--chart-1))" fill="url(#colorTotal)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(StatInsightCard);
