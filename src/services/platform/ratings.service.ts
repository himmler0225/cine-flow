import { platformFetch } from "@/lib/platformApi";
import type { MovieRatingAggregate } from "@/types/database";

class RatingsApi {
  async fetchUserRating(movieSlug: string): Promise<number | null> {
    try {
      return await platformFetch<number | null>(
        `/api/ratings/movie/${encodeURIComponent(movieSlug)}`,
      );
    } catch {
      return null;
    }
  }
  fetchAggregate(movieSlug: string): Promise<MovieRatingAggregate> {
    return platformFetch<MovieRatingAggregate>(
      `/api/ratings/movie/${encodeURIComponent(movieSlug)}/aggregate`,
      { auth: false },
    );
  }
  async upsert(movieSlug: string, score: number): Promise<void> {
    await platformFetch(`/api/ratings/movie/${encodeURIComponent(movieSlug)}`, {
      method: "PUT",
      body: JSON.stringify({ score }),
    });
  }
}

export const ratingsApi = new RatingsApi();
