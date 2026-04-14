import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import React from "react";

type Props = {
  data: {
    present: number;
    late: number;
    absent: number;
    on_leave: number;
  };
};

const AttendanceChart = ({ data }: Props) => {
  const chartData = [
    {
      name: "Attendance",
      Present: Number(data.present),
      Late: Number(data.late),
      Absent: Number(data.absent),
      Leave: Number(data.on_leave),
    },
  ];

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

  return (
    <ResponsiveContainer width="100%" height={300} debounce={200}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        barCategoryGap={20}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="name"
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
        <Bar
          dataKey="Present"
          fill="hsl(var(--chart-1))"
          radius={[6, 6, 0, 0]}
        />

        <Bar dataKey="Late" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />

        <Bar
          dataKey="Absent"
          fill="hsl(var(--chart-3))"
          radius={[6, 6, 0, 0]}
        />

        <Bar dataKey="Leave" fill="hsl(var(--chart-4))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(AttendanceChart);
