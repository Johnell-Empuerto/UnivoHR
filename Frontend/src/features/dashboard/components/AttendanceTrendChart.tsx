import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import React from "react";

interface AttendanceTrendChartProps {
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
    return (
      <Card className="p-2 border-border/50 shadow-sm">
        <p className="text-xs font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs text-muted-foreground">
            {entry.name}: {entry.value}
          </p>
        ))}
      </Card>
    );
  }
  return null;
};

const AttendanceTrendChart = ({ data }: AttendanceTrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-75">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} debounce={200}>
      <LineChart
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
          iconType="rect"
          wrapperStyle={{
            fontSize: "12px",
          }}
        />
        <Line
          type="monotone"
          dataKey="present"
          name="Present"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="late"
          name="Late"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="absent"
          name="Absent"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="leave"
          name="Leave"
          stroke="hsl(var(--chart-4))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--chart-4))", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default React.memo(AttendanceTrendChart);
