import { platformFetch } from "@/lib/platformApi";
import type { Watchlist } from "@/store/watchlistStore";
import { useWatchlistStore } from "@/store/watchlistStore";

class WatchlistApi {
  fetch(): Promise<Watchlist[]> {
    return platformFetch<Watchlist[]>("/api/watchlists");
  }
  async save(lists: Watchlist[]): Promise<void> {
    if (lists.length === 0) return;
    await platformFetch("/api/watchlists", {
      method: "PUT",
      body: JSON.stringify({ lists }),
    });
  }
  async migrateLocalToServer(): Promise<void> {
    const local = useWatchlistStore.getState().lists;
    if (local.length === 0) return;
    try {
      const remote = await this.fetch();
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
      await this.save(merged);
      useWatchlistStore.getState().replaceLists(merged);
    } catch (e) {
      console.error("[watchlist] migration failed", e);
    }
  }
}

export const watchlistApi = new WatchlistApi();
