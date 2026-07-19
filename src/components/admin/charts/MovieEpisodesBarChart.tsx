import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartAxisStroke, chartGridStroke, chartTooltipStyle } from "./chartTheme";

interface EpRow {
  name: string;
  value: number;
}

export default function MovieEpisodesBarChart({ data }: { data: EpRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 24)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis type="number" stroke={chartAxisStroke} fontSize={10} />
        <YAxis type="category" dataKey="name" stroke={chartAxisStroke} fontSize={10} width={80} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="value" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
}
