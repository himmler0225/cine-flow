import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { useWatchlistStore } from "@/store/watchlistStore";
import { isWatchFinished } from "@/utils/watchProgress";

/** Slugs tracked for episode-new notifications (favorites + watchlists + in-progress history). */
export function useTrackedSeriesSlugs(): string[] {
  const { favoriteSlugs } = useFavorites();
  const lists = useWatchlistStore((s) => s.lists);
  const { history } = useWatchHistory();

  return useMemo(() => {
    const set = new Set<string>(favoriteSlugs);
    for (const list of lists) {
      for (const slug of list.slugs) set.add(slug);
    }
    for (const h of history) {
      if (h.duration_sec > 0 && !isWatchFinished(h.progress_sec, h.duration_sec)) {
        set.add(h.movie_slug);
      }
    }
    return [...set];
  }, [favoriteSlugs, lists, history]);
}
