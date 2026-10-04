import { memo, useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { getImageProxyUrl, getImageUrl } from "@/lib/movie/movieImages";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { qualityBadgeClass, langBadgeClass } from "@/components/movie/MetaBadges";

interface Props {
  movie: MovieListItem;
  className?: string;
  priority?: boolean;
}

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
      queryFn: () => moviesApi.getMovieDetail(movie.slug),
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
          "relative origin-center rounded-md bg-netflix-surface ring-1 ring-white/5",
          "transition-[transform,box-shadow] duration-300 ease-out",
          "group-hover:z-20 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-black/40",
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
              src={getImageUrl(movie.poster_url || movie.thumb_url)}
              alt={t("movie.posterAlt", { title })}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              {...(priority ? { fetchPriority: "high" as const } : {})}
              width={300}
              height={450}
              onLoad={() => setImgLoaded(true)}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                imgLoaded ? "opacity-100" : "opacity-0",
              )}
              onError={(e) => {
                const img = e.currentTarget;

                if (img.dataset.fallback !== "1") {
                  img.dataset.fallback = "1";

                  img.src = getImageProxyUrl(movie.poster_url || movie.thumb_url);
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
                    qualityBadgeClass(movie.quality),
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

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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

      <div className="mt-2 min-w-0">
        <Link to="/movie/$slug" params={{ slug: movie.slug }} className="block min-w-0">
          <p className="line-clamp-1 text-xs font-medium text-netflix-text/90 transition-colors hover:text-white sm:text-sm">
            {movie.name}
          </p>
        </Link>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-medium">
          {movie.lang && (
            <span
              className={cn(
                "truncate rounded-sm px-1.5 py-[2px]",
                "text-[9px] font-semibold tracking-wide",
                langBadgeClass(movie.lang),
              )}
            >
              {movie.lang}
            </span>
          )}

          {movie.lang && movie.year && <span className="text-white/20">•</span>}
          {movie.year && <span className="shrink-0 text-netflix-muted">{movie.year}</span>}
        </div>
      </div>
    </div>
  );
}

export const MovieCard = memo(MovieCardImpl);
