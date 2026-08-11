import { useEffect } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { moviesApi, type MovieFilterParams } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { getNextPage } from "@/utils/pagination";

const STALE_LIST = CACHE_TTL.threeMinutes;

const STALE_LIST_LONG = CACHE_TTL.tenMinutes;

const LIST_GC = CACHE_TTL.thirtyMinutes;

export const usePagedByGenre = (slug: string, page: number, filters: MovieFilterParams = {}) => {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["movies", "genre-page", slug, page, filters],
    queryFn: () => moviesApi.getByGenre(slug, page, filters),
    enabled: !!slug,
    placeholderData: keepPreviousData,
    staleTime: STALE_LIST_LONG,
    gcTime: LIST_GC,
  });

  const total = q.data?.pagination?.totalPages ?? 0;

  useEffect(() => {
    if (!slug || page >= total) return;

    qc.prefetchQuery({
      queryKey: ["movies", "genre-page", slug, page + 1, filters],
      queryFn: () => moviesApi.getByGenre(slug, page + 1, filters),
      staleTime: STALE_LIST_LONG,
    });
  }, [qc, slug, page, total, filters]);

  return q;
};

export const usePagedByCountry = (slug: string, page: number, filters: MovieFilterParams = {}) => {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["movies", "country-page", slug, page, filters],
    queryFn: () => moviesApi.getByCountry(slug, page, filters),
    enabled: !!slug,
    placeholderData: keepPreviousData,
    staleTime: STALE_LIST_LONG,
    gcTime: LIST_GC,
  });

  const total = q.data?.pagination?.totalPages ?? 0;

  useEffect(() => {
    if (!slug || page >= total) return;

    qc.prefetchQuery({
      queryKey: ["movies", "country-page", slug, page + 1, filters],
      queryFn: () => moviesApi.getByCountry(slug, page + 1, filters),
      staleTime: STALE_LIST_LONG,
    });
  }, [qc, slug, page, total, filters]);

  return q;
};

export const usePagedByYear = (year: number, page: number, filters: MovieFilterParams = {}) => {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["movies", "year-page", year, page, filters],
    queryFn: () => moviesApi.getByYear(year, page, filters),
    enabled: !!year,
    placeholderData: keepPreviousData,
    staleTime: STALE_LIST_LONG,
    gcTime: LIST_GC,
  });

  const total = q.data?.pagination?.totalPages ?? 0;

  useEffect(() => {
    if (!year || page >= total) return;

    qc.prefetchQuery({
      queryKey: ["movies", "year-page", year, page + 1, filters],
      queryFn: () => moviesApi.getByYear(year, page + 1, filters),
      staleTime: STALE_LIST_LONG,
    });
  }, [qc, year, page, total, filters]);

  return q;
};

export const useNewMovies = (page = 1) =>
  useQuery({
    queryKey: queryKeys.movies.new(page),
    queryFn: () => moviesApi.getNewMovies(page),
    staleTime: STALE_LIST,
    placeholderData: keepPreviousData,
  });

export const useMoviesByType = (type: string, page = 1) =>
  useQuery({
    queryKey: queryKeys.movies.byType(type, page),
    queryFn: () => moviesApi.getMoviesByType(type, page),
    enabled: !!type,
    staleTime: STALE_LIST,
  });

export const useMoviesByTypePaged = (type: string, page: number, filters: MovieFilterParams = {}) =>
  useQuery({
    queryKey: queryKeys.movies.listPage(type, page, filters),
    queryFn: () => moviesApi.getMoviesByType(type, page, filters),
    enabled: !!type,
    placeholderData: keepPreviousData,
    staleTime: STALE_LIST_LONG,
    gcTime: LIST_GC,
  });

export const useInfiniteMoviesByType = (type: string, filters: MovieFilterParams = {}) =>
  useInfiniteQuery({
    queryKey: ["movies", "type-inf", type, filters],
    queryFn: ({ pageParam }) => moviesApi.getMoviesByType(type, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => getNextPage(last.pagination),
    enabled: !!type,
    staleTime: STALE_LIST,
  });

export const useInfiniteByGenre = (slug: string, filters: MovieFilterParams = {}) =>
  useInfiniteQuery({
    queryKey: ["movies", "genre-inf", slug, filters],
    queryFn: ({ pageParam }) => moviesApi.getByGenre(slug, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => getNextPage(last.pagination),
    enabled: !!slug,
    staleTime: STALE_LIST,
  });

export const useInfiniteByCountry = (slug: string, filters: MovieFilterParams = {}) =>
  useInfiniteQuery({
    queryKey: ["movies", "country-inf", slug, filters],
    queryFn: ({ pageParam }) => moviesApi.getByCountry(slug, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => getNextPage(last.pagination),
    enabled: !!slug,
    staleTime: STALE_LIST,
  });

export const useInfiniteByYear = (year: number, filters: MovieFilterParams = {}) =>
  useInfiniteQuery({
    queryKey: ["movies", "year-inf", year, filters],
    queryFn: ({ pageParam }) => moviesApi.getByYear(year, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => getNextPage(last.pagination),
    enabled: !!year,
    staleTime: STALE_LIST,
  });
