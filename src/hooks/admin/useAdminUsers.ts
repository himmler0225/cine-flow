import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchAdminUsersList,
  fetchUserFavorites,
  fetchUserWatchHistory,
} from "@/services/platform/admin/users.admin";

export interface AdminUsersQuery {
  query: string;
  sort: "new" | "name";
  filter: "all" | "free" | "premium" | "admin";
  page: number;
  pageSize: number;
}

export function useAdminUsers(params: AdminUsersQuery) {
  return useQuery({
    queryKey: queryKeys.admin.users(params.query, params.sort, params.filter, params.page),
    queryFn: () => fetchAdminUsersList(params),
  });
}

export function useAdminUserDetail(userId: string, tab: "history" | "favorites" | "stats") {
  const history = useQuery({
    queryKey: queryKeys.admin.userHistory(userId),
    enabled: !!userId,
    queryFn: () => fetchUserWatchHistory(userId),
  });

  const favorites = useQuery({
    queryKey: queryKeys.admin.userFavorites(userId),
    enabled: !!userId && tab === "favorites",
    queryFn: () => fetchUserFavorites(userId),
  });

  return { history, favorites };
}
