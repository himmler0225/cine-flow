import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { moviesApi } from "@/services/movies";
import { useTrackedSeriesSlugs } from "@/hooks/useTrackedSeriesSlugs";
import { queryKeys } from "@/constants/queryKeys";
import { CACHE_TTL } from "@/constants/timing";
import {
  getEpisodeSnapshots,
  setEpisodeSnapshot,
  getNotificationsReadAt,
  markNotificationsRead,
} from "@/utils/episodeSnapshots";

export type EpisodeNotification = {
  id: string;
  slug: string;
  name: string;
  thumb_url?: string;
  oldEpisode: string;
  newEpisode: string;
  at: number;
};

const SERIES_TYPES = new Set(["series", "hoathinh", "tvshows"]);

function isSeriesType(type?: string) {
  if (!type) return true;

  return SERIES_TYPES.has(type);
}

export function useEpisodeNotifications() {
  const trackedSlugs = useTrackedSeriesSlugs();

  const qc = useQueryClient();

  const [readAt, setReadAt] = useState(getNotificationsReadAt);

  const slugsKey = trackedSlugs.slice(0, 20).join(",");

  const { data: notifications = [], refetch } = useQuery({
    queryKey: queryKeys.episodeNotifications(slugsKey),
    enabled: trackedSlugs.length > 0,
    staleTime: CACHE_TTL.tenMinutes,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<EpisodeNotification[]> => {
      const snapshots = getEpisodeSnapshots();

      const out: EpisodeNotification[] = [];

      const toCheck = trackedSlugs.slice(0, 20);

      await Promise.all(
        toCheck.map(async (slug) => {
          try {
            const detail = await moviesApi.getMovieDetail(slug);

            const movie = detail.movie;

            if (!isSeriesType(movie.type)) return;

            const current = movie.episode_current ?? "";

            if (!current) return;

            const snap = snapshots[slug]?.episode;

            if (snap && snap !== current) {
              out.push({
                id: `${slug}-${current}`,
                slug,
                name: movie.name,
                thumb_url: movie.thumb_url || movie.poster_url,
                oldEpisode: snap,
                newEpisode: current,
                at: Date.now(),
              });
            }

            setEpisodeSnapshot(slug, current);
          } catch (error) {
            console.warn("[episode-notifications] check failed", slug, error);
          }
        }),
      );

      return out.sort((a, b) => b.at - a.at);
    },
  });

  const unreadCount = notifications.filter((n) => n.at > readAt).length;

  const markRead = useCallback(() => {
    markNotificationsRead();

    setReadAt(Date.now());

    void qc.invalidateQueries({ queryKey: ["episode-notifications"] });
  }, [qc]);

  useEffect(() => {
    if (trackedSlugs.length === 0) return;

    void refetch();
  }, [trackedSlugs.length, slugsKey, refetch]);

  return { notifications, unreadCount, markRead, refetch };
}
