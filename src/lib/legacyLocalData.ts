import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "@/constants/storage";
import { favoritesApi } from "@/services/platform/favorites.service";
import { ratingsApi } from "@/services/platform/ratings.service";
import { watchHistoryApi } from "@/services/platform/watchHistory.service";
import { watchlistApi } from "@/services/platform/watchlist.service";
import type { MoviePlayerPrefs, UserPreferences } from "@/services/platform/preferences.service";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useWatchlistStore, type Watchlist } from "@/store/watchlistStore";
import type { MovieListItem } from "@/types/movie";
import type { WatchHistoryItem } from "@/utils/watchHistoryMerge";

/**
 * Older versions kept user data in localStorage. On sign-in, push whatever is
 * still there to the database once, then delete it from the browser. Each part
 * is removed only after its upload succeeded, so a failure retries next time.
 */

type StorageName = keyof typeof STORAGE_KEYS;

/** Keys that only ever held local copies and have no server equivalent. */
const OBSOLETE_KEYS = ["kk-player-history"];

function keysOf(name: StorageName): string[] {
  const legacy = LEGACY_STORAGE_KEYS[name];

  return legacy ? [STORAGE_KEYS[name], legacy] : [STORAGE_KEYS[name]];
}

function readRaw(keys: string[]): string | null {
  for (const key of keys) {
    const raw = localStorage.getItem(key);

    if (raw != null) return raw;
  }

  return null;
}

function readJson<T>(keys: string[]): T | undefined {
  const raw = readRaw(keys);

  if (raw == null) return undefined;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** zustand/persist wraps the state as `{ state, version }`. */
function readPersisted<T>(keys: string[]): T | undefined {
  return readJson<{ state?: T }>(keys)?.state;
}

function remove(keys: string[]) {
  keys.forEach((key) => localStorage.removeItem(key));
}

async function step(label: string, keys: string[], run: () => Promise<void>) {
  if (readRaw(keys) == null) return;

  try {
    await run();

    remove(keys);
  } catch (error) {
    console.warn(`[legacy-import] ${label} failed; will retry next sign-in`, error);
  }
}

/** Fills a preference only if the account has none yet (server copy wins). */
function seedPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
  if (value === undefined) return;

  usePreferencesStore.getState().set(key, (prev) => prev ?? value);
}

function importPreferences() {
  // Only seed into an account copy we actually loaded; otherwise keep the local data.
  if (!usePreferencesStore.getState().userId) return;

  const player = readJson<{
    volume?: number;
    muted?: boolean;
    movies?: Record<string, MoviePlayerPrefs>;
  }>(keysOf("playerPrefs"));

  if (player) {
    if (player.volume !== undefined || player.muted !== undefined) {
      seedPreference("player", { volume: player.volume, muted: player.muted });
    }

    if (player.movies) seedPreference("moviePrefs", player.movies);
  }

  const settings = readPersisted<{ dataSaver?: boolean }>(keysOf("settings"));

  const skipAds = readRaw(keysOf("skipAds"));

  if (settings?.dataSaver !== undefined || skipAds != null) {
    seedPreference("settings", {
      dataSaver: settings?.dataSaver === true,
      skipAds: skipAds === "1",
    });
  }

  seedPreference("recentSearches", readJson<string[]>(keysOf("recentSearches")));

  seedPreference(
    "episodeSnapshots",
    readJson<UserPreferences["episodeSnapshots"]>(keysOf("episodeSnapshots")),
  );

  const readAt = Number(readRaw(keysOf("notifReadAt")));

  if (readAt > 0) seedPreference("notifReadAt", readAt);

  // Seeds are queued in the preferences store and saved with the account's copy.
  (
    [
      "playerPrefs",
      "settings",
      "skipAds",
      "recentSearches",
      "episodeSnapshots",
      "notifReadAt",
    ] as const
  ).forEach((name) => remove(keysOf(name)));
}

async function importWatchlists() {
  const local = readPersisted<{ lists?: Watchlist[] }>(keysOf("watchlists"))?.lists ?? [];

  if (local.length === 0) return;

  const remote = await watchlistApi.fetch();

  const remoteByKey = new Map(remote.map((l) => [l.id, l]));

  const merged: Watchlist[] = local.map((list) => {
    const existing = remoteByKey.get(list.id);

    return {
      id: list.id,
      name: existing?.name ?? list.name,
      slugs: [...new Set([...(existing?.slugs ?? []), ...list.slugs])],
      createdAt: existing?.createdAt ?? list.createdAt,
    };
  });

  for (const list of remote) {
    if (!merged.some((l) => l.id === list.id)) merged.push(list);
  }

  await watchlistApi.save(merged);

  useWatchlistStore.getState().replaceLists(merged);
}

let running: Promise<void> | null = null;

export function importLegacyLocalData(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  running ??= (async () => {
    importPreferences();

    await step("history", keysOf("watchHistory"), () =>
      watchHistoryApi.importItems(readJson<WatchHistoryItem[]>(keysOf("watchHistory")) ?? []),
    );

    await step("favorites", keysOf("favorites"), async () => {
      await favoritesApi.importItems(
        readPersisted<{ favorites?: MovieListItem[] }>(keysOf("favorites"))?.favorites ?? [],
      );

      const { clearFavoritesCache } = await import("@/hooks/useFavorites");

      clearFavoritesCache();
    });

    await step("watchlists", keysOf("watchlists"), importWatchlists);

    await step("ratings", ["kk-ratings"], async () => {
      const ratings = readPersisted<{ ratings?: Record<string, number> }>(["kk-ratings"])?.ratings;

      for (const [slug, score] of Object.entries(ratings ?? {})) {
        await ratingsApi.upsert(slug, score);
      }
    });

    remove(OBSOLETE_KEYS);
  })().finally(() => {
    running = null;
  });

  return running;
}
