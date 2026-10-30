import { platformFetch } from "@/lib/platformApi";
import type { MovieListItem } from "@/types/movie";

export type Recommendations = {
  items: MovieListItem[];
  genres: string[];
  countries: string[];
};

export const recommendationsApi = {
  forMe() {
    return platformFetch<Recommendations>("/api/recommendations");
  },
};
