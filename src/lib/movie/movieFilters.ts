import { removeDiacritics } from "@/utils/removeDiacritics";
import type { MovieListItem } from "@/types/movie";

export type SearchQuickFilter = "all" | "vietsub" | "thuyetminh" | "longtieng" | "fhd";

export const SEARCH_QUICK_FILTERS: { id: SearchQuickFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "vietsub", label: "Vietsub" },
  { id: "thuyetminh", label: "Thuyết minh" },
  { id: "longtieng", label: "Lồng tiếng" },
  { id: "fhd", label: "FHD" },
];

export function matchesQuickFilter(movie: MovieListItem, filter: SearchQuickFilter): boolean {
  if (filter === "all") return true;
  const lang = (movie.lang ?? "").toLowerCase();
  const quality = (movie.quality ?? "").toUpperCase();
  if (filter === "vietsub") return lang.includes("vietsub");
  if (filter === "thuyetminh") return lang.includes("thuyết") || lang.includes("thuyet");
  if (filter === "longtieng") return lang.includes("lồng") || lang.includes("long");
  if (filter === "fhd") return quality === "FHD" || quality === "4K";
  return true;
}

/** Lọc client-side: không dấu + quick filter */
export function filterSearchResults(
  items: MovieListItem[],
  keyword: string,
  quickFilter: SearchQuickFilter,
): MovieListItem[] {
  const normQ = removeDiacritics(keyword.trim().toLowerCase());
  return items.filter((m) => {
    if (!matchesQuickFilter(m, quickFilter)) return false;
    if (!normQ) return true;
    const hay = removeDiacritics(`${m.name} ${m.origin_name ?? ""} ${m.slug}`.toLowerCase());
    return hay.includes(normQ);
  });
}
