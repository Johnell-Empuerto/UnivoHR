import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  color?: "green" | "yellow" | "red" | "blue" | "default";
};

const getColorClasses = (color: string) => {
  switch (color) {
    case "green":
      return "from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800";
    case "yellow":
      return "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    case "red":
      return "from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800";
    case "blue":
      return "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800";
    default:
      return "border-border/50";
  }
};

const StatsCard = ({
  title,
  value,
  icon,
  trend,
  color = "default",
}: StatsCardProps) => {
  const isPositive = trend && trend > 0;

  return (
    <Card
      className={`bg-linear-to-br ${getColorClasses(color)} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isPositive
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {Math.abs(trend)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  from last month
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
