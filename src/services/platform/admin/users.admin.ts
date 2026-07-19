import { platformFetch, platformMutate, type ApiMutationResult } from "@/lib/platformApi";
import type { AdminProfileRow } from "@/types/admin";
import type { Favorite } from "@/types/database";
import type { WatchHistoryItem } from "@/utils/localHistory";

export async function fetchAdminUsersList(opts: {
  query: string;
  sort: "new" | "name";
  filter: "all" | "free" | "premium" | "admin";
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
  return platformFetch<{ rows: AdminProfileRow[]; total: number }>(`/api/admin/users?${params}`);
}

export async function updateUserRole(userId: string, role: string): Promise<ApiMutationResult> {
  return platformMutate(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function fetchUserWatchHistory(userId: string, limit = 50) {
  return platformFetch<WatchHistoryItem[]>(`/api/watch-history?userId=${userId}&limit=${limit}`);
}

export async function fetchUserFavorites(userId: string) {
  return platformFetch<Favorite[]>(`/api/favorites?userId=${userId}`);
}

export async function fetchRecentUsers(limit = 8) {
  return platformFetch<AdminProfileRow[]>(`/api/admin/users/recent?limit=${limit}`);
}
