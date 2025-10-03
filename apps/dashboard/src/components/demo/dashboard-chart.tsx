"use client";


import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// More realistic dashboard data
const chartData = [
  { date: "2024-01-01", requests: 1200, errors: 15 },
  { date: "2024-01-02", requests: 1350, errors: 8 },
  { date: "2024-01-03", requests: 980, errors: 12 },
  { date: "2024-01-04", requests: 1580, errors: 22 },
  { date: "2024-01-05", requests: 1720, errors: 18 },
  { date: "2024-01-06", requests: 1450, errors: 9 },
  { date: "2024-01-07", requests: 1680, errors: 14 },
  { date: "2024-01-08", requests: 2100, errors: 25 },
  { date: "2024-01-09", requests: 890, errors: 6 },
  { date: "2024-01-10", requests: 1320, errors: 11 },
  { date: "2024-01-11", requests: 1650, errors: 19 },
  { date: "2024-01-12", requests: 1480, errors: 13 },
  { date: "2024-01-13", requests: 1820, errors: 21 },
  { date: "2024-01-14", requests: 1290, errors: 16 },
  { date: "2024-01-15", requests: 1560, errors: 10 },
  { date: "2024-01-16", requests: 1780, errors: 17 },
  { date: "2024-01-17", requests: 2250, errors: 28 },
  { date: "2024-01-18", requests: 1940, errors: 23 },
  { date: "2024-01-19", requests: 1670, errors: 14 },
  { date: "2024-01-20", requests: 1420, errors: 12 },
  { date: "2024-01-21", requests: 1580, errors: 15 },
  { date: "2024-01-22", requests: 1730, errors: 18 },
  { date: "2024-01-23", requests: 1890, errors: 20 },
  { date: "2024-01-24", requests: 2180, errors: 26 },
  { date: "2024-01-25", requests: 1650, errors: 16 },
  { date: "2024-01-26", requests: 1420, errors: 11 },
  { date: "2024-01-27", requests: 1980, errors: 24 },
  { date: "2024-01-28", requests: 1760, errors: 19 },
  { date: "2024-01-29", requests: 1540, errors: 13 },
  { date: "2024-01-30", requests: 2020, errors: 22 },
];

const chartConfig = {
  requests: {
    label: "Requests",
    color: "var(--chart-1)",
  },
  errors: {
    label: "Errors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DashboardChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full h-[200px]">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-requests)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-requests)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-errors)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-errors)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="errors"
          type="natural"
          fill="url(#fillErrors)"
          stroke="var(--color-errors)"
          stackId="a"
        />
        <Area
          dataKey="requests"
          type="natural"
          fill="url(#fillRequests)"
          stroke="var(--color-requests)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}