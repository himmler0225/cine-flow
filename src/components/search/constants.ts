import type { SearchQuickFilter } from "@/lib/movie/movieFilters";

export const FILTER_LABEL_KEYS: Record<SearchQuickFilter, string> = {
  all: "search.filters.all",
  vietsub: "filters.vietsub",
  thuyetminh: "filters.dubbed",
  longtieng: "filters.voiceOver",
  fhd: "FHD",
};

export const SOURCE_KEYS = {
  history: "search.source.history",
  favorite: "search.source.favorite",
  trending: "search.source.trending",
  recent: "search.source.recent",
} as const;
