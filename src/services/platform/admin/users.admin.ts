import { platformFetch, platformMutate, type ApiMutationResult } from "@/lib/platformApi";
import type { AdminProfileRow } from "@/types/admin";
import type { Favorite } from "@/types/database";
import type { WatchHistoryItem } from "@/utils/localHistory";
import type { AdminUserFilter, UserRole } from "@/constants/roles";

class AdminUsersApi {
  fetchList(opts: {
    query: string;
    sort: "new" | "name";
    filter: AdminUserFilter;
    page: number;
    pageSize: number;
  }) {
    const params = new URLSearchParams({
      query: opts.query,
      sort: opts.sort,
      filter: opts.filter,
      page: String(opts.page),
      pageSize: String(opts.pageSize),
    });

    return platformFetch<{
      rows: AdminProfileRow[];
      total: number;
    }>(`/api/admin/users?${params}`);
  }
  updateRole(userId: string, role: UserRole): Promise<ApiMutationResult> {
    return platformMutate(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }
  updateStatus(userId: string, status: "approved" | "rejected"): Promise<ApiMutationResult> {
    return platformMutate(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
  fetchUserWatchHistory(userId: string, limit = 50) {
    return platformFetch<WatchHistoryItem[]>(
      `/api/admin/users/${userId}/watch-history?limit=${limit}`,
    );
  }
  fetchUserFavorites(userId: string) {
    return platformFetch<Favorite[]>(`/api/admin/users/${userId}/favorites`);
  }
  fetchRecent(limit = 8) {
    return platformFetch<AdminProfileRow[]>(`/api/admin/users/recent?limit=${limit}`);
  }
}

export const adminUsersApi = new AdminUsersApi();
