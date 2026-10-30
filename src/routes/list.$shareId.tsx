import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BookmarkPlus, ListX } from "lucide-react";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { moviesApi } from "@/services/movies";
import { watchlistApi } from "@/services/platform/watchlist.service";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { useAuthStore } from "@/store/authStore";
import { useWatchlistStore } from "@/store/watchlistStore";
import type { MovieListItem } from "@/types/movie";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/list/$shareId")({
  head: () => ({ meta: [{ title: t("watchlist.sharedTitle") }] }),
  component: SharedListPage,
});

function SharedListPage() {
  const { t } = useTranslation();

  const { shareId } = Route.useParams();

  const navigate = useNavigate();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const requestAuth = useAuthStore((s) => s.requestAuth);

  const {
    data: list,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shared-watchlist", shareId],
    queryFn: () => watchlistApi.shared(shareId),
    staleTime: CACHE_TTL.fiveMinutes,
    retry: 0,
  });

  const details = useQueries({
    queries: (list?.slugs ?? []).slice(0, 100).map((slug) => ({
      queryKey: queryKeys.movies.detail(slug),
      queryFn: () => moviesApi.getMovieDetail(slug),
      staleTime: CACHE_TTL.fiveMinutes,
    })),
  });

  const movies: MovieListItem[] = details.flatMap((d) => (d.data?.movie ? [d.data.movie] : []));

  const saveCopy = () => {
    if (!list) return;

    if (!isAuthenticated) {
      requestAuth("login");

      return;
    }

    const store = useWatchlistStore.getState();

    const id = store.createList(list.name);

    // Newest-first like the rest of the app: add in reverse so the order matches.
    [...list.slugs].reverse().forEach((slug) => store.addToList(id, slug));

    toast.success(t("watchlist.savedCopy", { name: list.name }));

    void navigate({ to: "/watchlist" });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-16 pt-32 text-center text-netflix-muted">
        <ListX className="h-10 w-10" />
        <p>{t("watchlist.sharedNotFound")}</p>
        <Link to="/" className="text-netflix-red hover:underline">
          {t("movie.exploreMovies")}
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 px-4 md:px-12">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-netflix-muted">
            {list?.owner.name
              ? t("watchlist.sharedBy", { name: list.owner.name })
              : t("watchlist.sharedList")}
          </p>
          <h1 className="truncate text-2xl font-bold text-white md:text-3xl">
            {list?.name ?? "…"}
          </h1>
          {list && (
            <p className="text-sm text-netflix-muted">
              {t("watchlist.titleCount", { count: list.slugs.length })}
            </p>
          )}
        </div>
        {list && (
          <button
            type="button"
            onClick={saveCopy}
            className="inline-flex items-center gap-2 rounded-md bg-netflix-red px-4 py-2 text-sm font-semibold text-white hover:bg-netflix-red-hover"
          >
            <BookmarkPlus className="h-4 w-4" />
            {t("watchlist.saveCopy")}
          </button>
        )}
      </div>
      <MovieGrid movies={movies} isLoading={isLoading || details.some((d) => d.isLoading)} />
    </div>
  );
}
