import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Play, Check, Calendar, Clock, ArrowLeft, Heart, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DetailPoster } from "@/components/movie/DetailPoster";
import { MovieDescription } from "@/components/movie/MovieDescription";
import { WatchlistMenu } from "@/components/movie/WatchlistMenu";
import { copyMovieLink } from "@/lib/seo/share";
import { MovieRating } from "@/components/movie/MovieRating";
import { MetaBadges } from "@/components/movie/MetaBadges";
import { movieActionButtonVariants } from "@/components/movie/movieActionButton";
import { TrailerButton } from "@/components/movie/TrailerButton";
import { formatTime } from "@/utils/formatTime";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import type { MovieDetail } from "@/types/movie";
import type { WatchHistoryItem } from "@/utils/localHistory";

const primaryActionClass = movieActionButtonVariants({
  intent: "primary",
  className: "gap-2.5 px-8",
});

const secondaryActionClass = movieActionButtonVariants({ intent: "secondary" });

interface MovieDetailHeroProps {
  movie: MovieDetail;
  slug: string;
  canResume: boolean;
  lastEpisode: WatchHistoryItem | undefined;
  watchedEpisodeCount: number;
  totalEpisodes: number;
  isFav: boolean;
  onToggleFavorite: () => void;
}

export function MovieDetailHero({
  movie,
  slug,
  canResume,
  lastEpisode,
  watchedEpisodeCount,
  totalEpisodes,
  isFav,
  onToggleFavorite,
}: MovieDetailHeroProps) {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const router = useRouter();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();

      return;
    }

    void navigate({ to: "/" });
  };

  const iconBtn = (active?: boolean) =>
    cn(
      "inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 transition-colors",
      active
        ? "bg-netflix-red text-white ring-netflix-red"
        : "bg-white/5 text-white ring-white/15 hover:bg-white/10",
    );

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden">
        <DetailPoster
          poster={movie.poster_url}
          thumb={movie.thumb_url}
          alt=""
          variant="backdrop"
          priority
          className="h-full w-full scale-110 object-cover blur-2xl brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/80 to-netflix-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-24 md:px-12 md:pt-28">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-netflix-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="grid gap-8 pb-12 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="mx-auto w-full max-w-[240px] shrink-0 md:mx-0 lg:max-w-[280px]">
            <DetailPoster
              poster={movie.poster_url}
              thumb={movie.thumb_url}
              alt={movie.name}
              priority
              className="aspect-[2/3] w-full rounded-xl object-cover shadow-2xl ring-1 ring-white/15"
            />
          </div>

          <div className="flex min-w-0 flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
              {movie.name}
            </h1>
            {movie.origin_name && (
              <p className="mt-1 text-base text-netflix-muted md:text-lg">{movie.origin_name}</p>
            )}

            <div className="mt-3">
              <MovieRating slug={slug} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <MetaBadges
                quality={movie.quality}
                lang={movie.lang}
                episode={
                  movie.episode_current
                    ? `${movie.episode_current}${movie.episode_total ? ` / ${movie.episode_total}` : ""}`
                    : undefined
                }
              />
              {movie.year && (
                <span className="inline-flex items-center gap-1 text-netflix-muted">
                  <Calendar className="h-4 w-4" /> {movie.year}
                </span>
              )}
              {movie.time && (
                <span className="inline-flex items-center gap-1 text-netflix-muted">
                  <Clock className="h-4 w-4" /> {movie.time}
                </span>
              )}
            </div>

            {movie.category && movie.category.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.category.map((c) => (
                  <Link
                    key={c.slug}
                    to="/genre/$slug"
                    params={{ slug: c.slug }}
                    className="rounded border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:border-netflix-red/50 hover:bg-white/10"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.content && <MovieDescription html={movie.content} />}

            {totalEpisodes > 0 && watchedEpisodeCount > 0 && (
              <div className="mt-5 max-w-xl rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-white">{t("movie.watchProgress")}</span>
                  <span className="text-netflix-muted">
                    {t("movie.episodesWatchedProgress", {
                      watched: watchedEpisodeCount,
                      total: totalEpisodes,
                    })}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-netflix-red transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, (watchedEpisodeCount / totalEpisodes) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="relative z-20 mt-6 flex flex-wrap items-center gap-2.5">
              {canResume && lastEpisode ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/watch/$slug",
                        params: { slug },
                        search: {
                          tap: (lastEpisode.episode_index ?? 0) + 1,
                          server: lastEpisode.server_index ?? 0,
                          fromStart: false,
                        },
                      })
                    }
                    className={primaryActionClass}
                  >
                    <Play className="h-5 w-5 fill-current" />
                    {t("movie.resumeWatching", { time: formatTime(lastEpisode.progress_sec) })}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/watch/$slug",
                        params: { slug },
                        search: { tap: 1, server: 0, fromStart: true },
                      })
                    }
                    className={secondaryActionClass}
                  >
                    {t("movie.startFromBeginning")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/watch/$slug",
                      params: { slug },
                      search: { tap: 1, server: 0, fromStart: true },
                    })
                  }
                  className={primaryActionClass}
                >
                  <Play className="h-5 w-5 fill-current" /> {t("movie.watchNow")}
                </button>
              )}

              {movie.trailer_url && (
                <TrailerButton
                  trailerUrl={movie.trailer_url}
                  movieName={movie.name}
                  className={secondaryActionClass}
                />
              )}

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  className={iconBtn(isFav)}
                  aria-label={
                    isFav
                      ? t("movie.removeFavoriteAria", { name: movie.name })
                      : t("movie.addFavoriteAria", { name: movie.name })
                  }
                >
                  {isFav ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                </button>
              )}
              {isAuthenticated && <WatchlistMenu slug={slug} movieName={movie.name} iconOnly />}
              <button
                type="button"
                onClick={() => void copyMovieLink(slug, movie.name)}
                className={iconBtn()}
                aria-label={t("movie.shareAria")}
                title={t("movie.shareTitle")}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
