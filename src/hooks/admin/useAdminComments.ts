import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchAdminCommentsList,
  fetchCommentStats,
} from "@/services/platform/admin/comments.admin";

export interface AdminCommentsQuery {
  query: string;
  movie: string;
  sort: "new" | "likes";
  page: number;
  pageSize: number;
}

export function useAdminCommentStats() {
  return useQuery({
    queryKey: queryKeys.admin.commentStats(),
    queryFn: fetchCommentStats,
  });
}

export function useAdminCommentsList(params: AdminCommentsQuery) {
  return useQuery({
    queryKey: queryKeys.admin.comments(params.query, params.movie, params.sort, params.page),
    queryFn: () => fetchAdminCommentsList(params),
  });
}
