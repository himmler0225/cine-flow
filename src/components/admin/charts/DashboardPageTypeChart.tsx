import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_PIE_COLORS, chartTooltipStyle } from "./chartTheme";

interface Slice {
  name: string;
  value: number;
}

export default function DashboardPageTypeChart({ data }: { data: Slice[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(e: { name: string; percent: number }) =>
            `${e.name} ${(e.percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_PIE_COLORS[i % CHART_PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
