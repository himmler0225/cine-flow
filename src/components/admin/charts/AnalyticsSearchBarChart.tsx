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

interface SearchRow {
  keyword: string;
  searches: number;
}

export default function AnalyticsSearchBarChart({ data }: { data: SearchRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 22)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis type="number" stroke={chartAxisStroke} fontSize={10} />
        <YAxis
          type="category"
          dataKey="keyword"
          stroke={chartAxisStroke}
          fontSize={10}
          width={120}
        />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="searches" fill="#e50914">
          {data.map((_, i) => (
            <Cell key={i} fill={`rgba(229,9,20,${0.4 + (i / 20) * 0.6})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
