import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMoviesByType } from "@/hooks/useMovies";
import { movieService } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { getImageUrl, getImageWebp } from "@/lib/movie/movieImages";
import type { MovieListItem } from "@/types/movie";
import { cn } from "@/lib/utils";

interface RankedItem {
  m: MovieListItem;
  score: number;
  /** Hiển thị "K" như ảnh mẫu — số liệu thảo luận giả lập từ score */
  views: number;
}

export function useTop10(): { items: RankedItem[]; isLoading: boolean } {
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
    const top = scored.slice(0, 10);
    // Phân bổ "views" giảm dần kiểu Zipf cho đẹp mắt
    const base = 65;
    return top.map((s, i) => ({
      ...s,
      views: Math.round((base / (i * 0.55 + 1)) * 100) / 100,
    }));
  }, [a.data, b.data, c.data]);

  return { items, isLoading: a.isLoading || b.isLoading || c.isLoading };
}

function formatK(n: number) {
  return `${n.toFixed(2).replace(".", ",")}K`;
}

export function TopRanking() {
  const { t } = useTranslation();
  const { items, isLoading } = useTop10();
  const queryClient = useQueryClient();

  const prefetch = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.movies.detail(slug),
      queryFn: () => movieService.getMovieDetail(slug),
      staleTime: CACHE_TTL.fiveMinutes,
    });
  };

  if (isLoading) {
    return (
      <section className="px-4 md:px-12 mb-10">
        <div className="mb-6 h-9 w-64 animate-pulse rounded bg-white/5" />
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </section>
    );
  }
  if (items.length === 0) return null;

  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const maxRest = Math.max(...rest.map((r) => r.views), 1);

  return (
    <section className="relative mx-4 mb-10 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0a0a0a] via-[#0e0a07] to-[#0a0a0a] px-4 py-6 md:mx-12 md:px-8 md:py-8">
      {/* Núi trang trí mờ ở nền */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(255,140,40,0.6), transparent), repeating-linear-gradient(135deg, transparent 0 40px, rgba(255,255,255,0.04) 40px 80px)",
          maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative mb-6 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white md:text-4xl">
              TOP <span className="text-netflix-red">10</span>
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 md:text-base">
              {t("movie.top10Movies")}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/40 md:text-sm">{t("movie.top10Subtitle")}</p>
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-gradient-to-r from-netflix-red to-red-700 px-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-netflix-red/30">
          <TrendingUp className="h-3.5 w-3.5" /> {t("search.trending")}
        </span>
      </div>

      {/* Top 3 */}
      <div className="relative grid grid-cols-3 gap-3 md:gap-8">
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
              className="group relative flex flex-col items-center"
            >
              {/* Số khổng lồ outline phía sau */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 select-none font-black leading-none text-transparent transition-transform duration-500 group-hover:scale-105 md:-top-4"
                style={{
                  WebkitTextStroke: "1.5px rgba(255,255,255,0.18)",
                  fontSize: "clamp(120px, 22vw, 240px)",
                }}
              >
                {rank}
              </span>

              {/* Poster card */}
              <div
                className={cn(
                  "relative z-10 aspect-square w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all duration-300",
                  "group-hover:-translate-y-1 group-hover:ring-netflix-red/60 group-hover:shadow-netflix-red/30",
                  rank === 1 && "shadow-netflix-red/20",
                )}
              >
                <img
                  src={getImageWebp(it.m.poster_url || it.m.thumb_url)}
                  alt={it.m.name}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.f !== "1") {
                      img.dataset.f = "1";
                      img.src = getImageUrl(it.m.poster_url || it.m.thumb_url);
                    }
                  }}
                />
                {/* NEW ribbon cho #1 */}
                {rank === 1 && (
                  <span className="absolute right-0 top-3 z-10 bg-netflix-red px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white shadow-md md:text-xs">
                    {t("movie.newBadge")}
                  </span>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                {/* Số liệu + tên */}
                <div className="absolute inset-x-0 bottom-0 p-2 text-center md:p-4">
                  <p className="text-lg font-black leading-none text-white drop-shadow-lg md:text-3xl">
                    {formatK(it.views)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-white/90 md:mt-2 md:text-sm">
                    {it.m.name}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Danh sách 4 → 10 */}
      <ol className="relative mt-6 space-y-1 md:mt-8">
        {rest.map((it, idx) => {
          const rank = idx + 4;
          const pct = Math.max(8, Math.round((it.views / maxRest) * 100));
          return (
            <li key={it.m.slug}>
              <Link
                to="/movie/$slug"
                params={{ slug: it.m.slug }}
                onMouseEnter={() => prefetch(it.m.slug)}
                onFocus={() => prefetch(it.m.slug)}
                className="group grid grid-cols-[28px_44px_1fr_auto] items-center gap-3 border-b border-dashed border-white/5 py-2.5 transition-colors hover:bg-white/[0.03] md:grid-cols-[40px_56px_1fr_auto] md:gap-4 md:py-3"
              >
                <span className="text-base font-bold tabular-nums text-white/70 group-hover:text-netflix-red md:text-lg">
                  {String(rank).padStart(2, "0")}
                </span>
                <div className="relative h-12 w-11 overflow-hidden rounded-md ring-1 ring-white/10 md:h-14 md:w-14">
                  <img
                    src={getImageWebp(it.m.thumb_url || it.m.poster_url)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.f !== "1") {
                        img.dataset.f = "1";
                        img.src = getImageUrl(it.m.thumb_url || it.m.poster_url);
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-netflix-red md:text-base">
                    {it.m.name}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-netflix-red transition-[width] duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-white/80 md:text-base">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  {formatK(it.views)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
