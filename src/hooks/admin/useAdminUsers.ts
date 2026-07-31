import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { adminUsersApi } from "@/services/platform/admin/users.admin";
import type { AdminUserFilter } from "@/constants/roles";

export interface AdminUsersQuery {
  query: string;
  sort: "new" | "name";
  filter: AdminUserFilter;
  page: number;
  pageSize: number;
}

export function useAdminUsers(params: AdminUsersQuery) {
  return useQuery({
    queryKey: queryKeys.admin.users(params.query, params.sort, params.filter, params.page),
    queryFn: () => adminUsersApi.fetchList(params),
  });
}

export function useAdminUserDetail(userId: string, tab: "history" | "favorites" | "stats") {
  const history = useQuery({
    queryKey: queryKeys.admin.userHistory(userId),
    enabled: !!userId,
    queryFn: () => adminUsersApi.fetchUserWatchHistory(userId),
  });
  const favorites = useQuery({
    queryKey: queryKeys.admin.userFavorites(userId),
    enabled: !!userId && tab === "favorites",
    queryFn: () => adminUsersApi.fetchUserFavorites(userId),
  });
  return { history, favorites };
}
