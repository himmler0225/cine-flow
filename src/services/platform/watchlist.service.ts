import { platformFetch } from "@/lib/platformApi";
import type { Watchlist } from "@/store/watchlistStore";
import { useWatchlistStore } from "@/store/watchlistStore";

export async function fetchUserWatchlists(_userId: string): Promise<Watchlist[]> {
  return platformFetch<Watchlist[]>("/api/watchlists");
}

export async function saveUserWatchlists(_userId: string, lists: Watchlist[]): Promise<void> {
  if (lists.length === 0) return;
  await platformFetch("/api/watchlists", {
    method: "PUT",
    body: JSON.stringify({ lists }),
  });
}

export async function migrateLocalWatchlistsToSupabase(userId: string): Promise<void> {
  const local = useWatchlistStore.getState().lists;
  if (local.length === 0) return;

  try {
    const remote = await fetchUserWatchlists(userId);
    const remoteByKey = new Map(remote.map((l) => [l.id, l]));

    const merged: Watchlist[] = [];
    const seenKeys = new Set<string>();

    for (const list of local) {
      const existing = remoteByKey.get(list.id);
      const slugs = existing ? [...new Set([...existing.slugs, ...list.slugs])] : [...list.slugs];
      merged.push({
        id: list.id,
        name: list.name,
        slugs,
        createdAt: existing?.createdAt ?? list.createdAt,
      });
      seenKeys.add(list.id);
    }

    for (const list of remote) {
      if (!seenKeys.has(list.id)) merged.push(list);
    }

    await saveUserWatchlists(userId, merged);
    useWatchlistStore.getState().replaceLists(merged);
  } catch (e) {
    console.error("[watchlist] migration failed", e);
  }
}
