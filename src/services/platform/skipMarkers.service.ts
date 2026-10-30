import { platformFetch } from "@/lib/platformApi";

export type SkipKind = "intro" | "outro";

export type SkipSegment = { start: number; end: number; votes: number };

export type EpisodeSkipMarkers = {
  intro: SkipSegment | null;
  outro: SkipSegment | null;
  /** The viewer's own marks (used for them even before others agree). */
  mine: Partial<Record<SkipKind, { start: number; end: number }>>;
};

const base = (slug: string) => `/api/skip-markers/movie/${encodeURIComponent(slug)}`;

export const skipMarkersApi = {
  get(movieSlug: string, episodeName: string) {
    return platformFetch<EpisodeSkipMarkers>(
      `${base(movieSlug)}?episode=${encodeURIComponent(episodeName)}`,
    );
  },
  mark(input: {
    movieSlug: string;
    episodeName: string;
    kind: SkipKind;
    start: number;
    end: number;
  }) {
    return platformFetch<EpisodeSkipMarkers>("/api/skip-markers", {
      method: "POST",
      body: JSON.stringify({
        movie_slug: input.movieSlug,
        episode_name: input.episodeName,
        kind: input.kind,
        start_sec: Math.round(input.start * 10) / 10,
        end_sec: Math.round(input.end * 10) / 10,
      }),
    });
  },
  unmark(movieSlug: string, episodeName: string, kind: SkipKind) {
    const q = new URLSearchParams({ episode: episodeName, kind });

    return platformFetch<EpisodeSkipMarkers>(`${base(movieSlug)}?${q.toString()}`, {
      method: "DELETE",
    });
  },
};
