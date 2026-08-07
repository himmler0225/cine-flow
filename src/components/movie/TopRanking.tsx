import type { SyntheticEvent } from "react";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMoviesByType } from "@/hooks/useMovies";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { getImageUrl, getImageWebp } from "@/lib/movie/movieImages";
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
        if (seen.has(m.slug)) return false;
        seen.add(m.slug);
        return !!m.poster_url || !!m.thumb_url;
      })
      .map((m) => {
        const q = (m.quality ?? "").toUpperCase();
        const qScore = q === "4K" ? 5 : q === "FHD" ? 4 : q === "HD" ? 3 : 1;
        const yearScore = m.year ? Math.max(0, m.year - 2015) : 0;
        const score = qScore * 10 + yearScore;
        return { m, score };
      });

    scored.sort((x, y) => y.score - x.score);
    return scored.slice(0, 10);
  }, [a.data, b.data, c.data]);

  return { items, isLoading: a.isLoading || b.isLoading || c.isLoading };
}

function posterSrc(m: MovieListItem) {
  return getImageWebp(m.poster_url || m.thumb_url);
}

function handlePosterError(e: SyntheticEvent<HTMLImageElement>, m: MovieListItem) {
  const img = e.currentTarget;
  if (img.dataset.f !== "1") {
    img.dataset.f = "1";
    img.src = getImageUrl(m.poster_url || m.thumb_url);
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
      <section className="mb-10 px-4 md:px-12">
        <div className="mb-5 h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="flex items-end gap-3 md:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] flex-1 animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
        <div className="mt-4 space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const top3 = items.slice(0, 3);
  const rest = items.slice(3);

  return (
    <section className="mb-10 px-4 md:px-12">
      <div className="mb-5 flex items-baseline gap-2">
        <h2 className="text-xl font-bold text-white md:text-2xl">{t("movie.topRanking")}</h2>
        <span className="text-sm text-netflix-muted">{t("movie.top10Subtitle")}</span>
      </div>

      <div className="flex items-end gap-3 md:gap-4">
        {top3.map((it, i) => {
          const rank = i + 1;
          return (
            <Link
              key={it.m.slug}
              to="/movie/$slug"
              params={{ slug: it.m.slug }}
              onMouseEnter={() => prefetch(it.m.slug)}
              onFocus={() => prefetch(it.m.slug)}
              aria-label={t("movie.topRankAria", { rank, name: it.m.name })}
              className={cn(
                "group relative min-w-0 flex-1",
                rank === 1 && "z-10 sm:order-2 sm:-translate-y-3 sm:scale-[1.06]",
                rank === 2 && "sm:order-1",
                rank === 3 && "sm:order-3",
              )}
            >
              <span
                className={cn(
                  "absolute left-1.5 top-1.5 z-10 rounded px-1.5 py-0.5 text-[10px] font-black tracking-wide shadow",
                  RANK_BADGE_CLASS[rank],
                )}
              >
                TOP{rank}
              </span>
              <div className="relative aspect-[2/3] overflow-hidden rounded-md ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-0.5">
                <img
                  src={posterSrc(it.m)}
                  alt={it.m.name}
                  loading={rank === 1 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => handlePosterError(e, it.m)}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-10">
                  <MetaBadges quality={it.m.quality} year={it.m.year} size="sm" />
                </div>
              </div>
              <p className="mt-1.5 line-clamp-1 text-xs font-semibold text-white md:text-sm">
                {it.m.name}
              </p>
            </Link>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className="mt-4 divide-y divide-white/5 overflow-hidden rounded-lg bg-white/[0.02] ring-1 ring-white/5">
          {rest.map((it, i) => {
            const rank = i + 4;
            return (
              <li key={it.m.slug}>
                <Link
                  to="/movie/$slug"
                  params={{ slug: it.m.slug }}
                  onMouseEnter={() => prefetch(it.m.slug)}
                  onFocus={() => prefetch(it.m.slug)}
                  aria-label={t("movie.topRankAria", { rank, name: it.m.name })}
                  className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="w-4 shrink-0 text-center text-sm font-bold text-netflix-muted">
                    {rank}
                  </span>
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded ring-1 ring-white/10">
                    <img
                      src={posterSrc(it.m)}
                      alt={it.m.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={(e) => handlePosterError(e, it.m)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-white">{it.m.name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <MetaBadges quality={it.m.quality} year={it.m.year} size="sm" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
