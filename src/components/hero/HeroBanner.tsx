import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Info, Plus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { getImageProxyUrl, getImageUrl } from "@/lib/movie/movieImages";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { MetaBadges } from "@/components/movie/MetaBadges";
import { TrailerButton } from "@/components/movie/TrailerButton";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/utils/stripHtml";
import { UI_DELAY_MS } from "@/constants/timing";

interface Props {
  movies: MovieListItem[];
}

export function HeroBanner({ movies }: Props) {
  const { t } = useTranslation();

  const [idx, setIdx] = useState(0);

  const [firstLoaded, setFirstLoaded] = useState(false);

  const [paused, setPaused] = useState(false);

  const featured = useMemo(() => movies.slice(0, 6), [movies]);

  const { isFavorite, toggleFavorite } = useFavorites();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const currentSlug = featured[idx]?.slug ?? "";

  const isFav = isFavorite(currentSlug);

  const detail = useMovieDetail(currentSlug);

  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(idx)) return prev;

      const next = new Set(prev);

      next.add(idx);

      return next;
    });
  }, [idx]);

  useEffect(() => {
    if (featured.length === 0) return;

    if (idx >= featured.length) setIdx(0);
  }, [featured.length, idx]);

  useEffect(() => {
    if (featured.length === 0 || paused) return;

    if (!firstLoaded) return;

    const nextTimer = window.setTimeout(
      () => setIdx((i) => (i + 1) % featured.length),
      UI_DELAY_MS.heroSlide,
    );

    return () => window.clearTimeout(nextTimer);
  }, [featured.length, idx, firstLoaded, paused]);

  const firstSrc = featured[0] ? getImageUrl(featured[0].thumb_url || featured[0].poster_url) : "";

  if (featured.length === 0) {
    return (
      <div className="relative h-[80vh] min-h-[480px] w-full overflow-hidden bg-netflix-surface">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-netflix-black via-netflix-dark to-netflix-surface" />
        <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end gap-4 px-4 pb-20 md:px-12 md:pb-32">
          <div className="h-12 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="flex gap-3">
            <div className="h-11 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-11 w-32 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const m = featured[idx];

  const movieDetail = detail.data?.movie;

  const description = stripHtml(movieDetail?.content) || m.origin_name;

  return (
    <div
      className="relative h-[80vh] min-h-[480px] w-full overflow-hidden bg-netflix-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {firstSrc && <link rel="preload" as="image" href={firstSrc} fetchPriority="high" />}

      {!firstLoaded && firstSrc && (
        <div
          aria-hidden
          className="absolute inset-0 scale-110 blur-2xl opacity-60"
          style={{
            backgroundImage: `url(${firstSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {featured.map((slide, i) => {
        if (!visited.has(i)) return null;

        const isCurrent = i === idx;

        return (
          <div
            key={slide.slug}
            aria-hidden={!isCurrent}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: isCurrent ? 1 : 0 }}
          >
            <img
              src={getImageUrl(slide.thumb_url || slide.poster_url)}
              alt=""
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center"
              onLoad={() => {
                if (i === 0) setFirstLoaded(true);
              }}
              onError={(e) => {
                const img = e.currentTarget;

                if (i === 0) setFirstLoaded(true);

                const step = img.dataset.fallback || "0";

                if (step === "0") {
                  img.dataset.fallback = "1";

                  img.src = getImageProxyUrl(slide.thumb_url || slide.poster_url);
                } else if (step === "1" && slide.poster_url) {
                  img.dataset.fallback = "2";

                  img.src = getImageUrl(slide.poster_url);
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-netflix-black/90 via-netflix-black/40 to-transparent" />
          </div>
        );
      })}

      <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end px-4 pb-20 md:px-12 md:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={m.slug + "-text"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-shadow-hero mb-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
              {m.name}
            </h1>
            <MetaBadges
              quality={m.quality}
              lang={m.lang}
              year={m.year}
              episode={m.episode_current}
              className="mb-4"
            />
            <p className="mb-6 line-clamp-3 max-w-xl text-base text-netflix-text/90 md:text-lg">
              {description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/watch/$slug"
                params={{ slug: m.slug }}
                className="inline-flex items-center gap-2 rounded bg-white px-6 py-2.5 font-semibold text-black transition-colors hover:bg-white/85"
              >
                <Play className="h-5 w-5 fill-current" /> {t("movie.watchNow")}
              </Link>
              <Link
                to="/movie/$slug"
                params={{ slug: m.slug }}
                className="inline-flex items-center gap-2 rounded bg-white/20 px-6 py-2.5 font-semibold text-white backdrop-blur transition-colors hover:bg-white/30"
              >
                <Info className="h-5 w-5" /> {t("movie.details")}
              </Link>
              {movieDetail?.trailer_url && (
                <TrailerButton
                  trailerUrl={movieDetail.trailer_url}
                  movieName={m.name}
                  className="inline-flex items-center gap-2 rounded bg-white/20 px-6 py-2.5 font-semibold text-white backdrop-blur transition-colors hover:bg-white/30"
                />
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    const m = featured[idx];

                    if (m) void toggleFavorite(m);
                  }}
                  aria-pressed={isFav}
                  aria-label={
                    isFav
                      ? t("movie.removeFavoriteAria", { name: m.name })
                      : t("movie.addFavoriteAria", { name: m.name })
                  }
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-4 py-2.5 font-semibold backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    isFav
                      ? "bg-netflix-red text-white hover:bg-netflix-red-hover"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {isFav ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={t("hero.goToSlide", { index: i + 1 })}
            className={cn(
              "h-1 rounded-full transition-all",
              i === idx ? "w-8 bg-netflix-red" : "w-4 bg-white/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}
