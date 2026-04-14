import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Simplified interface - now just receives insights from backend
interface InsightsPanelProps {
  insights: Array<{
    type: "warning" | "success" | "info" | "trend-up" | "trend-down";
    message: string;
  }>;
}

const iconMap = {
  success: <TrendingUp className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
  "trend-up": <TrendingUp className="h-4 w-4" />,
  "trend-down": <TrendingDown className="h-4 w-4" />,
  info: <Calendar className="h-4 w-4" />,
};

const colorMap = {
  success:
    "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 text-green-600 dark:text-green-400",
  warning:
    "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400",
  "trend-up":
    "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  "trend-down":
    "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
            <CardDescription>
              Smart analysis of your attendance data
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all hover:shadow-sm ${colorMap[insight.type]}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{iconMap[insight.type]}</div>
                <p className="text-sm flex-1">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default InsightsPanel;
