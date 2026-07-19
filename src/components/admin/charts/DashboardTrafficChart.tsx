import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { chartAxisStroke, chartGridStroke, chartTooltipStyle } from "./chartTheme";

interface Point {
  date: string;
  views: number;
  watches: number;
}

export default function DashboardTrafficChart({ data }: { data: Point[] }) {
  const { t } = useTranslation();

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke={chartAxisStroke} fontSize={11} />
        <YAxis stroke={chartAxisStroke} fontSize={11} />
        <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#fff" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#3b82f6"
          strokeWidth={2}
          name={t("admin.dashboard.chartPageViews")}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="watches"
          stroke="#e50914"
          strokeWidth={2}
          name={t("admin.dashboard.chartMovieViews")}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
