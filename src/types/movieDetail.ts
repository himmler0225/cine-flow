import type { DetailResponse, MovieListItem } from "@/types/movie";
import type { EpisodeProgressInfo } from "@/components/player/EpisodeList";

export interface MovieDetailTabsProps {
  slug: string;
  movie: DetailResponse["movie"];
  episodes: DetailResponse["episodes"];
  related?: MovieListItem[];
  relatedLoading?: boolean;
  progressByEpisode?: Record<string, EpisodeProgressInfo>;
}

export type MovieDetailTab = "episodes" | "trailer" | "cast" | "similar" | "comments";

export function getDefaultDetailTab(
  episodes: DetailResponse["episodes"],
  hasTrailer: boolean,
): MovieDetailTab {
  if (episodes.length > 0) return "episodes";
  if (hasTrailer) return "trailer";
  return "cast";
}
