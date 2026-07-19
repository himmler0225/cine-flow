import { platformFetch } from "@/lib/platformApi";
import type { MovieRatingAggregate } from "@/types/database";

export async function fetchUserRating(_userId: string, movieSlug: string): Promise<number | null> {
  try {
    return await platformFetch<number | null>(
      `/api/ratings/movie/${encodeURIComponent(movieSlug)}`,
    );
  } catch {
    return null;
  }
}

export async function fetchRatingAggregate(movieSlug: string): Promise<MovieRatingAggregate> {
  return platformFetch<MovieRatingAggregate>(
    `/api/ratings/movie/${encodeURIComponent(movieSlug)}/aggregate`,
    { auth: false },
  );
}

export async function upsertRating(
  _userId: string,
  movieSlug: string,
  score: number,
): Promise<void> {
  await platformFetch(`/api/ratings/movie/${encodeURIComponent(movieSlug)}`, {
    method: "PUT",
    body: JSON.stringify({ score }),
  });
}
