import { writeStorageKey, readStorageKey } from "@/constants/storage";
import { type WatchHistoryItem, mergeWatchProgress } from "@/utils/watchHistoryMerge";

export type { WatchHistoryItem };

export { mergeWatchProgress };

const MAX_ITEMS = 50;

export function getLocalHistory(): WatchHistoryItem[] {
  try {
    const raw = readStorageKey("watchHistory");
    return raw ? (JSON.parse(raw) as WatchHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistory(item: WatchHistoryItem): void {
  try {
    const history = getLocalHistory();
    const idx = history.findIndex(
      (h) => h.movie_slug === item.movie_slug && h.episode_name === item.episode_name,
    );
    const entry = mergeWatchProgress(idx >= 0 ? history[idx] : undefined, item);
    if (idx >= 0) {
      history[idx] = entry;
      const [hit] = history.splice(idx, 1);
      history.unshift(hit);
    } else {
      history.unshift(entry);
    }
    writeStorageKey("watchHistory", JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {
    /* storage unavailable (private mode / quota) — non-critical */
  }
}

export function removeLocalHistoryItem(slug: string, episode: string): void {
  try {
    const history = getLocalHistory().filter(
      (h) => !(h.movie_slug === slug && h.episode_name === episode),
    );
    writeStorageKey("watchHistory", JSON.stringify(history));
  } catch {
    /* storage unavailable (private mode / quota) — non-critical */
  }
}

export function clearLocalHistory(): void {
  try {
    writeStorageKey("watchHistory", null);
  } catch {
    /* storage unavailable (private mode / quota) — non-critical */
  }
}
