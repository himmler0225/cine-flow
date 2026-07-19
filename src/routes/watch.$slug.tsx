import { createFileRoute, Link } from "@tanstack/react-router";
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
import { movieActionButtonVariants } from "@/components/movie/movieActionButton";
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
import { movieService } from "@/services/movies";
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
        queryFn: () => movieService.getMovieDetail(params.slug),
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
    handleProgress,
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

  // Bắt đầu phát / đổi tập -> bỏ cache để lần tới mở /movie/$slug refetch ngay
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
    <div className="min-h-screen bg-netflix-black pt-20">
      <div className="px-4 md:px-12">
        <Link
          to="/movie/$slug"
          params={{ slug }}
          className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-wide text-netflix-muted hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {tr("common.back")}
        </Link>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <VideoPlayer
              key={`${currentEp.link_embed || currentEp.link_m3u8}-${fromStart ? "start" : initialTime}`}
              src={currentEp.link_embed ? "" : currentEp.link_m3u8}
              embed={currentEp.link_embed}
              poster={getImageUrl(movie.thumb_url || movie.poster_url)}
              initialTime={initialTime}
              onEnded={handleEnded}
              onProgress={handleProgress}
              onResumeApplied={handleResumeApplied}
              onNextEpisode={hasNext ? handleNextEpisode : undefined}
              onError={tryAlternateSource}
            />
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white md:text-3xl">{movie.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-medium text-netflix-red">
                    {currentEp.name} • {currentServer?.server_name}
                  </p>
                  <MovieRating slug={slug} compact />
                </div>
                {movie.content && (
                  <MovieDescription html={movie.content} className="mt-3 max-w-2xl" />
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ShareButton slug={slug} movieName={movie.name} variant="hero" />
                <button
                  type="button"
                  onClick={() => void toggleFavorite(movie)}
                  className={cn(
                    movieActionButtonVariants({ intent: isFav ? "primary" : "secondary" }),
                  )}
                  aria-label={
                    isFav
                      ? tr("movie.removeFavoriteAria", { name: movie.name })
                      : tr("movie.addFavoriteAria", { name: movie.name })
                  }
                >
                  <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
                  {isFav ? tr("movie.favorited") : tr("movie.addFavorite")}
                </button>
                <WatchPartyButton
                  movieSlug={slug}
                  movieName={movie.name}
                  thumb={movie.thumb_url || movie.poster_url}
                  episodeName={currentEp.name}
                  serverIndex={serverIdx}
                />
              </div>
            </div>
          </div>
          <aside className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start">
            <h2 className="mb-4 text-lg font-semibold text-white">{tr("movie.episodeList")}</h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
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
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-netflix-muted">{tr("movie.watchProgress")}</span>
                <span className="font-semibold text-white">{watchPercent}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-netflix-red transition-all"
                  style={{ width: `${watchPercent}%` }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-4">
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
