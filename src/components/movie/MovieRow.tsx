import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { MovieCard } from "./MovieCard";
import { getImageUrl } from "@/lib/movie/movieImages";
import { cn } from "@/lib/utils";
import { UI_DELAY_MS } from "@/constants/timing";

interface Props {
  title?: string;
  movies?: MovieListItem[];
  isLoading?: boolean;
  href?: {
    to: string;
    params?: Record<string, string>;
  };
}

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

export function MovieRow({ title, movies, isLoading, href }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
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
  }, [movies, isLoading, syncScrollEdges]);
  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const run = () => {
      movies.slice(0, 8).forEach((m) => {
        const url = getImageUrl(m.poster_url || m.thumb_url);
        if (!url) return;
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      });
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(run);
    } else {
      setTimeout(run, UI_DELAY_MS.deferredRowWork);
    }
  }, [movies]);
  return (
    <section className="group/row relative py-4">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-12">
        {href && title ? (
          <Link
            to={href.to}
            params={href.params}
            className="group/title flex min-w-0 items-center gap-1.5 text-lg font-semibold tracking-tight text-white transition-colors hover:text-white/90 md:text-xl"
          >
            <span className="truncate">{title}</span>
            <ChevronRight className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-visible/title:opacity-100" />
          </Link>
        ) : title ? (
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{title}</h2>
        ) : (
          <span />
        )}
        {href ? (
          <Link
            to={href.to}
            params={href.params}
            className="shrink-0 text-sm font-medium text-netflix-muted transition-colors hover:text-white"
          >
            {t("common.viewAll")}
          </Link>
        ) : null}
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
          className={cn(
            "scrollbar-hide flex gap-2 overflow-x-auto overflow-y-visible scroll-smooth px-4 py-6 md:gap-3 md:px-12",
          )}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] w-[140px] flex-none animate-pulse rounded-md bg-netflix-surface md:w-[180px]"
                />
              ))
            : movies?.map((m) => (
                <div key={m.slug} className="w-[140px] flex-none overflow-visible md:w-[180px]">
                  <MovieCard movie={m} />
                </div>
              ))}
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
