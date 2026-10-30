import { platformFetch } from "@/lib/platformApi";

export const DANMAKU_MAX_LENGTH = 200;

export type DanmakuItem = {
  id: string;
  playback_time: number;
  user_id: string;
  username: string | null;
  content: string;
  created_at: string;
};

export const danmakuApi = {
  /** Comments with from <= playback_time < to. */
  list(movieSlug: string, episodeName: string, from: number, to: number) {
    const q = new URLSearchParams({
      episode: episodeName,
      from: String(from),
      to: String(to),
    });

    return platformFetch<DanmakuItem[]>(
      `/api/danmaku/movie/${encodeURIComponent(movieSlug)}?${q.toString()}`,
      { auth: false },
    );
  },
  create(input: { movieSlug: string; episodeName: string; time: number; content: string }) {
    return platformFetch<DanmakuItem>("/api/danmaku", {
      method: "POST",
      body: JSON.stringify({
        movie_slug: input.movieSlug,
        episode_name: input.episodeName,
        playback_time: Math.max(0, Math.round(input.time * 10) / 10),
        content: input.content.trim(),
      }),
    });
  },
};
