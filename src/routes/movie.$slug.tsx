import { useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { useFavorites } from "@/hooks/useFavorites";
import { movieService } from "@/services/movies";
import { useMoviesByType } from "@/hooks/useMovies";
import { MovieNotFound } from "@/components/common/MovieNotFound";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { MovieDetailTabs } from "@/components/movie/MovieDetailTabs";
import { DetailSkeleton } from "@/components/movie/DetailSkeleton";
import { MovieDetailHero } from "@/components/movie/MovieDetailHero";
import type { EpisodeProgressInfo } from "@/components/player/EpisodeList";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { RELATED_TYPE_MAP } from "@/constants/movie";
import { buildMovieDetailHead } from "@/lib/movie/movieDetailSeo";
import {
  HISTORY_REFETCH_TTL_MS,
  getHistoryRefetchedAt,
  markHistoryRefetched,
} from "@/utils/historyRefetchCache";
import { isWatchFinished } from "@/utils/watchProgress";

export const Route = createFileRoute("/movie/$slug")({
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.ensureQueryData({
        queryKey: queryKeys.movies.detail(params.slug),
        queryFn: () => movieService.getMovieDetail(params.slug),
        staleTime: CACHE_TTL.fiveMinutes,
      });
      return { movie: data?.movie ?? null };
    } catch {
      context.queryClient.removeQueries({ queryKey: queryKeys.movies.detail(params.slug) });
      return { movie: null };
    }
  },

  head: ({ params, loaderData }) => buildMovieDetailHead(params.slug, loaderData?.movie),

  component: MovieDetailPage,
});

function MovieDetailPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useMovieDetail(slug);
  const movie = data?.movie;
  const episodes = data?.episodes ?? [];
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(slug);
  const { history, getLastEpisode, refetch: refetchHistory } = useWatchHistory();
  const last = getLastEpisode(slug);

  // Đồng bộ lại progress từ backend mỗi khi mở trang phim
  // Có debounce + cache theo slug để tránh refetch khi user chuyển trang nhanh
  useEffect(() => {
    const last = getHistoryRefetchedAt(slug);
    if (last && Date.now() - last < HISTORY_REFETCH_TTL_MS) return;

    const timer = setTimeout(() => {
      markHistoryRefetched(slug);
      void refetchHistory();
    }, 300);
    return () => clearTimeout(timer);
  }, [slug, refetchHistory]);
  const relatedType = RELATED_TYPE_MAP[movie?.type ?? ""] ?? "phim-bo";
  const related = useMoviesByType(relatedType, 1);

  const canResume =
    !!last &&
    last.progress_sec >= 30 &&
    last.duration_sec > 0 &&
    !isWatchFinished(last.progress_sec, last.duration_sec);
  const totalEpisodes = Math.max(0, ...episodes.map((server) => server.server_data.length));
  const progressByEpisode = useMemo(() => {
    const out: Record<string, EpisodeProgressInfo> = {};
    for (const item of history) {
      if (item.movie_slug !== slug) continue;
      out[item.episode_name] = {
        ratio: item.duration_sec > 0 ? item.progress_sec / item.duration_sec : 0,
        finished: item.completed ?? isWatchFinished(item.progress_sec, item.duration_sec),
      };
    }
    return out;
  }, [history, slug]);
  const watchedEpisodeCount = Object.values(progressByEpisode).filter((p) => p.finished).length;

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !movie) {
    return <MovieNotFound slug={slug} />;
  }

  return (
    <div className="bg-netflix-black">
      <MovieDetailHero
        movie={movie}
        slug={slug}
        canResume={canResume}
        lastEpisode={last ?? undefined}
        watchedEpisodeCount={watchedEpisodeCount}
        totalEpisodes={totalEpisodes}
        isFav={isFav}
        onToggleFavorite={() => void toggleFavorite(movie)}
      />

      <MovieDetailTabs
        slug={slug}
        movie={movie}
        episodes={episodes}
        related={related.data?.items}
        relatedLoading={related.isLoading}
        progressByEpisode={progressByEpisode}
      />
    </div>
  );
}
