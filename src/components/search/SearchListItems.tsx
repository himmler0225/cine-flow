import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, Heart, Search, TrendingUp } from "lucide-react";
import { SearchThumb } from "@/components/search/SearchThumb";
import { SOURCE_KEYS } from "@/components/search/constants";
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
  onClose,
}: {
  slug: string;
  name: string;
  thumb?: string;
  sub?: string;
  year?: number;
  quality?: string;
  source: keyof typeof SOURCE_KEYS;
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
        className="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-white/5"
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
          <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-black">
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
}: {
  movie: MovieListItem;
  onClose: () => void;
  eager: boolean;
}) {
  return (
    <li>
      <Link
        to="/movie/$slug"
        params={{ slug: movie.slug }}
        onClick={onClose}
        className="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-white/5"
      >
        <SearchThumb src={movie.thumb_url || movie.poster_url} eager={eager} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{movie.name}</p>
          <p className="truncate text-xs text-netflix-muted">
            {movie.origin_name} {movie.year && `• ${movie.year}`} {movie.lang && `• ${movie.lang}`}
          </p>
        </div>
        {movie.quality && (
          <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-black">
            {movie.quality}
          </span>
        )}
      </Link>
    </li>
  );
}
