import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { useWatchHistory } from "@/hooks/user/useWatchHistory";
import { usePlayerStore } from "@/store/playerStore";
import { getImageUrl } from "@/lib/movie/movieImages";
import { formatTime } from "@/utils/formatTime";
import { isWatchFinished } from "@/utils/watchProgress";
import { prefetchUrl } from "@/utils/prefetch";

export function useWatchPage(slug: string, tap: number, server: number, fromStart: boolean) {
  const navigate = useNavigate();
  const { data, isLoading } = useMovieDetail(slug);
  const { saveProgress, getLastEpisode, getEpisodeProgress, history } = useWatchHistory();
  const resumeToastShown = useRef(false);
  const failoverAttempts = useRef(0);

  const movie = data?.movie;
  const servers = useMemo(() => data?.episodes ?? [], [data]);

  const [serverIdx, setServerIdx] = useState(server);
  const [episodeIdx, setEpisodeIdx] = useState(Math.max(0, tap - 1));
  const stored = getLastEpisode(slug);

  useEffect(() => {
    if (servers.length === 0 || fromStart) return;
    if (tap === 1 && server === 0 && stored) {
      const sIdx = Math.min(Math.max(stored.server_index, 0), servers.length - 1);
      const eIdx = servers[sIdx]?.server_data.findIndex((e) => e.name === stored.episode_name);
      if (eIdx != null && eIdx >= 0) {
        setServerIdx(sIdx);
        setEpisodeIdx(eIdx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers.length, fromStart]);

  const currentServer = servers[serverIdx];
  const currentEp = currentServer?.server_data[episodeIdx];

  const episodeProgress = useMemo(() => {
    if (!currentEp) return null;
    return getEpisodeProgress(slug, currentEp.name);
  }, [currentEp, getEpisodeProgress, slug, history]);

  /** Bản đồ tiến độ theo tên tập của bộ phim hiện tại — dùng để vẽ progress bar trên EpisodeList */
  const progressByEpisode = useMemo(() => {
    const out: Record<string, { ratio: number; finished: boolean }> = {};
    for (const h of history) {
      if (h.movie_slug !== slug) continue;
      const ratio = h.duration_sec > 0 ? h.progress_sec / h.duration_sec : 0;
      out[h.episode_name] = {
        ratio,
        finished: isWatchFinished(h.progress_sec, h.duration_sec),
      };
    }
    return out;
  }, [history, slug]);

  const initialTime = useMemo(() => {
    if (fromStart || !episodeProgress) return 0;
    const { progress_sec, duration_sec } = episodeProgress;
    if (progress_sec < 10) return 0;
    if (isWatchFinished(progress_sec, duration_sec)) return 0;
    return progress_sec;
  }, [fromStart, episodeProgress]);

  const showResumeToast = useCallback((sec: number) => {
    if (resumeToastShown.current || sec < 10) return;
    resumeToastShown.current = true;
    toast(t("toast.resumeFromQ", { time: formatTime(sec) }), {
      duration: 6000,
      action: {
        label: t("player.startOver"),
        onClick: () => {
          window.dispatchEvent(new CustomEvent("player:seekTo", { detail: 0 }));
        },
      },
    });
  }, []);

  const handleResumeApplied = (sec: number) => {
    showResumeToast(sec);
  };

  useEffect(() => {
    resumeToastShown.current = false;
    failoverAttempts.current = 0;
  }, [currentEp?.slug, serverIdx]);

  useEffect(() => {
    if (!fromStart && initialTime >= 10) {
      showResumeToast(initialTime);
    }
  }, [fromStart, initialTime, currentEp?.slug, showResumeToast]);

  useEffect(() => {
    if (!currentEp || !movie) return;
    navigate({
      to: "/watch/$slug",
      params: { slug },
      search: { tap: episodeIdx + 1, server: serverIdx, fromStart: false },
      replace: true,
    });
    const existing = getEpisodeProgress(slug, currentEp.name);
    void saveProgress({
      movie_slug: slug,
      movie_name: movie.name,
      thumb_url: getImageUrl(movie.poster_url || movie.thumb_url) || null,
      episode_name: currentEp.name,
      episode_index: episodeIdx,
      server_index: serverIdx,
      progress_sec: existing?.progress_sec ?? 0,
      duration_sec: existing?.duration_sec ?? 0,
      watched_at: new Date().toISOString(),
    });
    usePlayerStore.getState().saveProgress({
      slug,
      name: movie.name,
      poster: movie.poster_url || movie.thumb_url,
      episodeSlug: currentEp.slug,
      episodeName: currentEp.name,
      serverIndex: serverIdx,
      episodeIndex: episodeIdx,
      updatedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverIdx, episodeIdx, currentEp?.slug]);

  const handleProgress = (cur: number, dur: number) => {
    if (!currentEp || !movie) return;
    void saveProgress({
      movie_slug: slug,
      movie_name: movie.name,
      thumb_url: getImageUrl(movie.poster_url || movie.thumb_url) || null,
      episode_name: currentEp.name,
      episode_index: episodeIdx,
      server_index: serverIdx,
      progress_sec: cur,
      duration_sec: dur,
      watched_at: new Date().toISOString(),
    });
  };

  const handleEnded = () => {
    if (!currentServer) return;
    if (episodeIdx < currentServer.server_data.length - 1) {
      setEpisodeIdx((i) => i + 1);
    }
  };

  const handleNextEpisode = () => {
    if (!currentServer) return;
    if (episodeIdx < currentServer.server_data.length - 1) {
      setEpisodeIdx((i) => i + 1);
    } else {
      toast.message(t("toast.lastEpisode"));
    }
  };

  const tryAlternateSource = useCallback(() => {
    if (servers.length === 0) return;

    failoverAttempts.current += 1;
    if (failoverAttempts.current > servers.length * 2) {
      toast.error(t("toast.noServers"));
      return;
    }

    for (let offset = 1; offset < servers.length; offset++) {
      const s = (serverIdx + offset) % servers.length;
      const ep = servers[s]?.server_data[episodeIdx];
      if (ep && (ep.link_m3u8 || ep.link_embed)) {
        setServerIdx(s);
        toast.info(
          t("toast.switchedServer", {
            server: servers[s]?.server_name ?? t("movie.server", { index: s + 1 }),
          }),
          { duration: 3000 },
        );
        return;
      }
    }

    toast.error(t("toast.noAlternateServer"));
  }, [servers, serverIdx, episodeIdx]);

  const hasNext = !!currentServer && episodeIdx < currentServer.server_data.length - 1;
  const nextEp = hasNext ? currentServer?.server_data[episodeIdx + 1] : null;

  useEffect(() => {
    if (!nextEp?.link_m3u8) return;
    return prefetchUrl(nextEp.link_m3u8);
  }, [nextEp?.link_m3u8, episodeIdx, serverIdx]);

  return {
    movie,
    servers,
    serverIdx,
    setServerIdx,
    episodeIdx,
    setEpisodeIdx,
    currentServer,
    currentEp,
    initialTime,
    fromStart,
    isLoading,
    hasNext,
    handleProgress,
    handleEnded,
    handleNextEpisode,
    handleResumeApplied,
    tryAlternateSource,
    progressByEpisode,
  };
}
