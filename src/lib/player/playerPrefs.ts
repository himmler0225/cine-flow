import type { MoviePlayerPrefs } from "@/services/platform/preferences.service";
import { usePreferencesStore } from "@/store/preferencesStore";

export type { MoviePlayerPrefs };

/** Oldest movies are forgotten past this many entries (keeps the DB document small). */
const MAX_MOVIES = 150;

export function getMoviePrefs(slug: string | undefined): MoviePlayerPrefs {
  if (!slug) return {};

  return usePreferencesStore.getState().prefs.moviePrefs?.[slug] ?? {};
}

export function saveMoviePrefs(slug: string | undefined, patch: MoviePlayerPrefs): void {
  if (!slug) return;

  usePreferencesStore.getState().set("moviePrefs", (prev = {}) => {
    const movies = { ...prev, [slug]: { ...prev[slug], ...patch, updatedAt: Date.now() } };

    const slugs = Object.keys(movies);

    if (slugs.length > MAX_MOVIES) {
      slugs
        .sort((a, b) => (movies[a].updatedAt ?? 0) - (movies[b].updatedAt ?? 0))
        .slice(0, slugs.length - MAX_MOVIES)
        .forEach((s) => delete movies[s]);
    }

    return movies;
  });
}

export function getVolumePrefs(): { volume?: number; muted?: boolean } {
  return usePreferencesStore.getState().prefs.player ?? {};
}

export function saveVolumePrefs(patch: { volume?: number; muted?: boolean }): void {
  usePreferencesStore.getState().set("player", (prev) => ({ ...prev, ...patch }));
}
