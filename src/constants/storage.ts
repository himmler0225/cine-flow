export const STORAGE_KEYS = {
  reactQueryCache: "cineflow-rq-cache",
  skipAds: "cineflow-skip-ads",
  accessToken: "cineflow_access_token",
  refreshToken: "cineflow_refresh_token",
  watchHistory: "cineflow_watch_history",
  recentSearches: "cineflow_recent_searches",
  episodeSnapshots: "cineflow_episode_snapshots",
  notifReadAt: "cineflow_notif_read_at",
  watchlists: "cineflow-watchlists",
  settings: "cineflow-settings",
  favorites: "cineflow-favorites",
  watchPartyStatePrefix: "cineflow_wp_state:",
} as const;

export const LEGACY_STORAGE_KEYS: Record<keyof typeof STORAGE_KEYS, string | null> = {
  reactQueryCache: "kkflix-rq-cache",
  skipAds: "kkflix-skip-ads",
  accessToken: "kkflix_access_token",
  refreshToken: null,
  watchHistory: "kkflix_watch_history",
  recentSearches: "kkflix_recent_searches",
  episodeSnapshots: "kkflix_episode_snapshots",
  notifReadAt: "kkflix_notif_read_at",
  watchlists: "kkflix-watchlists",
  settings: "kkflix-settings",
  favorites: "kk-favorites",
  watchPartyStatePrefix: "kkflix_wp_state:",
};

export function readStorageKey(key: keyof typeof STORAGE_KEYS): string | null {
  if (typeof window === "undefined") return null;
  const current = STORAGE_KEYS[key];
  const existing = localStorage.getItem(current);
  if (existing != null) return existing;
  const legacy = LEGACY_STORAGE_KEYS[key];
  if (!legacy) return null;
  const old = localStorage.getItem(legacy);
  if (old == null) return null;
  localStorage.setItem(current, old);
  localStorage.removeItem(legacy);
  return old;
}

export function writeStorageKey(key: keyof typeof STORAGE_KEYS, value: string | null): void {
  if (typeof window === "undefined") return;
  const current = STORAGE_KEYS[key];
  const legacy = LEGACY_STORAGE_KEYS[key];
  if (value == null) {
    localStorage.removeItem(current);
    if (legacy) localStorage.removeItem(legacy);
    return;
  }
  localStorage.setItem(current, value);
  if (legacy) localStorage.removeItem(legacy);
}
