import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, Heart, Search, TrendingUp } from "lucide-react";
import { SearchThumb } from "@/components/search/SearchThumb";
import { SOURCE_KEYS } from "@/components/search/constants";
import { qualityBadgeClass } from "@/components/movie/MetaBadges";
import { cn } from "@/lib/utils";
import type { MovieListItem } from "@/types/movie";

const SOURCE_ICONS = {
  history: Clock,
  favorite: Heart,
  trending: TrendingUp,
  recent: Search,
} as const;

export function SearchSuggestionItem({
  slug,
  name,
  thumb,
  sub,
  year,
  quality,
  source,
  active,
  onClose,
}: {
  slug: string;
  name: string;
  thumb?: string;
  sub?: string;
  year?: number;
  quality?: string;
  source: keyof typeof SOURCE_KEYS;
  active?: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const Icon = SOURCE_ICONS[source];
  return (
    <li>
      <Link
        to="/movie/$slug"
        params={{ slug }}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded px-3 py-2 transition-colors",
          active ? "bg-white/10 ring-1 ring-netflix-red/40" : "hover:bg-white/5",
        )}
      >
        <SearchThumb src={thumb} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <p className="truncate text-xs text-netflix-muted">
            {sub} {year ? `• ${year}` : ""}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-netflix-muted">
          <Icon className="h-3 w-3" /> {t(SOURCE_KEYS[source])}
        </span>
        {quality && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold",
              qualityBadgeClass(quality),
            )}
          >
            {quality}
          </span>
        )}
      </Link>
    </li>
  );
}

export function SearchResultItem({
  movie,
  onClose,
  eager,
  active,
}: {
  movie: MovieListItem;
  onClose: () => void;
  eager: boolean;
  active?: boolean;
}) {
  return (
    <li>
      <Link
        to="/movie/$slug"
        params={{ slug: movie.slug }}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded px-3 py-2 transition-colors",
          active ? "bg-white/10 ring-1 ring-netflix-red/40" : "hover:bg-white/5",
        )}
      >
        <SearchThumb src={movie.thumb_url || movie.poster_url} eager={eager} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{movie.name}</p>
          <p className="truncate text-xs text-netflix-muted">
            {movie.origin_name} {movie.year && `• ${movie.year}`} {movie.lang && `• ${movie.lang}`}
          </p>
        </div>
        {movie.quality && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold",
              qualityBadgeClass(movie.quality),
            )}
          >
            {movie.quality}
          </span>
        )}
      </Link>
    </li>
  );
}
