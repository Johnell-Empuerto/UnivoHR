import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AbsentTrendChartProps {
  data: Array<{ month: string; absent: number }>;
}

const chartConfig = {
  absent: {
    label: "Absent Days",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function AbsentTrendChart({ data }: AbsentTrendChartProps) {
  const [timeRange, setTimeRange] = React.useState("12m");

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    let monthsToShow = 12;
    if (timeRange === "6m") monthsToShow = 6;
    if (timeRange === "3m") monthsToShow = 3;

    return data.slice(-monthsToShow);
  }, [data, timeRange]);

  const chartData = filteredData.map((item) => ({
    date: item.month,
    absent: item.absent,
  }));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-lg font-semibold">Absent Trend</CardTitle>
          <CardDescription>Monthly absenteeism analysis</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-40 rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 12 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="12m" className="rounded-lg">
              Last 12 months
            </SelectItem>
            <SelectItem value="6m" className="rounded-lg">
              Last 6 months
            </SelectItem>
            <SelectItem value="3m" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-75 w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-absent)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} className="stroke-border/50" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    return date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="absent"
              type="natural"
              fill="url(#fillAbsent)"
              stroke="var(--color-absent)"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default React.memo(AbsentTrendChart);
