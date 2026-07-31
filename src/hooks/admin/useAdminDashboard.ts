import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { adminDashboardApi } from "@/services/platform/admin/dashboard.admin";
import { adminCommentsApi } from "@/services/platform/admin/comments.admin";
import { adminUsersApi } from "@/services/platform/admin/users.admin";

export function useAdminDashboard(
  dateRange: string,
  from: string,
  prevFrom: string,
  rangeDays: number,
) {
  const stats = useQuery({
    queryKey: queryKeys.admin.stats(dateRange),
    queryFn: () => adminDashboardApi.fetchStats(from, prevFrom),
  });
  const lineData = useQuery({
    queryKey: queryKeys.admin.line(dateRange),
    queryFn: () => adminDashboardApi.fetchLineData(from, rangeDays),
  });
  const pieData = useQuery({
    queryKey: queryKeys.admin.pageType(dateRange),
    queryFn: () => adminDashboardApi.fetchPageTypeDistribution(from),
  });
  const topMovies = useQuery({
    queryKey: queryKeys.admin.topMovies(dateRange),
    queryFn: () => adminDashboardApi.fetchTopMovies(from),
  });
  const topKeywords = useQuery({
    queryKey: queryKeys.admin.topKeywords(dateRange),
    queryFn: () => adminDashboardApi.fetchTopKeywords(from),
  });
  const recentUsers = useQuery({
    queryKey: queryKeys.admin.recentUsers(),
    queryFn: () => adminUsersApi.fetchRecent(),
  });
  const recentComments = useQuery({
    queryKey: queryKeys.admin.recentComments(),
    queryFn: () => adminCommentsApi.fetchRecent(),
  });
  return {
    stats,
    lineData,
    pieData,
    topMovies,
    topKeywords,
    recentUsers,
    recentComments,
  };
}
