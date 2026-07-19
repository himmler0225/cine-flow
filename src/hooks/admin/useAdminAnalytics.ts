import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchHourlyWatchViews,
  fetchLangQualityDistribution,
  fetchRoomAnalytics,
  fetchSearchAnalytics,
} from "@/services/platform/admin/analytics.admin";

export function useAdminAnalytics(dateRange: string, from: string) {
  const search = useQuery({
    queryKey: queryKeys.admin.analyticsSearch(dateRange),
    queryFn: () => fetchSearchAnalytics(from),
  });

  const hourly = useQuery({
    queryKey: queryKeys.admin.analyticsHourly(dateRange),
    queryFn: () => fetchHourlyWatchViews(from),
  });

  const rooms = useQuery({
    queryKey: queryKeys.admin.analyticsRooms(dateRange),
    queryFn: () => fetchRoomAnalytics(from),
  });

  const langQuality = useQuery({
    queryKey: queryKeys.admin.analyticsLangQuality(dateRange),
    queryFn: () => fetchLangQualityDistribution(from),
  });

  return { search, hourly, rooms, langQuality };
}
