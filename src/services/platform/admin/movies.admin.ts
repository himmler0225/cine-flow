import { platformFetch } from "@/lib/platformApi";
import type { MovieAgg } from "@/types/admin";

type MovieWatchEvent = {
  started_at: string;
  episode_name: string | null;
  server_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

class AdminMoviesApi {
  fetchAggregates(from: string): Promise<MovieAgg[]> {
    return platformFetch<MovieAgg[]>(
      `/api/admin/dashboard/top-movies?from=${encodeURIComponent(from)}`,
    );
  }
  fetchWatchEvents(slug: string, from: string) {
    return platformFetch<MovieWatchEvent[]>(
      `/api/admin/movies/${encodeURIComponent(slug)}/events?from=${encodeURIComponent(from)}`,
    );
  }
}

export const adminMoviesApi = new AdminMoviesApi();
