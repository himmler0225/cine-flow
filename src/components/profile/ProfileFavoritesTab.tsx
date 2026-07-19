import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Heart, LayoutGrid, List as ListIcon, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteFavorite } from "@/services/platform/favorites.service";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesList } from "@/hooks/useFavorites";
import { MovieCard } from "@/components/movie/MovieCard";
import { MoviePosterImg } from "@/components/movie/MoviePosterImg";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/i18n";
import {
  compareFavoritesNewest,
  favToMovie,
  type FavoriteRow,
} from "@/components/profile/profileUtils";

export function ProfileFavoritesTab() {
  const { t, i18n } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: favs = [], isLoading: loading } = useFavoritesList(userId);

  const sorted = useMemo<FavoriteRow[]>(() => {
    const arr = [...favs];
    if (sort === "recent") arr.sort(compareFavoritesNewest);
    else arr.sort((a, b) => a.movie_name.localeCompare(b.movie_name, i18n.language));
    return arr;
  }, [favs, sort, i18n.language]);

  const remove = async (id: string) => {
    queryClient.setQueryData<FavoriteRow[]>(queryKeys.favorites.list(userId ?? ""), (prev) =>
      (prev || []).filter((f) => f.id !== id),
    );
    await deleteFavorite(id);
    toast.success(t("toast.favoriteRemoved"));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-netflix-surface" />
        ))}
      </div>
    );
  }

  if (favs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
          <Heart className="h-16 w-16 text-netflix-red" />
        </motion.div>
        <h3 className="text-xl font-semibold text-white">{t("profile.noFavorites")}</h3>
        <p className="text-sm text-gray-400">{t("profile.favoritesEmptyDesc")}</p>
        <Link
          to="/"
          className="mt-3 rounded-lg bg-netflix-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t("profile.exploreNow")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {t("profile.favoritesCount", { count: favs.length })}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "name")}
            className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
          >
            <option value="recent">{t("profile.sortRecent")}</option>
            <option value="name">{t("profile.sortName")}</option>
          </select>
          <div className="flex rounded-md border border-gray-700">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5",
                view === "grid" ? "bg-netflix-red text-white" : "text-gray-400",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5",
                view === "list" ? "bg-netflix-red text-white" : "text-gray-400",
              )}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          <AnimatePresence>
            {sorted.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <MovieCard movie={favToMovie(f)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {sorted.map((f) => (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-lg border border-gray-800 bg-black/30 p-2"
              >
                <Link to="/movie/$slug" params={{ slug: f.movie_slug }}>
                  <MoviePosterImg
                    slug={f.movie_slug}
                    thumbUrl={f.thumb_url}
                    alt=""
                    className="h-16 w-12 rounded object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/movie/$slug"
                    params={{ slug: f.movie_slug }}
                    className="line-clamp-1 font-medium text-white hover:text-netflix-red"
                  >
                    {f.movie_name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {f.created_at
                      ? t("profile.addedAgo", {
                          time: formatRelativeTime(f.created_at, i18n.language),
                        })
                      : t("profile.addedToFavorites")}
                  </p>
                </div>
                <button
                  onClick={() => void remove(f.id)}
                  className="rounded-md p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
