import { platformFetch, platformMutate, type ApiMutationResult } from "@/lib/platformApi";
import type { Comment } from "@/types/database";

export async function fetchCommentStats() {
  return platformFetch<{ today: number; week: number; month: number; topMovie: string | null }>(
    "/api/admin/comments/stats",
  );
}

export async function fetchAdminCommentsList(opts: {
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
  return platformFetch<{ rows: Comment[]; total: number }>(`/api/admin/comments?${params}`);
}

export async function deleteCommentsByIds(ids: string[]) {
  return platformMutate("/api/admin/comments", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export async function deleteCommentById(id: string) {
  return deleteCommentsByIds([id]);
}

export async function fetchRecentComments(limit = 5): Promise<Comment[]> {
  return platformFetch<Comment[]>(`/api/admin/comments/recent?limit=${limit}`);
}
