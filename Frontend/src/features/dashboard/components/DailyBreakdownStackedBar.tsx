import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";

interface DailyBreakdownStackedBarProps {
  data: Array<{
    day: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0,
    );

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span>Total:</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function DailyBreakdownStackedBar({
  data,
}: DailyBreakdownStackedBarProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Daily Breakdown
          </CardTitle>
          <CardDescription>Attendance composition per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-75">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Daily Attendance Breakdown
        </CardTitle>
        <CardDescription>
          Total workforce and attendance composition per day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} debounce={200}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Bar
              dataKey="present"
              name="Present"
              stackId="a"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="late"
              name="Late"
              stackId="a"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="absent"
              name="Absent"
              stackId="a"
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="leave"
              name="Leave"
              stackId="a"
              fill="hsl(var(--chart-4))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Each bar shows total employees and how they are distributed across
            attendance statuses
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default React.memo(DailyBreakdownStackedBar);
