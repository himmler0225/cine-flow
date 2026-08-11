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

export type MovieDetailTab = "episodes" | "cast" | "similar" | "comments";

export function getDefaultDetailTab(episodes: DetailResponse["episodes"]): MovieDetailTab {
  if (episodes.length > 0) return "episodes";

  return "cast";
}
