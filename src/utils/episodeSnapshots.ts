const KEY = "kkflix_episode_snapshots";

export type EpisodeSnapshot = Record<string, { episode: string; at: number }>;

export function getEpisodeSnapshots(): EpisodeSnapshot {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EpisodeSnapshot) : {};
  } catch {
    return {};
  }
}

export function setEpisodeSnapshot(slug: string, episode: string): void {
  try {
    const all = getEpisodeSnapshots();
    all[slug] = { episode, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function removeEpisodeSnapshot(slug: string): void {
  try {
    const all = getEpisodeSnapshots();
    delete all[slug];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

const READ_KEY = "kkflix_notif_read_at";

export function getNotificationsReadAt(): number {
  try {
    return Number(localStorage.getItem(READ_KEY) || 0);
  } catch {
    return 0;
  }
}

export function markNotificationsRead(): void {
  try {
    localStorage.setItem(READ_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
