import { platformFetch } from "@/lib/platformApi";
import type { WatchHistoryItem } from "@/utils/watchHistoryMerge";

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
  /** One-off import of history saved in the browser by older app versions. */
  async importItems(items: WatchHistoryItem[]): Promise<void> {
    if (items.length === 0) return;

    await platformFetch("/api/watch-history/batch", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }
}

export const watchHistoryApi = new WatchHistoryApi();
