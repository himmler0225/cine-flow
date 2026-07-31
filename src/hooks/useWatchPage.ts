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
import { AUTO_ADVANCE_SECONDS, UI_DELAY_MS } from "@/constants/timing";

export function useWatchPage(slug: string, tap: number, server: number, fromStart: boolean) {
  const navigate = useNavigate();
  const { data, isLoading } = useMovieDetail(slug);
  const { saveProgress, getLastEpisode, getEpisodeProgress, history } = useWatchHistory();
  const resumeToastShown = useRef(false);
  const failoverAttempts = useRef(0);
  const analyticsTracked = useRef<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<{
    episodeName: string;
    progressSec: number;
    durationSec: number;
  } | null>(null);
  const movie = data?.movie;
  const servers = useMemo(() => data?.episodes ?? [], [data]);
  const [serverIdx, setServerIdx] = useState(server);
  const [episodeIdx, setEpisodeIdx] = useState(Math.max(0, tap - 1));
  const [autoAdvanceSecondsLeft, setAutoAdvanceSecondsLeft] = useState<number | null>(null);
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
  }, [servers.length, fromStart]);
  const currentServer = servers[serverIdx];
  const currentEp = currentServer?.server_data[episodeIdx];
  const episodeProgress = useMemo(() => {
    if (!currentEp) return null;
    return getEpisodeProgress(slug, currentEp.name);
  }, [currentEp, getEpisodeProgress, slug, history]);
  const progressByEpisode = useMemo(() => {
    const out: Record<
      string,
      {
        ratio: number;
        finished: boolean;
      }
    > = {};
    for (const h of history) {
      if (h.movie_slug !== slug) continue;
      const ratio = h.duration_sec > 0 ? h.progress_sec / h.duration_sec : 0;
      out[h.episode_name] = {
        ratio,
        finished: isWatchFinished(h.progress_sec, h.duration_sec),
      };
    }
    if (liveProgress && liveProgress.durationSec > 0) {
      const ratio = liveProgress.progressSec / liveProgress.durationSec;
      const prev = out[liveProgress.episodeName];
      out[liveProgress.episodeName] = {
        ratio: Math.max(prev?.ratio ?? 0, ratio),
        finished:
          isWatchFinished(liveProgress.progressSec, liveProgress.durationSec) ||
          prev?.finished === true,
      };
    }
    return out;
  }, [history, slug, liveProgress]);
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
    setAutoAdvanceSecondsLeft(null);
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
  }, [serverIdx, episodeIdx, currentEp?.slug, movie, navigate, slug]);
  const handleLiveTime = useCallback(
    (cur: number, dur: number) => {
      if (!currentEp) return;
      if (!Number.isFinite(cur) || !Number.isFinite(dur) || dur <= 0) return;
      setLiveProgress({
        episodeName: currentEp.name,
        progressSec: Math.max(0, cur),
        durationSec: dur,
      });
    },
    [currentEp],
  );
  const handleProgress = useCallback(
    (cur: number, dur: number) => {
      if (!currentEp || !movie) return;
      if (!Number.isFinite(cur) || !Number.isFinite(dur) || dur <= 0) return;
      handleLiveTime(cur, dur);
      if (cur < 5 && !isWatchFinished(cur, dur)) return;
      void saveProgress({
        movie_slug: slug,
        movie_name: movie.name,
        thumb_url: getImageUrl(movie.poster_url || movie.thumb_url) || null,
        episode_name: currentEp.name,
        episode_index: episodeIdx,
        server_index: serverIdx,
        progress_sec: Math.round(cur),
        duration_sec: Math.round(dur),
        watched_at: new Date().toISOString(),
      });
      const trackKey = `${slug}:${currentEp.name}`;
      if (cur >= 30 && analyticsTracked.current !== trackKey) {
        analyticsTracked.current = trackKey;
        void import("@/services/platform/analytics.service").then(({ analyticsApi }) =>
          analyticsApi.trackWatchEvent({
            movieSlug: slug,
            movieName: movie.name,
            thumbUrl: getImageUrl(movie.poster_url || movie.thumb_url) || undefined,
            episodeName: currentEp.name,
            serverName: currentServer?.server_name,
            watchDurationSec: Math.round(cur),
            completed: isWatchFinished(cur, dur),
            lang: movie.lang,
            quality: movie.quality,
          }),
        );
      }
    },
    [
      currentEp,
      movie,
      slug,
      episodeIdx,
      serverIdx,
      saveProgress,
      currentServer?.server_name,
      handleLiveTime,
    ],
  );
  const handleEnded = () => {
    if (!currentServer) return;
    if (episodeIdx < currentServer.server_data.length - 1) {
      setAutoAdvanceSecondsLeft(AUTO_ADVANCE_SECONDS);
    }
  };
  useEffect(() => {
    if (autoAdvanceSecondsLeft == null) return;
    if (autoAdvanceSecondsLeft <= 0) {
      setAutoAdvanceSecondsLeft(null);
      setEpisodeIdx((i) => i + 1);
      return;
    }
    const id = window.setTimeout(() => {
      setAutoAdvanceSecondsLeft((s) => (s == null ? null : s - 1));
    }, UI_DELAY_MS.countdownTick);
    return () => window.clearTimeout(id);
  }, [autoAdvanceSecondsLeft]);
  const cancelAutoAdvance = useCallback(() => setAutoAdvanceSecondsLeft(null), []);
  const confirmAutoAdvance = useCallback(() => {
    setAutoAdvanceSecondsLeft(null);
    setEpisodeIdx((i) => i + 1);
  }, []);
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
    nextEp,
    autoAdvanceSecondsLeft,
    cancelAutoAdvance,
    confirmAutoAdvance,
    handleProgress,
    handleLiveTime,
    handleEnded,
    handleNextEpisode,
    handleResumeApplied,
    tryAlternateSource,
    progressByEpisode,
  };
}
