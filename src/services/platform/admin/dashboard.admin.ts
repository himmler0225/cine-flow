import { platformFetch } from "@/lib/platformApi";
import { pctChange } from "@/types/admin";

type DashboardLinePoint = { date: string; views: number; watches: number };
type DashboardPageTypeSlice = { name: string; value: number };
type DashboardTopMovie = { slug: string; name: string; views: number; avg: number };
type DashboardTopKeyword = { keyword: string; searches: number; ctr: number };

export async function fetchDashboardStats(from: string, prevFrom: string) {
  const params = new URLSearchParams({ from, prevFrom });
  return platformFetch<{
    totalUsers: number;
    pageViews: { now: number; change: number };
    watch: { now: number; change: number };
    rooms: { now: number; change: number };
    users: { change: number };
  }>(`/api/admin/dashboard/stats?${params}`);
}

export async function fetchDashboardLineData(from: string, days: number) {
  const params = new URLSearchParams({ from, days: String(days) });
  return platformFetch<DashboardLinePoint[]>(`/api/admin/dashboard/line?${params}`);
}

export async function fetchPageTypeDistribution(from: string) {
  return platformFetch<DashboardPageTypeSlice[]>(
    `/api/admin/dashboard/page-types?from=${encodeURIComponent(from)}`,
  );
}

export async function fetchTopMovies(from: string, limit = 10) {
  return platformFetch<DashboardTopMovie[]>(
    `/api/admin/dashboard/top-movies?from=${encodeURIComponent(from)}&limit=${limit}`,
  );
}

export async function fetchTopKeywords(from: string, limit = 10) {
  return platformFetch<DashboardTopKeyword[]>(
    `/api/admin/dashboard/top-keywords?from=${encodeURIComponent(from)}&limit=${limit}`,
  );
}

export { pctChange };
