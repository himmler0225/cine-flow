import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { watchHistoryApi } from "@/services/platform/watchHistory.service";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import {
  type WatchHistoryItem,
  getLocalHistory,
  mergeWatchProgress,
  saveLocalHistory,
  removeLocalHistoryItem,
  clearLocalHistory,
} from "@/utils/localHistory";
import { invalidateHistoryRefetchCache } from "@/utils/historyRefetchCache";
import { getWatchProgressPercent, isWatchFinished } from "@/utils/watchProgress";

export type { WatchHistoryItem };

const EMPTY_HISTORY: WatchHistoryItem[] = [];

export function useWatchHistory() {
  const userId = useAuthStore((s) => (s.isAuthenticated ? s.user?.id : undefined));

  const queryClient = useQueryClient();

  // Stable identity: every callback below depends on it, and the watch page passes those
  // callbacks into long-lived player effects.
  const key = useMemo(
    () => (userId ? queryKeys.watchHistory.byUser(userId) : queryKeys.watchHistory.guest()),
    [userId],
  );

  const {
    data: history = EMPTY_HISTORY,
    isLoading,
    refetch,
  } = useQuery<WatchHistoryItem[]>({
    queryKey: key,
    queryFn: async () => {
      if (userId) {
        return watchHistoryApi.fetch();
      }

      return getLocalHistory();
    },
    staleTime: CACHE_TTL.fiveMinutes,
    gcTime: CACHE_TTL.thirtyMinutes,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: key }),
    [queryClient, key],
  );

  const saveProgress = useCallback(
    async (item: WatchHistoryItem) => {
      const previous = queryClient
        .getQueryData<WatchHistoryItem[]>(key)
        ?.find((h) => h.movie_slug === item.movie_slug && h.episode_name === item.episode_name);

      const normalizedItem = mergeWatchProgress(previous, {
        ...item,
        completed: isWatchFinished(item.progress_sec, item.duration_sec),
      });

      if (
        normalizedItem.progress_sec < 5 &&
        !normalizedItem.completed &&
        (previous?.progress_sec ?? 0) < 5
      ) {
        return;
      }

      saveLocalHistory(normalizedItem);

      invalidateHistoryRefetchCache(item.movie_slug);

      queryClient.setQueryData<WatchHistoryItem[]>(key, (old = []) => {
        const idx = old.findIndex(
          (h) =>
            h.movie_slug === normalizedItem.movie_slug &&
            h.episode_name === normalizedItem.episode_name,
        );

        if (idx >= 0) {
          const next = [...old];

          next[idx] = { ...old[idx], ...normalizedItem };

          const [hit] = next.splice(idx, 1);

          next.unshift(hit);

          return next;
        }

        return [normalizedItem, ...old].slice(0, 50);
      });

      if (userId) {
        try {
          await watchHistoryApi.upsertProgress(normalizedItem);
        } catch (error) {
          console.error("[watch-history] upsert failed", error);
        }
      }
    },
    [userId, key, queryClient],
  );

  const deleteItem = useCallback(
    async (movieSlug: string, episodeName: string) => {
      removeLocalHistoryItem(movieSlug, episodeName);

      queryClient.setQueryData<WatchHistoryItem[]>(key, (old = []) =>
        old.filter((h) => !(h.movie_slug === movieSlug && h.episode_name === episodeName)),
      );

      if (userId) {
        await watchHistoryApi.deleteItem(movieSlug, episodeName);
      }

      void invalidate();
    },
    [userId, invalidate, key, queryClient],
  );

  const clearAll = useCallback(async () => {
    clearLocalHistory();

    queryClient.setQueryData<WatchHistoryItem[]>(key, []);

    if (userId) {
      await watchHistoryApi.clear();
    }

    void invalidate();
  }, [userId, invalidate, key, queryClient]);

  const getProgress = useCallback(
    (movieSlug: string, episodeName: string) => {
      const item = history.find(
        (h) => h.movie_slug === movieSlug && h.episode_name === episodeName,
      );

      if (!item || !item.duration_sec) return 0;

      return getWatchProgressPercent(item.progress_sec, item.duration_sec);
    },
    [history],
  );

  const getLastEpisode = useCallback(
    (movieSlug: string) => history.find((h) => h.movie_slug === movieSlug) || null,
    [history],
  );

  const getEpisodeProgress = useCallback(
    (movieSlug: string, episodeName: string) =>
      history.find((h) => h.movie_slug === movieSlug && h.episode_name === episodeName) ?? null,
    [history],
  );

  return {
    history,
    isLoading,
    saveProgress,
    deleteItem,
    clearAll,
    getProgress,
    getLastEpisode,
    getEpisodeProgress,
    refetch,
  };
}
