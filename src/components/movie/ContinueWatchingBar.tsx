import { useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Play, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { formatTime } from "@/utils/formatTime";
import { getWatchProgressPercent, isWatchFinished } from "@/utils/watchProgress";

const HIDDEN_PREFIXES = ["/watch/", "/watch-party/", "/admin"];

export function ContinueWatchingBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { history, deleteItem } = useWatchHistory();

  const item = useMemo(() => {
    return (
      history.find(
        (h) =>
          h.duration_sec > 0 &&
          h.progress_sec >= 10 &&
          !isWatchFinished(h.progress_sec, h.duration_sec),
      ) ?? null
    );
  }, [history]);

  const hidden =
    !item ||
    HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p)) ||
    location.pathname === "/";

  if (hidden) return null;

  const pct = getWatchProgressPercent(item.progress_sec, item.duration_sec);
  const tapParam = item.episode_index !== undefined ? item.episode_index + 1 : 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-netflix-black/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link
          to="/watch/$slug"
          params={{ slug: item.movie_slug }}
          search={{ tap: tapParam, server: item.server_index ?? 0, fromStart: false }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded">
            <MoviePosterImg
              slug={item.movie_slug}
              thumbUrl={item.thumb_url}
              alt={item.movie_name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-4 w-4 fill-white text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{item.movie_name}</p>
            <p className="truncate text-xs text-netflix-muted">
              {item.episode_name} · {formatTime(item.progress_sec)} ({pct}%)
            </p>
            <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-netflix-red" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => void deleteItem(item.movie_slug, item.episode_name)}
          className="shrink-0 rounded-full p-2 text-netflix-muted hover:bg-white/10 hover:text-white"
          aria-label={t("movie.hideContinueWatching")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
