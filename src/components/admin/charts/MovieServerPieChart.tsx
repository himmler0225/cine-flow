import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_PIE_COLORS, chartTooltipStyle } from "./chartTheme";

interface Slice {
  name: string;
  value: number;
}

export default function MovieServerPieChart({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} label>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PIE_COLORS[i % CHART_PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
