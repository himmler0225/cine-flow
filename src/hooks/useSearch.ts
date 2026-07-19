import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { movieService } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL, UI_DELAY_MS } from "@/constants/timing";
import { getNextPage } from "@/utils/pagination";

export const useDebounced = <T>(value: T, ms: number = UI_DELAY_MS.debounceDefault) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export const useSearch = (keyword: string) => {
  const debounced = useDebounced(keyword.trim(), UI_DELAY_MS.searchDebounce);
  const query = useInfiniteQuery({
    queryKey: queryKeys.movies.searchInfinite(debounced),
    queryFn: ({ pageParam }) => movieService.searchMovies(debounced, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => getNextPage(last.pagination),
    enabled: debounced.length >= 2,
    staleTime: CACHE_TTL.minute,
  });
  return { ...query, debounced };
};
