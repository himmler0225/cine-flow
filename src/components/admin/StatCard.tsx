import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getIntlLocale } from "@/lib/i18n";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  change?: number | null;
  loading?: boolean;
  format?: (n: number) => string;
}

export function StatCard({ icon, label, value, change, loading, format }: Props) {
  const { t, i18n } = useTranslation();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading) return;
    let raf = 0;
    const start = performance.now();
    const duration = 600;
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, loading]);

  const locale = getIntlLocale(i18n.language);
  const fmt = format ?? ((n: number) => n.toLocaleString(locale));
  const trend = change == null ? 0 : change;
  const trendColor = trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-zinc-500";
  const TrendIcon = trend > 0 ? ArrowUp : trend < 0 ? ArrowDown : Minus;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-netflix-red/15 text-netflix-red">
          {icon}
        </div>
        {change != null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-400">{label}</p>
      {loading ? (
        <div className="mt-1 h-8 w-24 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-white">{fmt(display)}</p>
      )}
      {change != null && (
        <p className="mt-0.5 text-[11px] text-zinc-500">{t("admin.common.comparedToPrev")}</p>
      )}
    </div>
  );
}
