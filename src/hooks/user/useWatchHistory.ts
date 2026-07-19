import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearWatchHistory,
  deleteWatchHistoryItem,
  fetchWatchHistory,
  upsertWatchProgress,
} from "@/services/platform/watchHistory.service";
export { migrateLocalHistoryToSupabase } from "@/services/platform/watchHistory.service";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import {
  type WatchHistoryItem,
  getLocalHistory,
  saveLocalHistory,
  removeLocalHistoryItem,
  clearLocalHistory,
} from "@/utils/localHistory";
import { invalidateHistoryRefetchCache } from "@/utils/historyRefetchCache";
import { getWatchProgressPercent, isWatchFinished } from "@/utils/watchProgress";

export type { WatchHistoryItem };

export function useWatchHistory() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const key =
    isAuthenticated && user
      ? queryKeys.watchHistory.byUser(user.id)
      : queryKeys.watchHistory.guest();

  const {
    data: history = [],
    isLoading,
    refetch,
  } = useQuery<WatchHistoryItem[]>({
    queryKey: key,
    queryFn: async () => {
      if (isAuthenticated && user) {
        return fetchWatchHistory(user.id);
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
      const normalizedItem = {
        ...item,
        completed: isWatchFinished(item.progress_sec, item.duration_sec),
      };
      saveLocalHistory(normalizedItem);
      // Mốc Continue cho phim này vừa thay đổi -> bỏ cache debounce
      invalidateHistoryRefetchCache(item.movie_slug);
      if (isAuthenticated && user) {
        try {
          await upsertWatchProgress(user.id, normalizedItem);
          void invalidate();
        } catch {
          /* ignore sync errors */
        }
      } else {
        void invalidate();
      }
    },
    [isAuthenticated, user, invalidate],
  );

  const deleteItem = useCallback(
    async (movieSlug: string, episodeName: string) => {
      removeLocalHistoryItem(movieSlug, episodeName);
      if (isAuthenticated && user) {
        await deleteWatchHistoryItem(user.id, movieSlug, episodeName);
      }
      void invalidate();
    },
    [isAuthenticated, user, invalidate],
  );

  const clearAll = useCallback(async () => {
    clearLocalHistory();
    if (isAuthenticated && user) {
      await clearWatchHistory(user.id);
    }
    void invalidate();
  }, [isAuthenticated, user, invalidate]);

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
