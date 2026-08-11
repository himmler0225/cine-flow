import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { adminAnalyticsApi } from "@/services/platform/admin/analytics.admin";

export function useAdminAnalytics(dateRange: string, from: string) {
  const search = useQuery({
    queryKey: queryKeys.admin.analyticsSearch(dateRange),
    queryFn: () => adminAnalyticsApi.fetchSearchAnalytics(from),
  });

  const hourly = useQuery({
    queryKey: queryKeys.admin.analyticsHourly(dateRange),
    queryFn: () => adminAnalyticsApi.fetchHourlyWatchViews(from),
  });

  const rooms = useQuery({
    queryKey: queryKeys.admin.analyticsRooms(dateRange),
    queryFn: () => adminAnalyticsApi.fetchRoomAnalytics(from),
  });

  const langQuality = useQuery({
    queryKey: queryKeys.admin.analyticsLangQuality(dateRange),
    queryFn: () => adminAnalyticsApi.fetchLangQualityDistribution(from),
  });

  return { search, hourly, rooms, langQuality };
}
