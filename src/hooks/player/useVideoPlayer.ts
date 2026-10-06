import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/settingsStore";
import { useHydrated } from "@/hooks/useHydrated";
import { usePremium } from "@/hooks/usePremium";
import {
  isEmbedUrl,
  readSkipAdsPreference,
  resolvePlayableSrc,
  writeSkipAdsPreference,
} from "@/utils/player";
import { createInitialPlayerUi, playerUiReducer } from "@/hooks/player/playerReducer";
import type { UseVideoPlayerOptions } from "@/hooks/player/types";
import { usePlayerEmbedMode } from "@/hooks/player/usePlayerEmbedMode";
import { usePlayerHlsSource } from "@/hooks/player/usePlayerHlsSource";
import { usePlayerTelemetry, type SeekLock } from "@/hooks/player/usePlayerTelemetry";
import { usePlayerResume, usePlayerSeekEvent } from "@/hooks/player/usePlayerResume";
import { usePlayerKeyboard } from "@/hooks/player/usePlayerKeyboard";
import { createPlayerControls } from "@/hooks/player/usePlayerControls";
import { findActiveAdRange } from "@/lib/adRanges";

export function useVideoPlayer({
  src,
  embed,
  initialTime = 0,
  onEnded,
  onError,
  onProgress,
  onLiveTime,
  onResumeApplied,
  onNextEpisode,
}: UseVideoPlayerOptions) {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const { isPremium } = usePremium();

  const hydrated = useHydrated();

  // Persisted setting: keep the server-rendered player until hydrated (see useHydrated).
  const dataSaver = useSettingsStore((s) => s.dataSaver) && hydrated;

  const playableSrc = resolvePlayableSrc(src, embed);

  const embedSrc = embed || (isEmbedUrl(src) ? src : "");

  const preferEmbed = dataSaver && !!embedSrc;

  const videoRef = useRef<HTMLVideoElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const pendingSeekRef = useRef<number | null>(null);

  const blockEmbedFallbackRef = useRef(false);

  const seekLockRef = useRef<SeekLock | null>(null);

  const [preferNative, setPreferNative] = useState(false);

  const initialSkip = isPremium && readSkipAdsPreference();

  const [state, dispatch] = useReducer(
    playerUiReducer,
    {
      shouldUseEmbed: preferEmbed || (!playableSrc && !!embedSrc),
      skipAds: initialSkip,
    },
    ({ shouldUseEmbed: useEmbed, skipAds }) => createInitialPlayerUi(useEmbed, skipAds),
  );

  useEffect(() => {
    setPreferNative(false);

    blockEmbedFallbackRef.current = false;

    pendingSeekRef.current = null;

    seekLockRef.current = null;
  }, [playableSrc, embedSrc]);

  const shouldUseEmbed =
    !preferNative && (state.forceEmbed || preferEmbed || (!playableSrc && !!embedSrc));

  const onFallbackEmbed = useCallback(() => {
    setPreferNative(false);

    blockEmbedFallbackRef.current = false;

    pendingSeekRef.current = null;

    seekLockRef.current = null;

    dispatch({ type: "setForceEmbed", forceEmbed: true });
  }, []);

  // The profile (and so isPremium) loads after the player mounts: apply the saved
  // preference once it is known. The old effect wrote state.skipAds back to storage as soon
  // as isPremium flipped, overwriting the saved "on" with the initial "off" on every visit.
  useEffect(() => {
    dispatch({ type: "setSkipAds", skipAds: isPremium && readSkipAdsPreference() });
  }, [isPremium]);

  usePlayerEmbedMode(
    videoRef,
    playableSrc,
    embedSrc,
    shouldUseEmbed,
    state.useEmbed,
    dispatch,
    !preferNative,
  );

  const hls = usePlayerHlsSource(
    videoRef,
    playableSrc,
    embedSrc,
    state.useEmbed,
    state.skipAds,
    dispatch,
    onError,
    pendingSeekRef,
    onFallbackEmbed,
  );

  usePlayerTelemetry({
    videoRef,
    useEmbed: state.useEmbed,
    embedSrc,
    adRangesRef: hls.adRangesRef,
    skipAdsRef: hls.skipAdsRef,
    seekLockRef,
    blockEmbedFallbackRef,
    dispatch,
    onEnded,
    onError,
    onProgress,
    onLiveTime,
  });

  usePlayerResume(
    videoRef,
    state.useEmbed,
    preferNative || seekLockRef.current ? 0 : initialTime,
    playableSrc,
    dispatch,
    onResumeApplied,
    pendingSeekRef,
    seekLockRef,
  );

  usePlayerSeekEvent(videoRef, state.useEmbed, dispatch, seekLockRef);

  const { toggleFullscreen } = usePlayerKeyboard(
    videoRef,
    containerRef,
    state.useEmbed,
    dispatch,
    onNextEpisode,
  );

  const controls = createPlayerControls(
    videoRef,
    containerRef,
    state,
    dispatch,
    toggleFullscreen,
    (cur, dur) => {
      onLiveTime?.(cur, dur);

      onProgress?.(cur, dur);
    },
  );

  const setSkipAds = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === "function" ? updater(state.skipAds) : updater;

    if (next && !isPremium) {
      toast.message(t("player.skipAdsPremiumOnly"), {
        action: {
          label: t("premium.upgrade"),
          onClick: () => navigate({ to: "/premium" }),
        },
      });

      return;
    }

    controls.setSkipAds(next);

    // Persist only explicit choices.
    if (isPremium) writeSkipAdsPreference(next);
  };

  const activeAd = findActiveAdRange(state.progress, hls.adRangesRef.current);

  const skipCurrentAd = () => {
    const video = videoRef.current;

    const active = video ? findActiveAdRange(video.currentTime, hls.adRangesRef.current) : null;

    if (state.useEmbed || !video || !active) return;

    dispatch({ type: "incrementAdsSkipped", count: 1 });

    // Jump to the end of *this* ad break (used to always jump to a hard-coded 16:00).
    controls.seekTo(active.end + 0.1);

    void video.play().catch(() => {});
  };

  return {
    videoRef,
    containerRef,
    dataSaver,
    embedSrc,
    playableSrc,
    useEmbed: state.useEmbed,
    hasError: state.hasError,
    playing: state.playing,
    muted: state.muted,
    volume: state.volume,
    progress: state.progress,
    buffered: state.buffered,
    duration: state.duration,
    speed: state.speed,
    showSpeed: state.showSpeed,
    setShowSpeed: controls.setShowSpeed,
    skipAds: state.skipAds,
    setSkipAds,
    isPremium,
    adsSkipped: state.adsSkipped,
    activeAd,
    skipCurrentAd,
    useBackupPlayer: () => {
      setPreferNative(false);

      blockEmbedFallbackRef.current = false;

      seekLockRef.current = null;

      dispatch({ type: "setForceEmbed", forceEmbed: true });
    },
    levels: hls.levels,
    subtitleTracks: hls.subtitleTracks,
    currentLevel: hls.currentLevel,
    subtitleId: hls.subtitleId,
    selectQuality: hls.selectQuality,
    selectSubtitle: hls.selectSubtitle,
    toggleFullscreen: controls.toggleFullscreen,
    togglePiP: controls.togglePiP,
    seekTo: controls.seekTo,
    seekBy: controls.seekBy,
    setSpeedVal: controls.setSpeedVal,
    togglePlay: controls.togglePlay,
    toggleMute: controls.toggleMute,
    setVolumeVal: controls.setVolumeVal,
    retry: controls.retry,
    onNextEpisode,
  };
}
