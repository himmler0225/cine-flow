import { platformFetch } from "@/lib/platformApi";
import { type WatchHistoryItem, getLocalHistory, clearLocalHistory } from "@/utils/localHistory";

export async function fetchWatchHistory(_userId: string): Promise<WatchHistoryItem[]> {
  return platformFetch<WatchHistoryItem[]>("/api/watch-history");
}

export async function upsertWatchProgress(_userId: string, item: WatchHistoryItem): Promise<void> {
  await platformFetch("/api/watch-history", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function deleteWatchHistoryItem(
  _userId: string,
  movieSlug: string,
  episodeName: string,
) {
  await platformFetch(
    `/api/watch-history/${encodeURIComponent(movieSlug)}/${encodeURIComponent(episodeName)}`,
    { method: "DELETE" },
  );
  return { error: null };
}

export async function clearWatchHistory(_userId: string) {
  await platformFetch("/api/watch-history", { method: "DELETE" });
  return { error: null };
}

export async function migrateLocalHistoryToSupabase(userId: string): Promise<void> {
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
