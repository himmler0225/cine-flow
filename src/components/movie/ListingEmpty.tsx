import { Link } from "@tanstack/react-router";
import { Film, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGenres } from "@/hooks/useGenres";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListingEmptyProps = {
  title?: string;
  description?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  showGenreChips?: boolean;
  className?: string;
};

export function ListingEmpty({
  title,
  description,
  hasFilters,
  onClearFilters,
  showGenreChips = true,
  className,
}: ListingEmptyProps) {
  const { t } = useTranslation();
  const { data: genres } = useGenres();
  const chips = (genres ?? []).slice(0, 8);
  return (
    <div
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center md:px-12",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
        {hasFilters ? (
          <SearchX className="h-7 w-7 text-netflix-muted" />
        ) : (
          <Film className="h-7 w-7 text-netflix-muted" />
        )}
      </div>
      <h2 className="text-lg font-semibold text-white">
        {title ?? (hasFilters ? t("listing.emptyFilteredTitle") : t("listing.emptyTitle"))}
      </h2>
      <p className="mt-2 text-sm text-netflix-muted">
        {description ??
          (hasFilters ? t("listing.emptyFilteredDesc") : t("listing.emptyDescription"))}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters && (
          <Button
            type="button"
            size="sm"
            onClick={onClearFilters}
            className="bg-netflix-red text-white hover:bg-netflix-red-hover"
          >
            {t("filters.clearFilters")}
          </Button>
        )}
        <Link
          to="/"
          className="inline-flex h-8 items-center rounded-md border border-white/15 px-3 text-sm text-white hover:bg-white/10"
        >
          {t("common.home")}
        </Link>
      </div>
      {showGenreChips && chips.length > 0 && (
        <div className="mt-8 w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netflix-muted">
            {t("search.browseGenres")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((g) => (
              <Link
                key={g.slug}
                to="/genre/$slug"
                params={{ slug: g.slug }}
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
