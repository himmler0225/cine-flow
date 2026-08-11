import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { clearRecentSearches } from "@/utils/searchHistory";
import { SearchSuggestionItem } from "@/components/search/SearchListItems";
import { useSearchModalStore } from "@/components/search/store/searchModalStore";
import { useGenres } from "@/hooks/useGenres";

type Suggestion = {
  slug: string;
  name: string;
  thumb_url?: string;
  poster_url?: string;
  origin_name?: string;
  year?: number;
  quality?: string;
  source: "history" | "favorite" | "trending" | "recent";
};

type Props = {
  recentSearches: string[];
  suggestions: Suggestion[];
  activeIndex: number;
  onResultClick: () => void;
};

export function SearchSuggestionsPanel({
  recentSearches,
  suggestions,
  activeIndex,
  onResultClick,
}: Props) {
  const { t } = useTranslation();

  const setQ = useSearchModalStore((s) => s.setQ);

  const { data: genres } = useGenres();

  if (recentSearches.length === 0 && suggestions.length === 0) {
    const chips = (genres ?? []).slice(0, 8);

    return (
      <div className="px-3 py-6 text-center">
        <p className="text-sm text-netflix-muted">{t("common.minChars")}</p>
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

  return (
    <>
      {recentSearches.length > 0 && (
        <div className="mb-4 px-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-netflix-muted">
              {t("search.recent")}
            </p>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-[11px] text-netflix-red hover:underline"
            >
              {t("search.clearRecent")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQ(s)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white hover:border-netflix-red"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="px-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-netflix-muted">
            {t("search.suggestionsForYou")}
          </p>
          <ul className="divide-y divide-white/5">
            {suggestions.map((s, i) => (
              <SearchSuggestionItem
                key={`${s.source}-${s.slug}`}
                slug={s.slug}
                name={s.name}
                thumb={s.thumb_url || s.poster_url}
                sub={s.origin_name}
                year={s.year}
                quality={s.quality}
                source={s.source}
                active={i === activeIndex}
                onClose={onResultClick}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
