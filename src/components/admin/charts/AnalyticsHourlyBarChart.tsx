import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartAxisStroke, chartGridStroke, chartTooltipStyle } from "./chartTheme";

interface HourRow {
  hour: string;
  views: number;
}

export default function AnalyticsHourlyBarChart({
  data,
  peakHour,
}: {
  data: HourRow[];
  peakHour?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="hour" stroke={chartAxisStroke} fontSize={10} />
        <YAxis stroke={chartAxisStroke} fontSize={10} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="views">
          {data.map((h, i) => (
            <Cell key={i} fill={h.hour === peakHour ? "#e50914" : "rgba(229,9,20,0.5)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
