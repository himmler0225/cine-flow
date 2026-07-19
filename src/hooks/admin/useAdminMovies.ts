import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  fetchMovieAggregates,
  fetchMovieWatchEvents,
} from "@/services/platform/admin/movies.admin";

export function useAdminMovies(dateRange: string, from: string) {
  return useQuery({
    queryKey: queryKeys.admin.movies(dateRange),
    queryFn: () => fetchMovieAggregates(from),
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
    queryFn: () => fetchMovieWatchEvents(slug, from),
  });
}
