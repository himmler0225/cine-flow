import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { SearchResultItem } from "@/components/search/SearchListItems";

type Props = {
  debounced: string;
  quickFilter: string;
  isFetching: boolean;
  items: MovieListItem[];
  onResultClick: () => void;
};

export function SearchResultsPanel({
  debounced,
  quickFilter,
  isFetching,
  items,
  onResultClick,
}: Props) {
  const { t } = useTranslation();

  if (debounced.length >= 2 && isFetching && items.length === 0) {
    return (
      <ul className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded px-3 py-2">
            <div className="h-16 w-12 flex-none animate-pulse rounded bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
              <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (debounced.length >= 2 && !isFetching && items.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-netflix-muted">
        {quickFilter !== "all"
          ? t("search.noResultsWithFilter")
          : t("search.noResults", { q: debounced })}
      </p>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <ul className="divide-y divide-white/5">
        {items.slice(0, 12).map((m, i) => (
          <SearchResultItem key={m.slug} movie={m} onClose={onResultClick} eager={i < 4} />
        ))}
      </ul>
      {items.length > 12 && (
        <Link
          to="/search"
          search={{ q: debounced }}
          onClick={onResultClick}
          className="block px-3 py-3 text-center text-sm text-netflix-red hover:underline"
        >
          {t("search.viewAllResults", { count: items.length })}
        </Link>
      )}
    </>
  );
}
