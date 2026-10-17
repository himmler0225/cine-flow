import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import {
  momentsApi,
  type MomentsHeatmap,
  type ReactionEmoji,
} from "@/services/platform/moments.service";

/** Reaction heatmap for one episode, plus a sender that bumps it optimistically. */
export function useMoments(movieSlug: string | undefined, episodeName: string | undefined) {
  const qc = useQueryClient();

  const enabled = !!movieSlug && !!episodeName;

  const key = useMemo(
    () => queryKeys.moments.heatmap(movieSlug ?? "", episodeName ?? ""),
    [movieSlug, episodeName],
  );

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => momentsApi.heatmap(movieSlug!, episodeName!),
    enabled,
    staleTime: CACHE_TTL.twoMinutes,
    retry: 0,
  });

  const react = useCallback(
    (emoji: ReactionEmoji, time: number) => {
      if (!movieSlug || !episodeName) return;

      qc.setQueryData<MomentsHeatmap>(key, (old) => {
        if (!old) return old;

        const start = Math.floor(time / old.bucket_seconds) * old.bucket_seconds;

        const existing = old.buckets.find((b) => b.start === start);

        const buckets = existing
          ? old.buckets.map((b) =>
              b === existing ? { ...b, reactions: b.reactions + 1, score: b.score + 1 } : b,
            )
          : [...old.buckets, { start, reactions: 1, danmaku: 0, score: 1, top_emoji: emoji }].sort(
              (a, b) => a.start - b.start,
            );

        return { ...old, buckets };
      });

      void momentsApi.react({ movieSlug, episodeName, time, emoji }).catch(() => {});
    },
    [movieSlug, episodeName, qc, key],
  );

  return { heatmap: data, react };
}
