import { platformFetch } from "@/lib/platformApi";

export const REACTION_EMOJIS = ["🔥", "😂", "😱", "😢", "❤️", "👏"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type HeatmapBucket = {
  start: number;
  reactions: number;
  danmaku: number;
  score: number;
  top_emoji: string | null;
};

export type MomentsHeatmap = {
  bucket_seconds: number;
  buckets: HeatmapBucket[];
  hot_moments: HeatmapBucket[];
};

export const momentsApi = {
  heatmap(movieSlug: string, episodeName: string): Promise<MomentsHeatmap> {
    return platformFetch<MomentsHeatmap>(
      `/api/moments/movie/${encodeURIComponent(movieSlug)}/heatmap?episode=${encodeURIComponent(episodeName)}`,
      { auth: false },
    );
  },
  react(input: { movieSlug: string; episodeName: string; time: number; emoji: ReactionEmoji }) {
    return platformFetch<{ ok: boolean }>("/api/moments/reactions", {
      method: "POST",
      body: JSON.stringify({
        movie_slug: input.movieSlug,
        episode_name: input.episodeName,
        time: Math.max(0, Math.round(input.time * 10) / 10),
        emoji: input.emoji,
      }),
    });
  },
};
