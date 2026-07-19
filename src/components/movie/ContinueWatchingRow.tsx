import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { X, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { getWatchProgressPercent, isWatchFinished } from "@/utils/watchProgress";

export function ContinueWatchingRow() {
  const { t } = useTranslation();
  const { history, deleteItem } = useWatchHistory();

  const items = useMemo(() => {
    const seen = new Set<string>();
    return history
      .filter((h) => {
        // Đã xem >= 10s và chưa kết thúc (hoặc chưa biết duration)
        if (h.progress_sec < 10) return h.duration_sec === 0; // mới mở, chưa có progress -> vẫn cho hiện
        if (isWatchFinished(h.progress_sec, h.duration_sec)) return false;
        return true;
      })
      .filter((h) => {
        if (seen.has(h.movie_slug)) return false;
        seen.add(h.movie_slug);
        return true;
      })
      .slice(0, 12);
  }, [history]);

  if (items.length === 0) return null;

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
  };

  const formatRemaining = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    if (s < 60) return `còn ${s}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `còn ${h}h${m > 0 ? ` ${m}m` : ""}`;
    return `còn ${m}m`;
  };

  return (
    <section className="px-4 md:px-12">
      <h2 className="mb-3 text-lg font-semibold text-white">{t("movie.continueWatching")}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isComputing = item.duration_sec <= 0;
          const pct = getWatchProgressPercent(item.progress_sec, item.duration_sec, {
            clamp: true,
          });
          const remainingSec = isComputing ? 0 : Math.max(0, item.duration_sec - item.progress_sec);
          const tapParam = item.episode_index !== undefined ? item.episode_index + 1 : 1;
          const timeLabel = item.progress_sec >= 1 ? formatTime(item.progress_sec) : null;
          const remainingLabel = !isComputing ? formatRemaining(remainingSec) : null;

          return (
            <div key={item.movie_slug} className="group relative w-52 flex-none sm:w-60">
              <Link
                to="/watch/$slug"
                params={{ slug: item.movie_slug }}
                search={{ tap: tapParam, server: item.server_index, fromStart: false }}
                className="block overflow-hidden rounded-md bg-netflix-surface"
              >
                <div className="relative aspect-video overflow-hidden">
                  <MoviePosterImg
                    slug={item.movie_slug}
                    thumbUrl={item.thumb_url}
                    alt={item.movie_name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <span className="line-clamp-1">{item.episode_name}</span>
                    {timeLabel && (
                      <>
                        <span className="text-white/70">•</span>
                        <span className="tabular-nums">{timeLabel}</span>
                      </>
                    )}
                    {remainingLabel && (
                      <>
                        <span className="text-white/70">•</span>
                        <span className="tabular-nums text-netflix-red/90">{remainingLabel}</span>
                      </>
                    )}
                  </span>
                  {!isComputing && (
                    <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                      {pct}%
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-xl">
                      <Play className="h-3.5 w-3.5 fill-black text-black" />
                      <span className="text-xs font-semibold text-black tabular-nums">
                        {timeLabel ? t("toast.resumeFrom", { time: timeLabel }) : "Tiếp tục xem"}
                        {remainingLabel ? ` · ${remainingLabel}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="mb-1.5 line-clamp-1 text-xs font-medium text-white">
                      {item.movie_name}
                    </p>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-netflix-red transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => void deleteItem(item.movie_slug, item.episode_name)}
                aria-label={t("movie.removeFromContinue")}
                className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
