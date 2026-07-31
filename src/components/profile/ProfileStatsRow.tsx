import { Film, Tv, Timer, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useFavoriteCount } from "@/hooks/useFavorites";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { useCountUp } from "@/components/profile/profileUtils";
import { getIntlLocale } from "@/lib/i18n";

export function ProfileStatsRow() {
  const { t, i18n } = useTranslation();
  const { history } = useWatchHistory();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: favCount = 0 } = useFavoriteCount(userId);
  const movies = new Set(history.map((h) => h.movie_slug)).size;
  const episodes = history.length;
  const hours = Math.round(history.reduce((sum, h) => sum + (h.progress_sec || 0), 0) / 3600);
  const m = useCountUp(movies);
  const e = useCountUp(episodes);
  const h = useCountUp(hours);
  const f = useCountUp(favCount);
  const locale = getIntlLocale(i18n.language);
  const stats = [
    { icon: <Film className="h-4 w-4" />, label: t("profile.stats.movies"), val: m },
    { icon: <Tv className="h-4 w-4" />, label: t("profile.stats.episodes"), val: e },
    { icon: <Timer className="h-4 w-4" />, label: t("profile.stats.hoursWatched"), val: h },
    { icon: <Heart className="h-4 w-4" />, label: t("profile.stats.favorites"), val: f },
  ];
  return (
    <div className="mt-5 flex flex-wrap items-stretch divide-x divide-white/10 rounded-xl border border-white/10 bg-black/30">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex min-w-[40%] flex-1 flex-col items-center justify-center gap-0.5 px-3 py-3 sm:min-w-0"
        >
          <div className="flex items-center gap-1.5 text-netflix-red">{s.icon}</div>
          <div className="text-lg font-bold tabular-nums text-white sm:text-xl">
            {s.val.toLocaleString(locale)}
          </div>
          <div className="text-[11px] text-netflix-muted sm:text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
