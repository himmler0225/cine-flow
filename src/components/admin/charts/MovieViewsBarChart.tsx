import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxisStroke, chartGridStroke, chartTooltipStyle } from "./chartTheme";

interface DayRow {
  date: string;
  views: number;
}

export default function MovieViewsBarChart({ data }: { data: DayRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke={chartAxisStroke} fontSize={10} />
        <YAxis stroke={chartAxisStroke} fontSize={10} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="views" fill="#e50914" />
      </BarChart>
    </ResponsiveContainer>
  );
}
