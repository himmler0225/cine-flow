import { platformFetch, platformMutate } from "@/lib/platformApi";
import type { Comment } from "@/types/database";

class AdminCommentsApi {
  fetchStats() {
    return platformFetch<{
      today: number;
      week: number;
      month: number;
      topMovie: string | null;
    }>("/api/admin/comments/stats");
  }
  fetchList(opts: {
    query: string;
    movie: string;
    sort: "new" | "likes";
    page: number;
    pageSize: number;
  }) {
    const params = new URLSearchParams({
      query: opts.query,
      movie: opts.movie,
      sort: opts.sort,
      page: String(opts.page),
      pageSize: String(opts.pageSize),
    });

    return platformFetch<{
      rows: Comment[];
      total: number;
    }>(`/api/admin/comments?${params}`);
  }
  deleteByIds(ids: string[]) {
    return platformMutate("/api/admin/comments", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }
  deleteById(id: string) {
    return this.deleteByIds([id]);
  }
  fetchRecent(limit = 5): Promise<Comment[]> {
    return platformFetch<Comment[]>(`/api/admin/comments/recent?limit=${limit}`);
  }
}

export const adminCommentsApi = new AdminCommentsApi();
