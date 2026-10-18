import { platformFetch } from "@/lib/platformApi";
import type { Watchlist } from "@/store/watchlistStore";

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
}

export const watchlistApi = new WatchlistApi();
