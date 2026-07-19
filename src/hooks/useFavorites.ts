import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import {
  countFavorites,
  deleteFavorite,
  favoriteToMovieListItem,
  fetchFavoriteSlugs,
  fetchFavoritesList,
  insertFavorite,
} from "@/services/platform/favorites.service";
import { useAuthStore } from "@/store/authStore";
import { useFavoriteStore } from "@/store/favoriteStore";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import type { MovieListItem } from "@/types/movie";
import { getImageUrl } from "@/lib/movie/movieImages";
import { setEpisodeSnapshot } from "@/utils/episodeSnapshots";

export { fetchFavoritesList } from "@/services/platform/favorites.service";

type CacheEntry = { userId: string; map: Map<string, string>; loadedAt: number };
let cache: CacheEntry | null = null;
const inflight = new Map<string, Promise<Map<string, string>>>();
const subscribers = new Set<(m: Map<string, string>) => void>();
const TTL_MS = CACHE_TTL.fiveMinutes;

function publish(map: Map<string, string>) {
  subscribers.forEach((cb) => cb(new Map(map)));
}

async function loadFavorites(userId: string, force = false): Promise<Map<string, string>> {
  if (!force && cache && cache.userId === userId && Date.now() - cache.loadedAt < TTL_MS) {
    return cache.map;
  }
  const existing = inflight.get(userId);
  if (existing) return existing;
  const p = (async () => {
    try {
      const m = await fetchFavoriteSlugs(userId);
      cache = { userId, map: m, loadedAt: Date.now() };
      publish(m);
      return m;
    } finally {
      inflight.delete(userId);
    }
  })();
  inflight.set(userId, p);
  return p;
}

export function clearFavoritesCache() {
  cache = null;
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
    queryFn: () => fetchFavoritesList(userId!),
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
    queryFn: () => countFavorites(userId!),
  });
}

export function useFavorites() {
  const userId = useAuthStore((s) => s.user?.id);
  const localFavs = useFavoriteStore((s) => s.favorites);
  const localToggle = useFavoriteStore((s) => s.toggle);
  const localHas = useFavoriteStore((s) => s.has);

  const [map, setMap] = useState<Map<string, string>>(
    cache && cache.userId === userId ? new Map(cache.map) : new Map(),
  );

  const { data: remoteList = [] } = useQuery({
    queryKey: queryKeys.favorites.list(userId ?? ""),
    enabled: !!userId,
    staleTime: CACHE_TTL.fiveMinutes,
    queryFn: () => fetchFavoritesList(userId!),
  });

  useEffect(() => {
    if (!userId) {
      cache = null;
      setMap(new Map());
      return;
    }
    const sub = (m: Map<string, string>) => setMap(m);
    subscribers.add(sub);
    void loadFavorites(userId);
    return () => {
      subscribers.delete(sub);
    };
  }, [userId]);

  const isFavorite = useCallback(
    (slug: string) => (userId ? map.has(slug) : localHas(slug)),
    [userId, map, localHas],
  );

  const toggleFavorite = useCallback(
    async (movie: MovieListItem) => {
      if (!userId) {
        const wasFav = localHas(movie.slug);
        localToggle(movie);
        toast.success(wasFav ? t("toast.favoriteRemoved") : t("toast.favoriteAdded"));
        return;
      }

      const existingId = map.get(movie.slug);
      const next = new Map(map);
      if (existingId) {
        next.delete(movie.slug);
        if (cache) cache.map = next;
        publish(next);
        const { error } = await deleteFavorite(existingId);
        if (error) {
          const rb = new Map(next);
          rb.set(movie.slug, existingId);
          if (cache) cache.map = rb;
          publish(rb);
          toast.error(t("toast.favoriteRemoveFailed"));
        } else {
          toast.success(t("toast.favoriteRemoved"));
        }
      } else {
        const tempId = `tmp-${movie.slug}`;
        next.set(movie.slug, tempId);
        if (cache) cache.map = next;
        publish(next);
        const { data, error } = await insertFavorite({
          userId,
          movieSlug: movie.slug,
          movieName: movie.name,
          thumbUrl: getImageUrl(movie.poster_url || movie.thumb_url) || null,
        });
        if (error || !data) {
          const rb = new Map(next);
          rb.delete(movie.slug);
          if (cache) cache.map = rb;
          publish(rb);
          toast.error(t("toast.favoriteAddFailed"));
        } else {
          const upd = new Map(next);
          upd.set(movie.slug, data.id);
          if (cache) cache.map = upd;
          publish(upd);
          if (movie.episode_current) {
            setEpisodeSnapshot(movie.slug, movie.episode_current);
          }
          toast.success(t("toast.favoriteAdded"));
        }
      }
    },
    [userId, map, localHas, localToggle],
  );

  const favoritesList: MovieListItem[] = userId
    ? remoteList.map(favoriteToMovieListItem)
    : localFavs;

  const favoriteSlugs = userId ? [...map.keys()] : localFavs.map((f) => f.slug);

  return {
    isFavorite,
    toggleFavorite,
    favoritesList,
    favoriteSlugs,
    isReady: true,
    isAuthenticated: !!userId,
  };
}
