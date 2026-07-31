import { platformFetch } from "@/lib/platformApi";
import { type WatchHistoryItem, getLocalHistory, clearLocalHistory } from "@/utils/localHistory";

class WatchHistoryApi {
  fetch(): Promise<WatchHistoryItem[]> {
    return platformFetch<WatchHistoryItem[]>("/api/watch-history");
  }
  async upsertProgress(item: WatchHistoryItem): Promise<void> {
    await platformFetch("/api/watch-history", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }
  async deleteItem(movieSlug: string, episodeName: string) {
    await platformFetch(
      `/api/watch-history/${encodeURIComponent(movieSlug)}/${encodeURIComponent(episodeName)}`,
      { method: "DELETE" },
    );
    return { error: null };
  }
  async clear() {
    await platformFetch("/api/watch-history", { method: "DELETE" });
    return { error: null };
  }
  async migrateLocalToServer(): Promise<void> {
    const local = getLocalHistory();
    if (local.length === 0) return;
    try {
      await platformFetch("/api/watch-history/batch", {
        method: "POST",
        body: JSON.stringify({ items: local }),
      });
      clearLocalHistory();
    } catch (e) {
      console.error("[watch_history] migration failed", e);
    }
  }
}

export const watchHistoryApi = new WatchHistoryApi();
