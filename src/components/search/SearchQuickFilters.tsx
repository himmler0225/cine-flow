import { useTranslation } from "react-i18next";
import { SEARCH_QUICK_FILTERS } from "@/lib/movie/movieFilters";
import { cn } from "@/lib/utils";
import { FILTER_LABEL_KEYS } from "@/components/search/constants";
import { useSearchModalStore } from "@/components/search/store/searchModalStore";

export function SearchQuickFilters() {
  const { t } = useTranslation();
  const quickFilter = useSearchModalStore((s) => s.quickFilter);
  const setQuickFilter = useSearchModalStore((s) => s.setQuickFilter);

  return (
    <div className="flex flex-wrap gap-2 border-b border-white/5 px-4 py-2">
      {SEARCH_QUICK_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setQuickFilter(f.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            quickFilter === f.id
              ? "bg-netflix-red text-white"
              : "bg-white/10 text-netflix-muted hover:bg-white/15 hover:text-white",
          )}
        >
          {f.id === "fhd" ? "FHD" : t(FILTER_LABEL_KEYS[f.id])}
        </button>
      ))}
    </div>
  );
}
