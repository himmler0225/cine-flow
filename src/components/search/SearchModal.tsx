import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = useSearchModalStore((s) => s.q);
  const quickFilter = useSearchModalStore((s) => s.quickFilter);
  const reset = useSearchModalStore((s) => s.reset);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const { data, isFetching, debounced } = useSearch(q);
  const { suggestions, recentSearches } = useSearchSuggestions(open);
  const items = useMemo(() => {
    const rawItems = data?.pages.flatMap((p) => p.items ?? []) ?? [];
    return filterSearchResults(rawItems, debounced, quickFilter);
  }, [data?.pages, debounced, quickFilter]);
  const showSuggestions = debounced.length < 2;
  const navSlugs = useMemo(
    () =>
      showSuggestions ? suggestions.map((s) => s.slug) : items.slice(0, 12).map((m) => m.slug),
    [showSuggestions, suggestions, items],
  );
  const navSlugsRef = useRef(navSlugs);
  navSlugsRef.current = navSlugs;
  const debouncedRef = useRef(debounced);
  debouncedRef.current = debounced;
  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced, quickFilter, showSuggestions]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      const slugs = navSlugsRef.current;
      if (slugs.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % slugs.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? slugs.length - 1 : i - 1));
      } else if (e.key === "Enter" && activeIndexRef.current >= 0) {
        e.preventDefault();
        const slug = slugs[activeIndexRef.current];
        if (!slug) return;
        if (debouncedRef.current.length >= 2) pushRecentSearch(debouncedRef.current);
        onClose();
        void navigate({ to: "/movie/$slug", params: { slug } });
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, navigate]);
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);
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
            activeIndex={activeIndex}
            onResultClick={handleResultClick}
          />
        ) : (
          <SearchResultsPanel
            debounced={debounced}
            quickFilter={quickFilter}
            isFetching={isFetching}
            items={items}
            activeIndex={activeIndex}
            onResultClick={handleResultClick}
          />
        )}
      </div>
      <p className="border-t border-white/5 px-4 py-2 text-center text-[11px] text-netflix-muted/70">
        {t("search.keyboardHint")}
      </p>
    </SearchModalShell>
  );
}
