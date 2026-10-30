import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import { danmakuApi, type DanmakuItem } from "@/services/platform/danmaku.service";

/** Comments are fetched in windows of this many seconds (current + next). */
export const DANMAKU_WINDOW_SEC = 120;

/**
 * Time-coded comments around the playhead for one episode, plus a sender that
 * shows the viewer's own comment right away.
 */
export function useDanmaku(
  movieSlug: string | undefined,
  episodeName: string | undefined,
  time: number,
  enabled: boolean,
) {
  const qc = useQueryClient();

  const active = enabled && !!movieSlug && !!episodeName;

  const windowIdx = Math.floor(Math.max(0, time) / DANMAKU_WINDOW_SEC);

  const windows = useQueries({
    queries: [windowIdx, windowIdx + 1].map((w) => ({
      queryKey: queryKeys.danmaku.window(movieSlug ?? "", episodeName ?? "", w),
      queryFn: () =>
        danmakuApi.list(
          movieSlug!,
          episodeName!,
          w * DANMAKU_WINDOW_SEC,
          (w + 1) * DANMAKU_WINDOW_SEC,
        ),
      enabled: active,
      staleTime: CACHE_TTL.twoMinutes,
      retry: 0,
    })),
  });

  const [own, setOwn] = useState<DanmakuItem[]>([]);

  const items = useMemo(() => {
    const all = windows.flatMap((w) => w.data ?? []);

    return all.sort((a, b) => a.playback_time - b.playback_time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows[0]?.data, windows[1]?.data]);

  const send = useCallback(
    async (content: string, at: number) => {
      if (!movieSlug || !episodeName) return;

      const created = await danmakuApi.create({
        movieSlug,
        episodeName,
        time: at,
        content,
      });

      setOwn((prev) => [...prev.slice(-20), created]);

      // Keep it for rewinds without refetching.
      qc.setQueryData<DanmakuItem[]>(
        queryKeys.danmaku.window(
          movieSlug,
          episodeName,
          Math.floor(created.playback_time / DANMAKU_WINDOW_SEC),
        ),
        (old) => (old ? [...old, created] : old),
      );
    },
    [movieSlug, episodeName, qc],
  );

  return { items: active ? items : [], own, send };
}
