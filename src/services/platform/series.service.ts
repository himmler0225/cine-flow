import { platformFetch } from "@/lib/platformApi";

export type ReleasePattern = {
  /** 0 = Sunday … 6 = Saturday (Vietnam time). */
  weekdays: number[];
  /** Minutes after midnight, Vietnam time. */
  minuteOfDay: number;
  nextAt: string;
  confidence: "learned" | "guess";
};

export type ScheduleEntry = {
  slug: string;
  name: string;
  thumb_url: string;
  poster_url: string;
  episode_current: string;
  episode_total: string | null;
  last_release_at: string | null;
  pattern: ReleasePattern | null;
};

export type Wrapped = {
  year: number;
  total_seconds: number;
  episodes: number;
  titles: number;
  top_titles: {
    slug: string;
    name: string;
    thumb_url: string | null;
    seconds: number;
    episodes: number;
  }[];
  by_month: number[];
  by_hour: number[];
  peak_hour: number | null;
  peak_weekday: number | null;
  longest_streak_days: number;
  active_days: number;
  top_genres: string[];
  top_countries: string[];
  comments: number;
  danmaku: number;
  ratings: number;
  favorites_added: number;
};

export const seriesApi = {
  schedule: () => platformFetch<ScheduleEntry[]>("/api/schedule"),
  wrapped: (year: number) => platformFetch<Wrapped>(`/api/wrapped?year=${year}`),
};
