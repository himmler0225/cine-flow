import { platformFetch } from "@/lib/platformApi";

type SearchAnalytics = {
  top: Array<{
    keyword: string;
    searches: number;
    avgResults: number;
    ctr: number;
  }>;
  noResults: Array<{
    keyword: string;
    searches: number;
  }>;
};

type HourlyWatchAnalytics = {
  hours: Array<{
    hour: string;
    views: number;
  }>;
  peak: {
    hour: string;
    views: number;
  };
};

type RoomAnalytics = {
  today: number;
  avgMembers: number;
  avgMsgs: number;
  avgDuration: number;
  days: Array<{
    date: string;
    value: number;
  }>;
};

type LangQualityDistribution = {
  lang: Array<{
    name: string;
    value: number;
  }>;
  quality: Array<{
    name: string;
    value: number;
  }>;
};

class AdminAnalyticsApi {
  fetchSearchAnalytics(from: string) {
    return platformFetch<SearchAnalytics>(
      `/api/admin/analytics/search?from=${encodeURIComponent(from)}`,
    );
  }
  fetchHourlyWatchViews(from: string) {
    return platformFetch<HourlyWatchAnalytics>(
      `/api/admin/analytics/hourly?from=${encodeURIComponent(from)}`,
    );
  }
  fetchRoomAnalytics(from: string) {
    return platformFetch<RoomAnalytics>(
      `/api/admin/analytics/rooms?from=${encodeURIComponent(from)}`,
    );
  }
  fetchLangQualityDistribution(from: string) {
    return platformFetch<LangQualityDistribution>(
      `/api/admin/analytics/lang-quality?from=${encodeURIComponent(from)}`,
    );
  }
}

export const adminAnalyticsApi = new AdminAnalyticsApi();
