import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MovieListItem } from "@/types/movie";
import { SearchResultItem } from "@/components/search/SearchListItems";
import { useGenres } from "@/hooks/useGenres";

type Props = {
  debounced: string;
  quickFilter: string;
  isFetching: boolean;
  items: MovieListItem[];
  activeIndex: number;
  onResultClick: () => void;
};

export function SearchResultsPanel({
  debounced,
  quickFilter,
  isFetching,
  items,
  activeIndex,
  onResultClick,
}: Props) {
  const { t } = useTranslation();

  const { data: genres } = useGenres();

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
    const chips = (genres ?? []).slice(0, 8);

    return (
      <div className="px-3 py-6 text-center">
        <p className="text-sm text-netflix-muted">
          {quickFilter !== "all"
            ? t("search.noResultsWithFilter")
            : t("search.noResults", { q: debounced })}
        </p>
        {chips.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netflix-muted">
              {t("search.browseGenres")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {chips.map((g) => (
                <Link
                  key={g.slug}
                  to="/genre/$slug"
                  params={{ slug: g.slug }}
                  onClick={onResultClick}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white hover:border-netflix-red"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) return null;

  const visible = items.slice(0, 12);

  return (
    <>
      <ul className="divide-y divide-white/5">
        {visible.map((m, i) => (
          <SearchResultItem
            key={m.slug}
            movie={m}
            onClose={onResultClick}
            eager={i < 4}
            active={i === activeIndex}
          />
        ))}
      </ul>
      <Link
        to="/search"
        search={{ q: debounced }}
        onClick={onResultClick}
        className="mt-1 block rounded-lg px-3 py-3 text-center text-sm font-medium text-netflix-red hover:bg-netflix-red/10"
      >
        {t("search.viewAllResults", { count: items.length })}
      </Link>
    </>
  );
}
