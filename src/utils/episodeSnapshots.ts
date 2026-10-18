import type { EpisodeSnapshot } from "@/services/platform/preferences.service";
import { usePreferencesStore } from "@/store/preferencesStore";

export type { EpisodeSnapshot };

/** Followed series are capped so the stored document stays small. */
const MAX_SNAPSHOTS = 200;

export function getEpisodeSnapshots(): EpisodeSnapshot {
  return usePreferencesStore.getState().prefs.episodeSnapshots ?? {};
}

export function setEpisodeSnapshot(slug: string, episode: string): void {
  const current = getEpisodeSnapshots()[slug];

  if (current?.episode === episode) return;

  usePreferencesStore.getState().set("episodeSnapshots", (prev = {}) => {
    const next = { ...prev, [slug]: { episode, at: Date.now() } };

    const slugs = Object.keys(next);

    if (slugs.length > MAX_SNAPSHOTS) {
      slugs
        .sort((a, b) => next[a].at - next[b].at)
        .slice(0, slugs.length - MAX_SNAPSHOTS)
        .forEach((s) => delete next[s]);
    }

    return next;
  });
}

export function removeEpisodeSnapshot(slug: string): void {
  if (!getEpisodeSnapshots()[slug]) return;

  usePreferencesStore.getState().set("episodeSnapshots", (prev = {}) => {
    const next = { ...prev };

    delete next[slug];

    return next;
  });
}

export function getNotificationsReadAt(): number {
  return usePreferencesStore.getState().prefs.notifReadAt ?? 0;
}

export function markNotificationsRead(): void {
  usePreferencesStore.getState().set("notifReadAt", () => Date.now());
}
