import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { favoriteToMovieListItem, favoritesApi } from "@/services/platform/favorites.service";
import { useAuthStore } from "@/store/authStore";
import { useFavoriteStore } from "@/store/favoriteStore";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import type { MovieListItem } from "@/types/movie";
import { getImageUrl } from "@/lib/movie/movieImages";
import { setEpisodeSnapshot } from "@/utils/episodeSnapshots";
import { getAppQueryClient } from "@/lib/queryClientHolder";
import { useHydrated } from "@/hooks/useHydrated";

export function invalidateFavoritesQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string,
) {
  if (userId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.slugs(userId) });

    void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(userId) });

    void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.count(userId) });
  } else {
    void queryClient.removeQueries({ queryKey: ["favorites"] });

    void queryClient.removeQueries({ queryKey: ["favorites-list"] });

    void queryClient.removeQueries({ queryKey: ["favorites-count"] });
  }
}

export function clearFavoritesCache() {
  const qc = getAppQueryClient();

  if (!qc) return;

  void qc.removeQueries({ queryKey: ["favorites"] });

  void qc.removeQueries({ queryKey: ["favorites-list"] });

  void qc.removeQueries({ queryKey: ["favorites-count"] });
}

export function useFavoritesList(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favorites.list(userId ?? ""),
    enabled: !!userId,
    staleTime: CACHE_TTL.fiveMinutes,
    gcTime: CACHE_TTL.thirtyMinutes,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: () => favoritesApi.fetchList(),
  });
}

export function useFavoriteCount(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favorites.count(userId ?? ""),
    enabled: !!userId,
    staleTime: CACHE_TTL.fiveMinutes,
    gcTime: CACHE_TTL.thirtyMinutes,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: () => favoritesApi.count(),
  });
}

const EMPTY_LOCAL_FAVS: MovieListItem[] = [];

export function useFavorites() {
  const userId = useAuthStore((s) => s.user?.id);

  // Guest favourites come from localStorage: ignore them until hydrated (see useHydrated).
  const hydrated = useHydrated();

  const storedFavs = useFavoriteStore((s) => s.favorites);

  const localFavs = hydrated ? storedFavs : EMPTY_LOCAL_FAVS;

  const localToggle = useFavoriteStore((s) => s.toggle);

  const storeHas = useFavoriteStore((s) => s.has);

  const localHas = useCallback((slug: string) => hydrated && storeHas(slug), [hydrated, storeHas]);

  const queryClient = useQueryClient();

  const { data: slugMap = new Map<string, string>() } = useQuery({
    queryKey: queryKeys.favorites.slugs(userId ?? ""),
    enabled: !!userId,
    staleTime: CACHE_TTL.fiveMinutes,
    gcTime: CACHE_TTL.thirtyMinutes,
    refetchOnWindowFocus: false,
    queryFn: () => favoritesApi.fetchSlugs(),
  });

  const { data: remoteList = [] } = useFavoritesList(userId);

  const isFavorite = useCallback(
    (slug: string) => (userId ? slugMap.has(slug) : localHas(slug)),
    [userId, slugMap, localHas],
  );

  const setSlugMap = useCallback(
    (next: Map<string, string>) => {
      if (!userId) return;

      queryClient.setQueryData(queryKeys.favorites.slugs(userId), next);
    },
    [queryClient, userId],
  );

  const toggleFavorite = useCallback(
    async (movie: MovieListItem) => {
      if (!userId) {
        const wasFav = localHas(movie.slug);

        localToggle(movie);

        toast.success(wasFav ? t("toast.favoriteRemoved") : t("toast.favoriteAdded"));

        return;
      }

      const existingId = slugMap.get(movie.slug);

      const next = new Map(slugMap);

      if (existingId) {
        next.delete(movie.slug);

        setSlugMap(next);

        queryClient.setQueryData(queryKeys.favorites.list(userId), (prev: unknown) =>
          Array.isArray(prev)
            ? prev.filter((f: { movie_slug?: string }) => f.movie_slug !== movie.slug)
            : prev,
        );

        queryClient.setQueryData(queryKeys.favorites.count(userId), (c: number | undefined) =>
          Math.max(0, (c ?? 1) - 1),
        );

        try {
          await favoritesApi.removeBySlug(movie.slug);

          toast.success(t("toast.favoriteRemoved"));
        } catch {
          const rb = new Map(next);

          rb.set(movie.slug, existingId);

          setSlugMap(rb);

          void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(userId) });

          void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.count(userId) });

          toast.error(t("toast.favoriteRemoveFailed"));
        }
      } else {
        const tempId = `tmp-${movie.slug}`;

        next.set(movie.slug, tempId);

        setSlugMap(next);

        queryClient.setQueryData(
          queryKeys.favorites.count(userId),
          (c: number | undefined) => (c ?? 0) + 1,
        );

        try {
          const { data } = await favoritesApi.insert({
            userId,
            movieSlug: movie.slug,
            movieName: movie.name,
            thumbUrl: getImageUrl(movie.poster_url || movie.thumb_url) || null,
          });

          const upd = new Map(next);

          if (data?.id) upd.set(movie.slug, data.id);

          setSlugMap(upd);

          void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(userId) });

          if (movie.episode_current) {
            setEpisodeSnapshot(movie.slug, movie.episode_current);
          }

          toast.success(t("toast.favoriteAdded"));
        } catch {
          const rb = new Map(next);

          rb.delete(movie.slug);

          setSlugMap(rb);

          queryClient.setQueryData(queryKeys.favorites.count(userId), (c: number | undefined) =>
            Math.max(0, (c ?? 1) - 1),
          );

          toast.error(t("toast.favoriteAddFailed"));
        }
      }
    },
    [userId, slugMap, localHas, localToggle, setSlugMap, queryClient],
  );

  const favoritesList: MovieListItem[] = useMemo(
    () => (userId ? remoteList.map(favoriteToMovieListItem) : localFavs),
    [userId, remoteList, localFavs],
  );

  const favoriteSlugs = useMemo(
    () => (userId ? [...slugMap.keys()] : localFavs.map((f) => f.slug)),
    [userId, slugMap, localFavs],
  );

  return {
    isFavorite,
    toggleFavorite,
    favoritesList,
    favoriteSlugs,
    isReady: true,
    isAuthenticated: !!userId,
  };
}
