import { memo, useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { getImageUrl, getImageWebp } from "@/lib/movie/movieImages";
import { movieService } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface Props {
  movie: MovieListItem;
  className?: string;
  /** Đánh dấu thẻ này thuộc vùng LCP để ưu tiên tải ảnh */
  priority?: boolean;
}

const qualityClass = (q?: string) => {
  const v = (q || "").toUpperCase();
  if (v === "CAM" || v === "TS") return "bg-netflix-red text-white";
  if (v === "FHD" || v === "4K") return "bg-amber-400 text-black";
  if (v === "HD") return "bg-amber-300 text-black";
  return "bg-white/90 text-black";
};

const langClass = (l?: string) => {
  if (!l) return "bg-white/20 text-white";
  if (l.toLowerCase().includes("vietsub")) return "bg-blue-600 text-white";
  if (l.toLowerCase().includes("lồng")) return "bg-emerald-600 text-white";
  if (l.toLowerCase().includes("thuyết")) return "bg-purple-600 text-white";
  return "bg-white/20 text-white";
};

function MovieCardImpl({ movie, className, priority = false }: Props) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [imgLoaded, setImgLoaded] = useState(false);
  const isFav = isFavorite(movie.slug);
  const epLabel =
    movie.episode_current && movie.episode_current.toLowerCase().includes("hoàn")
      ? movie.episode_current
      : movie.episode_current && movie.episode_total
        ? `${movie.episode_current}/${movie.episode_total}`
        : movie.episode_current;
  const title = `${movie.name}${movie.year ? ` (${movie.year})` : ""}`;

  const prefetchDetail = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.movies.detail(movie.slug),
      queryFn: () => movieService.getMovieDetail(movie.slug),
      staleTime: CACHE_TTL.fiveMinutes,
    });
  }, [queryClient, movie.slug]);

  return (
    <div
      className={cn("group relative", className)}
      onMouseEnter={prefetchDetail}
      onFocus={prefetchDetail}
    >
      <div
        className={cn(
          "relative origin-center rounded-md bg-netflix-surface shadow-lg ring-1 ring-white/5",
          "transition-[transform,box-shadow,ring-color] duration-300 ease-out",
          "group-hover:z-20 group-hover:scale-[1.04] group-hover:shadow-2xl group-hover:shadow-netflix-red/25 group-hover:ring-2 group-hover:ring-netflix-red/60",
        )}
      >
        <Link
          to="/movie/$slug"
          params={{ slug: movie.slug }}
          aria-label={t("movie.viewDetailAria", { title })}
          className="block overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red focus-visible:ring-offset-2 focus-visible:ring-offset-netflix-black"
        >
          <div className="relative aspect-[2/3] w-full bg-netflix-surface">
            {!imgLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-netflix-surface via-white/5 to-netflix-surface" />
            )}
            <img
              src={getImageWebp(movie.poster_url || movie.thumb_url)}
              alt={t("movie.posterAlt", { title })}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              {...(priority ? { fetchPriority: "high" as const } : {})}
              width={300}
              height={450}
              onLoad={() => setImgLoaded(true)}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-500 group-hover:scale-105",
                imgLoaded ? "opacity-100" : "opacity-0",
              )}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallback !== "1") {
                  img.dataset.fallback = "1";
                  img.src = getImageUrl(movie.poster_url || movie.thumb_url);
                } else if (img.dataset.fallback === "1" && movie.thumb_url) {
                  img.dataset.fallback = "2";
                  img.src = getImageUrl(movie.thumb_url);
                } else {
                  setImgLoaded(true);
                }
              }}
            />

            <div className="absolute left-2 right-2 top-2 flex items-start justify-between gap-1">
              {movie.quality && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
                    qualityClass(movie.quality),
                  )}
                >
                  {movie.quality}
                </span>
              )}
              {epLabel && (
                <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {epLabel}
                </span>
              )}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="mb-1.5 flex flex-wrap items-center gap-1">
                {movie.lang && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      langClass(movie.lang),
                    )}
                  >
                    {movie.lang}
                  </span>
                )}
                {movie.year && (
                  <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white">
                    {movie.year}
                  </span>
                )}
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                {movie.name}
              </h3>
              {movie.origin_name && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-netflix-muted">
                  {movie.origin_name}
                </p>
              )}
            </div>
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[2/3]">
          <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
            <Link
              to="/watch/$slug"
              params={{ slug: movie.slug }}
              className="rounded-full bg-white p-1.5 text-black shadow hover:bg-netflix-red hover:text-white"
              aria-label={t("movie.watchNow")}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => void toggleFavorite(movie)}
                className={cn(
                  "rounded-full p-1.5 shadow transition-colors",
                  isFav
                    ? "bg-netflix-red text-white"
                    : "bg-black/70 text-white hover:bg-netflix-red",
                )}
                aria-label={t("movie.addFavorite")}
              >
                <Heart className={cn("h-3.5 w-3.5", isFav && "fill-current")} />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 line-clamp-1 text-xs text-netflix-text/90 sm:hidden">{movie.name}</p>
    </div>
  );
}

export const MovieCard = memo(MovieCardImpl);
