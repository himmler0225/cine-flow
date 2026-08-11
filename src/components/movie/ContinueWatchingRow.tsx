import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { getWatchProgressPercent, isWatchFinished } from "@/utils/watchProgress";
import { cn } from "@/lib/utils";

const arrowBtnClass =
  "absolute top-0 z-50 hidden h-full w-14 cursor-pointer items-center justify-center opacity-0 pointer-events-none transition-opacity group-hover/row:opacity-100 group-hover/row:pointer-events-auto hover:opacity-100 hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto md:flex";

function readScrollEdges(el: HTMLElement) {
  const maxScroll = el.scrollWidth - el.clientWidth;

  if (maxScroll <= 1) return { canGoPrev: false, canGoNext: false };

  return {
    canGoPrev: el.scrollLeft > 1,
    canGoNext: el.scrollLeft < maxScroll - 1,
  };
}

export function ContinueWatchingRow() {
  const { t } = useTranslation();

  const { history, deleteItem } = useWatchHistory();

  const ref = useRef<HTMLDivElement>(null);

  const [canGoPrev, setCanGoPrev] = useState(false);

  const [canGoNext, setCanGoNext] = useState(false);

  const items = useMemo(() => {
    const seen = new Set<string>();

    return history
      .filter((h) => {
        if (h.progress_sec < 10) return h.duration_sec === 0;

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

  const syncScrollEdges = useCallback(() => {
    const el = ref.current;

    if (!el) return;

    const { canGoPrev: prev, canGoNext: next } = readScrollEdges(el);

    setCanGoPrev(prev);

    setCanGoNext(next);
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;

    if (!el) return;

    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    syncScrollEdges();

    el.addEventListener("scroll", syncScrollEdges, { passive: true });

    const ro = new ResizeObserver(syncScrollEdges);

    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", syncScrollEdges);

      ro.disconnect();
    };
  }, [items, syncScrollEdges]);

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
    <section className="group/row relative py-4">
      <div className="mb-3 px-4 md:px-12">
        <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
          {t("movie.continueWatching")}
        </h2>
      </div>
      <div className="relative isolate">
        {canGoPrev ? (
          <button
            type="button"
            onClick={() => scroll(-1)}
            className={cn(
              arrowBtnClass,
              "left-0 bg-gradient-to-r from-netflix-black/95 via-netflix-black/70 to-transparent",
            )}
            aria-label={t("filters.prev")}
          >
            <ChevronLeft className="h-8 w-8 shrink-0 text-white drop-shadow-md" />
          </button>
        ) : null}
        <div
          ref={ref}
          className="scrollbar-hide flex gap-3 overflow-x-auto overflow-y-visible scroll-smooth px-4 pb-1 md:px-12"
        >
          {items.map((item) => {
            const isComputing = item.duration_sec <= 0;

            const pct = getWatchProgressPercent(item.progress_sec, item.duration_sec, {
              clamp: true,
            });

            const remainingSec = isComputing
              ? 0
              : Math.max(0, item.duration_sec - item.progress_sec);

            const tapParam = item.episode_index !== undefined ? item.episode_index + 1 : 1;

            const timeLabel = item.progress_sec >= 1 ? formatTime(item.progress_sec) : null;

            const remainingLabel = !isComputing ? formatRemaining(remainingSec) : null;

            return (
              <div
                key={item.movie_slug}
                className="group relative w-[140px] flex-none md:w-[180px]"
              >
                <Link
                  to="/watch/$slug"
                  params={{ slug: item.movie_slug }}
                  search={{
                    tap: tapParam,
                    server: item.server_index,
                    fromStart: false,
                  }}
                  className="block"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-netflix-surface">
                    <MoviePosterImg
                      slug={item.movie_slug}
                      thumbUrl={item.thumb_url}
                      alt={item.movie_name}
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-xl">
                        <Play className="h-5 w-5 fill-black text-black" />
                      </div>
                    </div>
                    {!isComputing && (
                      <span className="absolute right-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                        {pct}%
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                      <div
                        className="h-full bg-netflix-red transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5 px-0.5">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
                      {item.movie_name}
                    </p>
                    <p className="truncate text-[10px] text-white/70">
                      {item.episode_name}
                      {timeLabel ? ` · ${t("toast.resumeFrom", { time: timeLabel })}` : ""}
                      {remainingLabel ? ` · ${remainingLabel}` : ""}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => void deleteItem(item.movie_slug, item.episode_name)}
                  aria-label={t("movie.removeFromContinue")}
                  className="absolute right-1 top-1 z-10 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        {canGoNext ? (
          <button
            type="button"
            onClick={() => scroll(1)}
            className={cn(
              arrowBtnClass,
              "right-0 bg-gradient-to-l from-netflix-black/95 via-netflix-black/70 to-transparent",
            )}
            aria-label={t("filters.next")}
          >
            <ChevronRight className="h-8 w-8 shrink-0 text-white drop-shadow-md" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
