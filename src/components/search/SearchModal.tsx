import { useEffect, useMemo } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { filterSearchResults } from "@/lib/movie/movieFilters";
import { pushRecentSearch } from "@/utils/searchHistory";
import { SearchModalShell } from "@/components/search/SearchModalShell";
import { SearchInputBar } from "@/components/search/SearchInputBar";
import { SearchQuickFilters } from "@/components/search/SearchQuickFilters";
import { SearchSuggestionsPanel } from "@/components/search/SearchSuggestionsPanel";
import { SearchResultsPanel } from "@/components/search/SearchResultsPanel";
import { useSearchModalStore } from "@/components/search/store/searchModalStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchModal({ open, onClose }: Props) {
  const q = useSearchModalStore((s) => s.q);
  const quickFilter = useSearchModalStore((s) => s.quickFilter);
  const reset = useSearchModalStore((s) => s.reset);

  const { data, isFetching, debounced } = useSearch(q);
  const { suggestions, recentSearches } = useSearchSuggestions(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const rawItems = data?.pages.flatMap((p) => p.items ?? []) ?? [];
  const items = useMemo(
    () => filterSearchResults(rawItems, debounced, quickFilter),
    [rawItems, debounced, quickFilter],
  );

  const showSuggestions = debounced.length < 2;

  const handleResultClick = () => {
    if (debounced.length >= 2) pushRecentSearch(debounced);
    onClose();
  };

  return (
    <SearchModalShell open={open} onClose={onClose}>
      <SearchInputBar isFetching={isFetching} onClose={onClose} />
      <SearchQuickFilters />
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {showSuggestions ? (
          <SearchSuggestionsPanel
            recentSearches={recentSearches}
            suggestions={suggestions}
            onResultClick={handleResultClick}
          />
        ) : (
          <SearchResultsPanel
            debounced={debounced}
            quickFilter={quickFilter}
            isFetching={isFetching}
            items={items}
            onResultClick={handleResultClick}
          />
        )}
      </div>
    </SearchModalShell>
  );
}
