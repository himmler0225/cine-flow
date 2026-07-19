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
    { icon: <Film className="h-5 w-5" />, label: t("profile.stats.movies"), val: m },
    { icon: <Tv className="h-5 w-5" />, label: t("profile.stats.episodes"), val: e },
    { icon: <Timer className="h-5 w-5" />, label: t("profile.stats.hoursWatched"), val: h },
    { icon: <Heart className="h-5 w-5" />, label: t("profile.stats.favorites"), val: f },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl border border-gray-700/50 bg-black/30 p-3 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-netflix-red">
            {s.icon}
          </div>
          <div className="text-xl font-bold text-white">{s.val.toLocaleString(locale)}</div>
          <div className="text-xs text-gray-400">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
