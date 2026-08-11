import { readStorageKey, writeStorageKey } from "@/constants/storage";

export type EpisodeSnapshot = Record<
  string,
  {
    episode: string;
    at: number;
  }
>;

export function getEpisodeSnapshots(): EpisodeSnapshot {
  try {
    const raw = readStorageKey("episodeSnapshots");

    return raw ? (JSON.parse(raw) as EpisodeSnapshot) : {};
  } catch {
    return {};
  }
}

export function setEpisodeSnapshot(slug: string, episode: string): void {
  try {
    const all = getEpisodeSnapshots();

    all[slug] = { episode, at: Date.now() };

    writeStorageKey("episodeSnapshots", JSON.stringify(all));
  } catch {}
}

export function removeEpisodeSnapshot(slug: string): void {
  try {
    const all = getEpisodeSnapshots();

    delete all[slug];

    writeStorageKey("episodeSnapshots", JSON.stringify(all));
  } catch {}
}

export function getNotificationsReadAt(): number {
  try {
    return Number(readStorageKey("notifReadAt") || 0);
  } catch {
    return 0;
  }
}

export function markNotificationsRead(): void {
  try {
    writeStorageKey("notifReadAt", String(Date.now()));
  } catch {}
}
