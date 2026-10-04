import type { SyntheticEvent } from "react";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMoviesByType } from "@/hooks/useMovies";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { getImageProxyUrl, getImageUrl } from "@/lib/movie/movieImages";
import { MetaBadges } from "@/components/movie/MetaBadges";
import type { MovieListItem } from "@/types/movie";
import { cn } from "@/lib/utils";

interface RankedItem {
  m: MovieListItem;
  score: number;
}

const RANK_BADGE_CLASS: Record<number, string> = {
  1: "bg-gradient-to-b from-amber-300 to-amber-500 text-black",
  2: "bg-gradient-to-b from-slate-200 to-slate-400 text-black",
  3: "bg-gradient-to-b from-orange-300 to-orange-600 text-black",
};

export function useTop10(): {
  items: RankedItem[];
  isLoading: boolean;
} {
  const a = useMoviesByType("phim-bo", 1);

  const b = useMoviesByType("phim-le", 1);

  const c = useMoviesByType("hoat-hinh", 1);

  const items = useMemo<RankedItem[]>(() => {
    const all: MovieListItem[] = [
      ...(a.data?.items ?? []),
      ...(b.data?.items ?? []),
      ...(c.data?.items ?? []),
    ];

    const seen = new Set<string>();

    const scored = all
      .filter((m) => {
        if (seen.has(m.slug)) {
          return false;
        }

        seen.add(m.slug);

        return !!m.poster_url || !!m.thumb_url;
      })
      .map((m) => {
        const q = (m.quality ?? "").toUpperCase();

        const qScore = q === "4K" ? 5 : q === "FHD" ? 4 : q === "HD" ? 3 : 1;

        const yearScore = m.year ? Math.max(0, m.year - 2015) : 0;

        const score = qScore * 10 + yearScore;

        return {
          m,
          score,
        };
      });

    scored.sort((x, y) => y.score - x.score);

    return scored.slice(0, 10);
  }, [a.data, b.data, c.data]);

  return {
    items,
    isLoading: a.isLoading || b.isLoading || c.isLoading,
  };
}

function posterSrc(m: MovieListItem) {
  return getImageUrl(m.poster_url || m.thumb_url);
}

function handlePosterError(e: SyntheticEvent<HTMLImageElement>, m: MovieListItem) {
  const img = e.currentTarget;

  if (img.dataset.f !== "1") {
    img.dataset.f = "1";

    img.src = getImageProxyUrl(m.poster_url || m.thumb_url);
  }
}

export function TopRanking() {
  const { t } = useTranslation();

  const { items, isLoading } = useTop10();

  const queryClient = useQueryClient();

  const prefetch = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.movies.detail(slug),
      queryFn: () => moviesApi.getMovieDetail(slug),
      staleTime: CACHE_TTL.fiveMinutes,
    });
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 animate-pulse rounded-full bg-white/10" />

            <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
          </div>

          <div className="mt-2 ml-3 h-4 w-64 animate-pulse rounded bg-white/5" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0">
              <div className="aspect-[2/3] animate-pulse rounded-lg bg-white/5" />

              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[72px] animate-pulse items-center gap-3 rounded-lg border border-white/5 bg-white/[0.025] px-3"
            >
              <div className="h-5 w-7 rounded bg-white/5" />

              <div className="h-14 w-10 shrink-0 rounded-md bg-white/5" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 rounded bg-white/5" />

                <div className="mt-2 h-3 w-1/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const top4 = items.slice(0, 4);

  const rest = items.slice(4);

  return (
    <section className="relative py-8 ms-2">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-red-600" />

            <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
              {t("movie.topRanking")}
            </h2>
          </div>

          <p className="mt-1 pl-3 text-sm text-white/45">{t("movie.top10Subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
        {top4.map((it, i) => {
          const rank = i + 1;

          return (
            <Link
              key={it.m.slug}
              to="/movie/$slug"
              params={{
                slug: it.m.slug,
              }}
              onMouseEnter={() => prefetch(it.m.slug)}
              onFocus={() => prefetch(it.m.slug)}
              aria-label={t("movie.topRankAria", {
                rank,
                name: it.m.name,
              })}
              className="group relative min-w-0"
            >
              <span
                className={cn(
                  "absolute left-2 top-2 z-20 rounded",
                  "px-1.5 py-0.5 text-[10px]",
                  "font-black tracking-wide shadow-lg",
                  RANK_BADGE_CLASS[rank],
                )}
              >
                TOP {rank}
              </span>

              <div
                className={cn(
                  "relative aspect-[2/3] overflow-hidden rounded-lg",
                  "bg-white/5 ring-1 ring-white/10",
                  "transition-all duration-500",
                  "group-hover:-translate-y-1",
                  "group-hover:ring-white/20",
                  rank === 1 && "shadow-[0_15px_40px_rgba(220,38,38,0.15)]",
                )}
              >
                <img
                  src={posterSrc(it.m)}
                  alt={it.m.name}
                  loading={rank === 1 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                  onError={(e) => handlePosterError(e, it.m)}
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-2 pt-12">
                  <MetaBadges quality={it.m.quality} year={it.m.year} size="sm" />
                </div>
              </div>

              <p className="mt-2 line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-red-400">
                {it.m.name}
              </p>
            </Link>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rest.map((it, i) => {
            const rank = i + 5;

            return (
              <li key={it.m.slug}>
                <Link
                  to="/movie/$slug"
                  params={{
                    slug: it.m.slug,
                  }}
                  onMouseEnter={() => prefetch(it.m.slug)}
                  onFocus={() => prefetch(it.m.slug)}
                  aria-label={t("movie.topRankAria", {
                    rank,
                    name: it.m.name,
                  })}
                  className={cn(
                    "group flex h-[72px] items-center gap-3",
                    "rounded-lg border border-white/5",
                    "bg-white/[0.025] px-3",
                    "transition-all duration-300",
                    "hover:border-white/10",
                    "hover:bg-white/[0.06]",
                  )}
                >
                  <span className="w-7 shrink-0 text-center text-lg font-black leading-none text-white/25 transition-colors group-hover:text-white/70">
                    {String(rank).padStart(2, "0")}
                  </span>

                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
                    <img
                      src={posterSrc(it.m)}
                      alt={it.m.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => handlePosterError(e, it.m)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-red-400">
                      {it.m.name}
                    </p>

                    <div className="mt-1.5">
                      <MetaBadges quality={it.m.quality} year={it.m.year} size="sm" />
                    </div>
                  </div>

                  <span className="hidden shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/60 sm:block">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
