import { useQuery } from "@tanstack/react-query";
import { CACHE_TTL } from "@/constants/timing";
import { genresApi, countriesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";

export const useGenres = () =>
  useQuery({
    queryKey: queryKeys.genres.all(),
    queryFn: () => genresApi.getAll(),
    staleTime: CACHE_TTL.hour,
  });

export const useCountries = () =>
  useQuery({
    queryKey: queryKeys.countries.all(),
    queryFn: () => countriesApi.getAll(),
    staleTime: CACHE_TTL.hour,
  });
