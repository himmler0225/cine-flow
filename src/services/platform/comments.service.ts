import { platformFetch } from "@/lib/platformApi";
import type { Comment, InsertCommentInput } from "@/types/database";

export const COMMENT_BASE_COLUMNS = "id, user_id, movie_slug, content, likes, created_at";

export async function fetchCommentsByMovie(
  slug: string,
  options: { episodeName?: string | null; limit?: number } = {},
): Promise<Comment[]> {
  const limit = options.limit ?? 50;
  return platformFetch<Comment[]>(
    `/api/comments/movie/${encodeURIComponent(slug)}?limit=${limit}`,
    { auth: false },
  );
}

export async function insertComment(input: InsertCommentInput): Promise<void> {
  await platformFetch("/api/comments", {
    method: "POST",
    body: JSON.stringify({
      movie_slug: input.movieSlug,
      content: input.content,
      is_spoiler: input.isSpoiler,
      episode_name: input.episodeName,
    }),
  });
}

// Legacy helpers kept for admin imports
export async function mapCommentRows<T extends { user_id: string }>(rows: T[]): Promise<Comment[]> {
  return rows as unknown as Comment[];
}
