export interface WatchHistoryItem {
  id?: string;
  user_id?: string;
  movie_slug: string;
  movie_name: string;
  thumb_url?: string | null;
  episode_name: string;
  episode_index?: number;
  server_index: number;
  progress_sec: number;
  duration_sec: number;
  completed?: boolean;
  watched_at: string;
}

const KEY = "kkflix_watch_history";
const MAX_ITEMS = 50;

export function getLocalHistory(): WatchHistoryItem[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
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
    const entry: WatchHistoryItem = {
      ...item,
      watched_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      history[idx] = { ...history[idx], ...entry };
      // move to top
      const [hit] = history.splice(idx, 1);
      history.unshift(hit);
    } else {
      history.unshift(entry);
    }
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore */
  }
}

export function removeLocalHistoryItem(slug: string, episode: string): void {
  try {
    const history = getLocalHistory().filter(
      (h) => !(h.movie_slug === slug && h.episode_name === episode),
    );
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
