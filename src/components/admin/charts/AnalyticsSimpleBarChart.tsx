import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxisStroke, chartGridStroke, chartTooltipStyle } from "./chartTheme";

interface DayRow {
  date: string;
  value: number;
}

export default function AnalyticsSimpleBarChart({
  data,
  fill = "#a855f7",
  height = 200,
}: {
  data: DayRow[];
  fill?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke={chartAxisStroke} fontSize={10} />
        <YAxis stroke={chartAxisStroke} fontSize={10} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="value" fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  );
}
