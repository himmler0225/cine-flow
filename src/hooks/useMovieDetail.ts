import { useQuery } from "@tanstack/react-query";
import { CACHE_TTL } from "@/constants/timing";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";

type MovieDetailData = Awaited<ReturnType<typeof moviesApi.getMovieDetail>>;

interface MovieDetailOptions<TData> {
  enabled?: boolean;
  staleTime?: number;
  select?: (data: MovieDetailData) => TData;
}

export const useMovieDetail = <TData = MovieDetailData>(
  slug: string,
  options: MovieDetailOptions<TData> = {},
) =>
  useQuery({
    queryKey: queryKeys.movies.detail(slug),
    queryFn: () => moviesApi.getMovieDetail(slug),
    enabled: options.enabled ?? !!slug,
    staleTime: options.staleTime ?? CACHE_TTL.tenMinutes,
    select: options.select,
  });
