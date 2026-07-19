import { useEffect, useReducer, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { isEmbedUrl, readSkipAdsPreference, writeSkipAdsPreference } from "@/utils/player";
import { createInitialPlayerUi, playerUiReducer } from "@/hooks/player/playerReducer";
import type { UseVideoPlayerOptions } from "@/hooks/player/types";
import { usePlayerEmbedMode } from "@/hooks/player/usePlayerEmbedMode";
import { usePlayerHlsSource } from "@/hooks/player/usePlayerHlsSource";
import { usePlayerTelemetry } from "@/hooks/player/usePlayerTelemetry";
import { usePlayerResume, usePlayerSeekEvent } from "@/hooks/player/usePlayerResume";
import { usePlayerKeyboard } from "@/hooks/player/usePlayerKeyboard";
import { createPlayerControls } from "@/hooks/player/usePlayerControls";

export function useVideoPlayer({
  src,
  embed,
  initialTime = 0,
  onEnded,
  onError,
  onProgress,
  onResumeApplied,
  onNextEpisode,
}: UseVideoPlayerOptions) {
  const dataSaver = useSettingsStore((s) => s.dataSaver);
  const embedSrc = embed || (isEmbedUrl(src) ? src : "");
  const preferEmbed = dataSaver && !!embedSrc;
  const shouldUseEmbed = preferEmbed || (!!embedSrc && (!src || isEmbedUrl(src)));

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(
    playerUiReducer,
    { shouldUseEmbed, skipAds: readSkipAdsPreference() },
    ({ shouldUseEmbed: useEmbed, skipAds }) => createInitialPlayerUi(useEmbed, skipAds),
  );

  useEffect(() => {
    writeSkipAdsPreference(state.skipAds);
  }, [state.skipAds]);

  usePlayerEmbedMode(videoRef, src, embedSrc, shouldUseEmbed, state.useEmbed, dispatch);

  const { adRangesRef, skipAdsRef } = usePlayerHlsSource(
    videoRef,
    src,
    embedSrc,
    state.useEmbed,
    state.skipAds,
    dispatch,
    onError,
  );

  usePlayerTelemetry({
    videoRef,
    useEmbed: state.useEmbed,
    embedSrc,
    adRangesRef,
    skipAdsRef,
    dispatch,
    onEnded,
    onError,
    onProgress,
  });

  usePlayerResume(videoRef, state.useEmbed, initialTime, src, dispatch, onResumeApplied);
  usePlayerSeekEvent(videoRef, state.useEmbed, dispatch);

  const { toggleFullscreen } = usePlayerKeyboard(
    videoRef,
    containerRef,
    state.useEmbed,
    dispatch,
    onNextEpisode,
  );

  const controls = createPlayerControls(videoRef, containerRef, state, dispatch, toggleFullscreen);

  return {
    videoRef,
    containerRef,
    dataSaver,
    embedSrc,
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
    setSkipAds: controls.setSkipAds,
    adsSkipped: state.adsSkipped,
    toggleFullscreen: controls.toggleFullscreen,
    togglePiP: controls.togglePiP,
    seek: controls.seek,
    setSpeedVal: controls.setSpeedVal,
    togglePlay: controls.togglePlay,
    toggleMute: controls.toggleMute,
    setVolumeVal: controls.setVolumeVal,
    retry: controls.retry,
    onNextEpisode,
  };
}
