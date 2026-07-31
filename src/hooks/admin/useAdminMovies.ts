import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { adminMoviesApi } from "@/services/platform/admin/movies.admin";

export function useAdminMovies(dateRange: string, from: string) {
  return useQuery({
    queryKey: queryKeys.admin.movies(dateRange),
    queryFn: () => adminMoviesApi.fetchAggregates(from),
  });
}

export function useAdminMovieStats(
  slug: string,
  dateRange: string,
  from: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.admin.movieDetail(slug, dateRange),
    enabled,
    queryFn: () => adminMoviesApi.fetchWatchEvents(slug, from),
  });
}
