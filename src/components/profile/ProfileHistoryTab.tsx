import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { ProfileConfirmModal } from "@/components/profile/ProfileConfirmModal";
import { getWatchProgressPercent } from "@/utils/watchProgress";

export function ProfileHistoryTab() {
  const { t } = useTranslation();

  const { history, deleteItem, clearAll: clearWatchHistory } = useWatchHistory();

  const [q, setQ] = useState("");

  const [confirmClear, setConfirmClear] = useState(false);

  const entries = useMemo(() => {
    if (!q.trim()) return history;

    const s = q.toLowerCase();

    return history.filter((e) => e.movie_name.toLowerCase().includes(s));
  }, [history, q]);

  const groups = useMemo(() => {
    const g: Record<string, typeof entries> = {};

    entries.forEach((e) => {
      const d = new Date(e.watched_at);

      let key = t("profile.groupOlder");

      if (isToday(d)) key = t("profile.groupToday");
      else if (isYesterday(d)) key = t("profile.groupYesterday");
      else {
        const diff = differenceInDays(new Date(), d);

        if (diff <= 7) key = t("profile.groupDaysAgo", { count: diff });
        else if (diff <= 30) key = t("profile.groupThisMonth");
      }

      (g[key] ||= []).push(e);
    });

    return g;
  }, [entries, t]);

  const clearAll = async () => {
    await clearWatchHistory();

    setConfirmClear(false);

    toast.success(t("toast.historyCleared"));
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Clock className="h-16 w-16 text-netflix-muted" />
        <h3 className="text-xl font-semibold text-white">{t("profile.noHistory")}</h3>
        <p className="text-sm text-netflix-muted">{t("profile.historyEmptyDesc")}</p>
        <Link
          to="/"
          className="mt-3 rounded-lg bg-netflix-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t("profile.watchMoviesNow")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-netflix-muted">
          {t("profile.episodesWatched", { count: history.length })}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-netflix-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("profile.searchMovies")}
              className="rounded-md border border-white/10 bg-netflix-dark py-1.5 pl-8 pr-3 text-sm text-white"
            />
          </div>
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1 rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" /> {t("profile.clearAll")}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([label, items]) => (
          <div key={label}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-netflix-muted">
              — {label} —
            </h3>
            <ul className="space-y-2">
              {items.map((e) => {
                const pct = getWatchProgressPercent(e.progress_sec, e.duration_sec);

                const tap = e.episode_index !== undefined ? e.episode_index + 1 : 1;

                return (
                  <li
                    key={`${e.movie_slug}-${e.episode_name}`}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
                  >
                    <Link to="/movie/$slug" params={{ slug: e.movie_slug }} className="shrink-0">
                      <MoviePosterImg
                        slug={e.movie_slug}
                        thumbUrl={e.thumb_url}
                        alt=""
                        className="h-20 w-14 rounded object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/movie/$slug"
                        params={{ slug: e.movie_slug }}
                        className="line-clamp-1 font-semibold text-white hover:text-netflix-red"
                      >
                        {e.movie_name}
                      </Link>
                      <p className="text-xs text-netflix-muted">{e.episode_name}</p>
                      <div className="mt-2 h-[3px] w-full overflow-hidden rounded bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-netflix-red"
                        />
                      </div>
                      <p className="mt-1 text-xs text-netflix-muted">
                        {t("profile.atTime", {
                          time: format(new Date(e.watched_at), "HH:mm"),
                        })}
                      </p>
                    </div>
                    <Link
                      to="/watch/$slug"
                      params={{ slug: e.movie_slug }}
                      search={{ tap, server: e.server_index }}
                      className="rounded-md bg-netflix-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      ▶ {t("profile.continue")}
                    </Link>
                    <button
                      onClick={() => void deleteItem(e.movie_slug, e.episode_name)}
                      className="rounded-md p-2 text-netflix-muted hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <ProfileConfirmModal
        open={confirmClear}
        title={t("profile.clearHistoryConfirm")}
        message={t("profile.clearHistoryIrreversible")}
        confirmText={t("profile.clearAll")}
        onConfirm={() => void clearAll()}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
