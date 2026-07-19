import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchDashboardLineData,
  fetchDashboardStats,
  fetchPageTypeDistribution,
  fetchTopKeywords,
  fetchTopMovies,
} from "@/services/platform/admin/dashboard.admin";
import { fetchRecentComments } from "@/services/platform/admin/comments.admin";
import { fetchRecentUsers } from "@/services/platform/admin/users.admin";

export function useAdminDashboard(
  dateRange: string,
  from: string,
  prevFrom: string,
  rangeDays: number,
) {
  const stats = useQuery({
    queryKey: queryKeys.admin.stats(dateRange),
    queryFn: () => fetchDashboardStats(from, prevFrom),
  });

  const lineData = useQuery({
    queryKey: queryKeys.admin.line(dateRange),
    queryFn: () => fetchDashboardLineData(from, rangeDays),
  });

  const pieData = useQuery({
    queryKey: queryKeys.admin.pageType(dateRange),
    queryFn: () => fetchPageTypeDistribution(from),
  });

  const topMovies = useQuery({
    queryKey: queryKeys.admin.topMovies(dateRange),
    queryFn: () => fetchTopMovies(from),
  });

  const topKeywords = useQuery({
    queryKey: queryKeys.admin.topKeywords(dateRange),
    queryFn: () => fetchTopKeywords(from),
  });

  const recentUsers = useQuery({
    queryKey: queryKeys.admin.recentUsers(),
    queryFn: () => fetchRecentUsers(),
  });

  const recentComments = useQuery({
    queryKey: queryKeys.admin.recentComments(),
    queryFn: () => fetchRecentComments(),
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
