import { platformFetch } from "@/lib/platformApi";
import type { Comment, InsertCommentInput } from "@/types/database";

class CommentsApi {
  fetchByMovie(
    slug: string,
    options: {
      episodeName?: string | null;
      limit?: number;
    } = {},
  ): Promise<Comment[]> {
    const limit = options.limit ?? 50;

    return platformFetch<Comment[]>(
      `/api/comments/movie/${encodeURIComponent(slug)}?limit=${limit}`,
      { auth: false },
    );
  }
  async insert(input: InsertCommentInput): Promise<void> {
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
}

export const commentsApi = new CommentsApi();
