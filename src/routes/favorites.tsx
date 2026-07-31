import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFavorites } from "@/hooks/useFavorites";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { getImageUrl } from "@/lib/movie/movieImages";
import { useAuthStore } from "@/store/authStore";
import { t } from "@/lib/i18n";
import { EPISODE_NUMBER_PATTERN } from "@/constants/patterns";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [{ title: t("seo.favoritesTitle") }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { favoritesList } = useFavorites();
  const { history } = useWatchHistory();
  const recent = useMemo(() => {
    const seen = new Set<string>();
    return history.filter((h) => (seen.has(h.movie_slug) ? false : (seen.add(h.movie_slug), true)));
  }, [history]);
  return (
    <div className="pt-24 pb-4 md:pb-8">
      <h1 className="mb-2 px-4 text-2xl font-bold text-white md:px-12 md:text-3xl">
        {t("movie.favoritesTitle")}
      </h1>
      <p className="mb-6 px-4 text-sm text-netflix-muted md:px-12">
        {isAuthenticated ? t("movie.favoritesSync") : t("movie.favoritesLocal")}
      </p>

      {favoritesList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-netflix-muted">
          <Heart className="h-10 w-10" />
          <p>{t("movie.noFavorites")}</p>
          <Link to="/" className="text-netflix-red hover:underline">
            {t("movie.exploreMovies")}
          </Link>
        </div>
      ) : (
        <MovieGrid movies={favoritesList} />
      )}

      {recent.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 px-4 text-xl font-semibold text-white md:px-12">
            {t("movie.continueWatching")}
          </h2>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 md:px-12">
            {recent.slice(0, 12).map((p) => {
              const tapMatch = p.episode_name.match(EPISODE_NUMBER_PATTERN);
              const tap = tapMatch ? Math.max(1, parseInt(tapMatch[0], 10)) : 1;
              return (
                <Link
                  key={p.movie_slug}
                  to="/watch/$slug"
                  params={{ slug: p.movie_slug }}
                  search={{ tap, server: p.server_index }}
                  className="group flex-none"
                >
                  <div className="relative aspect-video w-64 overflow-hidden rounded-md bg-netflix-surface">
                    <img
                      src={getImageUrl(p.thumb_url || "")}
                      alt={p.movie_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="line-clamp-1 text-sm font-medium text-white">{p.movie_name}</p>
                      <p className="text-xs text-netflix-muted">{p.episode_name}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
