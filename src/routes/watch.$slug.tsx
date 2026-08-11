import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Heart } from "lucide-react";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { EpisodeList } from "@/components/player/EpisodeList";
import { WatchPageSkeleton } from "@/components/player/WatchPageSkeleton";
import { MovieNotFound } from "@/components/common/MovieNotFound";
import { WatchPartyButton } from "@/components/watchparty/WatchPartyButton";
import { ShareButton } from "@/components/movie/ShareButton";
import { MovieComments } from "@/components/movie/MovieComments";
import { MovieRating } from "@/components/movie/MovieRating";
import { MovieDescription } from "@/components/movie/MovieDescription";
import { MovieRow } from "@/components/movie/MovieRow";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { invalidateHistoryRefetchCache } from "@/utils/historyRefetchCache";
import { useWatchPage } from "@/hooks/useWatchPage";
import { useFavorites } from "@/hooks/useFavorites";
import { useMoviesByType } from "@/hooks/useMovies";
import { RELATED_TYPE_MAP } from "@/constants/movie";
import { getImageUrl } from "@/lib/movie/movieImages";
import { t } from "@/lib/i18n";
import { queryKeys } from "@/constants/queryKeys";
import { moviesApi } from "@/services/movies";
import { prettifySlug } from "@/utils/prettifySlug";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { stripHtml } from "@/utils/stripHtml";
import { EXTERNAL_URLS } from "@/constants/urls";
import { CACHE_TTL } from "@/constants/timing";

const searchSchema = z.object({
  tap: fallback(z.number().int().min(1), 1).default(1),
  server: fallback(z.number().int().min(0), 0).default(0),
  fromStart: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/watch/$slug")({
  validateSearch: zodValidator(searchSchema),
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.ensureQueryData({
        queryKey: queryKeys.movies.detail(params.slug),
        queryFn: () => moviesApi.getMovieDetail(params.slug),
        staleTime: CACHE_TTL.tenMinutes,
      });

      return { movie: data?.movie ?? null };
    } catch {
      return { movie: null };
    }
  },
  head: ({ params, loaderData }) => {
    const movie = loaderData?.movie ?? null;

    const name = movie?.name ?? prettifySlug(params.slug);

    const url = `${getSiteUrl()}/watch/${params.slug}`;

    const image = movie ? getImageUrl(movie.thumb_url || movie.poster_url) : null;

    const description = stripHtml(movie?.content) || t("seo.watchTitle", { slug: name });

    const breadcrumb = {
      "@context": EXTERNAL_URLS.schemaContext,
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: getSiteUrl() },
        {
          "@type": "ListItem",
          position: 2,
          name,
          item: `${getSiteUrl()}/movie/${params.slug}`,
        },
        { "@type": "ListItem", position: 3, name: t("nav.watch") || "Xem", item: url },
      ],
    };

    const videoLd: Record<string, unknown> = {
      "@context": EXTERNAL_URLS.schemaContext,
      "@type": "VideoObject",
      name,
      description,
      thumbnailUrl: image || undefined,
      uploadDate: movie?.modified?.time,
      contentUrl: url,
      embedUrl: url,
      inLanguage: movie?.lang,
      genre: movie?.category?.map((c) => c.name),
      duration: movie?.time,
      isFamilyFriendly: false,
    };

    return {
      meta: [
        { title: t("seo.watchTitle", { slug: name }) },
        { name: "description", content: description },
        { property: "og:type", content: "video.other" },
        { property: "og:title", content: t("seo.watchTitle", { slug: name }) },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "robots", content: "noindex, follow" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(videoLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumb) },
      ],
    };
  },
  component: WatchPage,
});

function WatchPage() {
  const { t: tr } = useTranslation();

  const { slug } = Route.useParams();

  const { tap, server, fromStart } = Route.useSearch();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const navigate = useNavigate();

  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();

      return;
    }

    void navigate({ to: "/movie/$slug", params: { slug } });
  };

  const {
    movie,
    servers,
    serverIdx,
    setServerIdx,
    episodeIdx,
    setEpisodeIdx,
    currentServer,
    currentEp,
    initialTime,
    isLoading,
    hasNext,
    nextEp,
    autoAdvanceSecondsLeft,
    cancelAutoAdvance,
    confirmAutoAdvance,
    handleProgress,
    handleLiveTime,
    handleEnded,
    handleNextEpisode,
    handleResumeApplied,
    tryAlternateSource,
    progressByEpisode,
  } = useWatchPage(slug, tap, server, fromStart);

  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = isFavorite(slug);

  const relatedType = RELATED_TYPE_MAP[movie?.type ?? ""] ?? "phim-bo";

  const related = useMoviesByType(relatedType, 1);

  useEffect(() => {
    invalidateHistoryRefetchCache(slug);
  }, [slug, tap, server]);

  if (isLoading) {
    return <WatchPageSkeleton />;
  }

  if (!movie) {
    return <MovieNotFound slug={slug} />;
  }

  if (!currentEp) {
    return (
      <MovieNotFound
        slug={slug}
        title={tr("movie.episodeNotFound")}
        message={tr("movie.episodeNotFoundDesc")}
      />
    );
  }

  const currentProgress = progressByEpisode[currentEp.name];

  const watchPercent = currentProgress
    ? Math.min(100, Math.max(0, Math.round(currentProgress.ratio * 100)))
    : 0;

  return (
    <div className="min-h-screen bg-netflix-black">
      <div className="relative bg-black pt-14 lg:pt-16">
        <div className="absolute left-3 top-[calc(3.5rem+0.5rem)] z-20 lg:left-6 lg:top-[calc(4rem+0.75rem)]">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-sm text-white/85 backdrop-blur-md ring-1 ring-white/10 transition-colors hover:bg-black/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {tr("common.back")}
          </button>
        </div>

        <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          <div className="min-w-0 bg-black">
            <VideoPlayer
              key={`${slug}-${currentEp.slug || currentEp.name}-${serverIdx}`}
              src={currentEp.link_m3u8 || ""}
              embed={currentEp.link_embed || undefined}
              poster={getImageUrl(movie.thumb_url || movie.poster_url)}
              initialTime={initialTime}
              onEnded={handleEnded}
              onProgress={handleProgress}
              onLiveTime={handleLiveTime}
              onResumeApplied={handleResumeApplied}
              onNextEpisode={hasNext ? handleNextEpisode : undefined}
              onError={tryAlternateSource}
              autoAdvanceSecondsLeft={autoAdvanceSecondsLeft}
              nextEpisodeName={nextEp?.name}
              onPlayNextNow={confirmAutoAdvance}
              onCancelAutoAdvance={cancelAutoAdvance}
            />
          </div>

          <aside className="flex flex-col border-t border-white/10 bg-netflix-black lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">{tr("movie.episodeList")}</h2>
              <span className="text-xs tabular-nums text-netflix-muted">{watchPercent}%</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <EpisodeList
                servers={servers}
                serverIdx={serverIdx}
                episodeIdx={episodeIdx}
                progressByEpisode={progressByEpisode}
                variant="tile"
                hideEpisodeHeading
                onSelect={(s, e) => {
                  setServerIdx(s);

                  setEpisodeIdx(e);
                }}
              />
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-netflix-red transition-all"
                  style={{ width: `${watchPercent}%` }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-8 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white md:text-2xl">{movie.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-netflix-red">
                {currentEp.name} · {currentServer?.server_name}
              </p>
              <MovieRating slug={slug} compact />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleFavorite(movie)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 transition-colors",
                isFav
                  ? "bg-netflix-red text-white ring-netflix-red"
                  : "bg-white/5 text-white ring-white/15 hover:bg-white/10",
              )}
              aria-label={
                isFav
                  ? tr("movie.removeFavoriteAria", { name: movie.name })
                  : tr("movie.addFavoriteAria", { name: movie.name })
              }
            >
              <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
            </button>
            <ShareButton slug={slug} movieName={movie.name} variant="compact" />
            <WatchPartyButton
              movieSlug={slug}
              movieName={movie.name}
              thumb={movie.thumb_url || movie.poster_url}
              episodeName={currentEp.name}
              serverIndex={serverIdx}
              className="h-10"
            />
          </div>
        </div>

        {movie.content && <MovieDescription html={movie.content} className="mt-5 max-w-3xl" />}
      </div>

      <div className="border-t border-white/10 pt-4">
        <MovieRow
          title={tr("movie.recommendedForYou")}
          movies={related.data?.items?.filter((m) => m.slug !== slug)}
          isLoading={related.isLoading}
          href={{ to: "/catalog/$slug", params: { slug: relatedType } }}
        />
      </div>

      {isAuthenticated && (
        <section className="mt-6 border-t border-white/10 px-4 pb-8 pt-8 md:px-12">
          <h2 className="mb-4 text-lg font-semibold text-white">
            {tr("movie.commentsFor", { episode: currentEp.name })}
          </h2>
          <MovieComments slug={slug} movieName={movie.name} episodeName={currentEp.name} />
        </section>
      )}
      {!isAuthenticated && <div className="pb-8" />}
    </div>
  );
}
