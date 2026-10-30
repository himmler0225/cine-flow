import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import {
  skipMarkersApi,
  type EpisodeSkipMarkers,
  type SkipKind,
} from "@/services/platform/skipMarkers.service";

export type ActiveSegment = { start: number; end: number; votes: number; mine: boolean };

/** Community intro/outro segments for one episode (the viewer's own mark wins for them). */
export function useSkipMarkers(movieSlug: string | undefined, episodeName: string | undefined) {
  const qc = useQueryClient();

  const enabled = !!movieSlug && !!episodeName;

  const key = useMemo(
    () => queryKeys.skipMarkers.episode(movieSlug ?? "", episodeName ?? ""),
    [movieSlug, episodeName],
  );

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => skipMarkersApi.get(movieSlug!, episodeName!),
    enabled,
    staleTime: CACHE_TTL.fiveMinutes,
    retry: 0,
  });

  const segment = useCallback(
    (kind: SkipKind): ActiveSegment | null => {
      const mine = data?.mine[kind];

      if (mine) return { ...mine, votes: data?.[kind]?.votes ?? 1, mine: true };

      const agreed = data?.[kind];

      return agreed ? { ...agreed, mine: false } : null;
    },
    [data],
  );

  const mark = useCallback(
    async (kind: SkipKind, start: number, end: number) => {
      if (!movieSlug || !episodeName) return;

      const next = await skipMarkersApi.mark({ movieSlug, episodeName, kind, start, end });

      qc.setQueryData<EpisodeSkipMarkers>(key, next);
    },
    [movieSlug, episodeName, qc, key],
  );

  const unmark = useCallback(
    async (kind: SkipKind) => {
      if (!movieSlug || !episodeName) return;

      const next = await skipMarkersApi.unmark(movieSlug, episodeName, kind);

      qc.setQueryData<EpisodeSkipMarkers>(key, next);
    },
    [movieSlug, episodeName, qc, key],
  );

  return {
    data,
    intro: segment("intro"),
    outro: segment("outro"),
    mark,
    unmark,
  };
}
