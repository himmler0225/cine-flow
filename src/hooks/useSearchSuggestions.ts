import { useQuery } from "@tanstack/react-query";
import { moviesApi } from "@/services/movies";
import { queryKeys } from "@/constants/queryKeys";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { useFavorites } from "@/hooks/useFavorites";
import { getRecentSearches } from "@/utils/searchHistory";
import type { MovieListItem } from "@/types/movie";
import { CACHE_TTL } from "@/constants/timing";

export type SearchSuggestion = {
  slug: string;
  name: string;
  thumb_url?: string;
  poster_url?: string;
  origin_name?: string;
  year?: number;
  quality?: string;
  source: "history" | "favorite" | "trending" | "recent";
};

function toSuggestion(m: MovieListItem, source: SearchSuggestion["source"]): SearchSuggestion {
  return {
    slug: m.slug,
    name: m.name,
    thumb_url: m.thumb_url,
    poster_url: m.poster_url,
    origin_name: m.origin_name,
    year: m.year,
    quality: m.quality,
    source,
  };
}

export function useSearchSuggestions(enabled: boolean) {
  const { favoritesList } = useFavorites();
  const { history } = useWatchHistory();
  const { data: trending } = useQuery({
    queryKey: queryKeys.movies.new(1),
    enabled,
    staleTime: CACHE_TTL.fiveMinutes,
    queryFn: () => moviesApi.getNewMovies(1),
  });
  const recentSearches = getRecentSearches();
  const suggestions = (() => {
    const seen = new Set<string>();
    const out: SearchSuggestion[] = [];
    const push = (item: SearchSuggestion) => {
      if (seen.has(item.slug)) return;
      seen.add(item.slug);
      out.push(item);
    };
    history.slice(0, 6).forEach((h) =>
      push({
        slug: h.movie_slug,
        name: h.movie_name,
        thumb_url: h.thumb_url ?? undefined,
        source: "history",
      }),
    );
    favoritesList.slice(0, 6).forEach((f) => push(toSuggestion(f, "favorite")));
    (trending?.items ?? []).slice(0, 6).forEach((m) => push(toSuggestion(m, "trending")));
    return out;
  })();
  return { suggestions, recentSearches };
}
