import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ListPlus, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useWatchlistStore } from "@/store/watchlistStore";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";

export function ProfileWatchlistsTab() {
  const { t } = useTranslation();
  const lists = useWatchlistStore((s) => s.lists);
  const createList = useWatchlistStore((s) => s.createList);
  const deleteList = useWatchlistStore((s) => s.deleteList);
  const removeFromList = useWatchlistStore((s) => s.removeFromList);
  const [newName, setNewName] = useState("");
  const [activeId, setActiveId] = useState(lists[0]?.id ?? "default");
  const active = lists.find((l) => l.id === activeId) ?? lists[0];
  const slugs = active?.slugs ?? [];
  const movies = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: queryKeys.movies.detail(slug),
      queryFn: () => moviesApi.getMovieDetail(slug),
      staleTime: CACHE_TTL.fiveMinutes,
    })),
  });
  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createList(name);
    setNewName("");
    setActiveId(id);
    toast.success(t("toast.listCreatedNamed", { name }));
  };
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ListPlus className="h-16 w-16 text-netflix-red" />
        <h3 className="text-xl font-semibold text-white">{t("profile.noWatchlists")}</h3>
        <p className="text-sm text-netflix-muted">{t("profile.noListsDesc")}</p>
        <Link
          to="/"
          className="mt-3 rounded-lg bg-netflix-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t("movie.exploreMovies")}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 shrink-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("profile.yourLists")}
        </p>
        <ul className="space-y-1">
          {lists.map((list) => (
            <li key={list.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveId(list.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active?.id === list.id
                    ? "bg-netflix-red/20 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {list.name}
                <span className="ml-1 text-xs text-zinc-500">({list.slugs.length})</span>
              </button>
              {list.id !== "default" && list.id !== "watchlater" && (
                <button
                  type="button"
                  onClick={() => {
                    deleteList(list.id);
                    if (activeId === list.id) setActiveId("default");
                    toast.success(t("toast.listDeleted"));
                  }}
                  className="rounded p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                  aria-label={t("profile.deleteWatchlist")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t("profile.newListPlaceholder")}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-netflix-red focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-netflix-red p-2 text-white hover:bg-netflix-red-hover"
            aria-label={t("profile.createWatchlist")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {active && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-white">{active.name}</h2>
            {slugs.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">
                {t("profile.emptyListHint")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {slugs.map((slug, i) => {
                  const movie = movies[i]?.data?.movie;
                  const loading = movies[i]?.isLoading;
                  return (
                    <div key={slug} className="group relative">
                      <Link to="/movie/$slug" params={{ slug }} className="block">
                        {loading ? (
                          <div className="aspect-[2/3] animate-pulse rounded-md bg-netflix-surface" />
                        ) : (
                          <MoviePosterImg
                            slug={slug}
                            thumbUrl={movie?.thumb_url || movie?.poster_url}
                            alt={movie?.name ?? slug}
                            className="aspect-[2/3] w-full rounded-md object-cover transition-transform group-hover:scale-[1.03]"
                          />
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-white">
                          {movie?.name ?? slug}
                        </p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromList(active.id, slug);
                          toast.success(t("toast.removedFromWatchlist"));
                        }}
                        className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t("profile.removeFromList")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
