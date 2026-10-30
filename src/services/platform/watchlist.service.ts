import { platformFetch } from "@/lib/platformApi";
import type { Watchlist } from "@/store/watchlistStore";

export type SharedWatchlist = {
  name: string;
  slugs: string[];
  createdAt: number;
  owner: { name: string | null; avatarUrl: string | null };
};

class WatchlistApi {
  fetch(): Promise<Watchlist[]> {
    return platformFetch<Watchlist[]>("/api/watchlists");
  }
  async save(lists: Watchlist[]): Promise<void> {
    await platformFetch("/api/watchlists", {
      method: "PUT",
      body: JSON.stringify({ lists }),
    });
  }
  share(listId: string, isPublic: boolean) {
    return platformFetch<{ isPublic: boolean; shareId: string | null }>(
      `/api/watchlists/${encodeURIComponent(listId)}/share`,
      { method: "PUT", body: JSON.stringify({ public: isPublic }) },
    );
  }
  shared(shareId: string) {
    return platformFetch<SharedWatchlist>(`/api/watchlists/shared/${encodeURIComponent(shareId)}`, {
      auth: false,
    });
  }
}

export const watchlistApi = new WatchlistApi();
