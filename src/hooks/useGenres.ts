import { useQuery } from "@tanstack/react-query";
import { CACHE_TTL } from "@/constants/timing";
import { genreService, countryService } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";

export const useGenres = () =>
  useQuery({
    queryKey: queryKeys.genres.all(),
    queryFn: () => genreService.getAll(),
    staleTime: CACHE_TTL.hour,
  });

export const useCountries = () =>
  useQuery({
    queryKey: queryKeys.countries.all(),
    queryFn: () => countryService.getAll(),
    staleTime: CACHE_TTL.hour,
  });
