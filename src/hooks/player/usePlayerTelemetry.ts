import { useEffect } from "react";
import { skipAdRangesAtTime } from "@/lib/hlsAdSkip";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

type Args = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  useEmbed: boolean;
  embedSrc: string;
  adRangesRef: React.MutableRefObject<{ start: number; end: number }[]>;
  skipAdsRef: React.MutableRefObject<boolean>;
  dispatch: React.Dispatch<PlayerUiAction>;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
};

export function usePlayerTelemetry({
  videoRef,
  useEmbed,
  embedSrc,
  adRangesRef,
  skipAdsRef,
  dispatch,
  onEnded,
  onError,
  onProgress,
}: Args) {
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let lastSaved = 0;
    const flush = () => {
      if (onProgress && v.duration && v.currentTime > 5) {
        onProgress(v.currentTime, v.duration);
        lastSaved = Date.now();
      }
    };

    const onTime = () => {
      const cur = v.currentTime;
      dispatch({ type: "setProgress", progress: cur });
      if (v.buffered.length) {
        dispatch({ type: "setBuffered", buffered: v.buffered.end(v.buffered.length - 1) });
      }
      const now = Date.now();
      if (onProgress && v.duration && now - lastSaved > 10000) {
        lastSaved = now;
        onProgress(cur, v.duration);
      }
      if (skipAdsRef.current && adRangesRef.current.length > 0) {
        skipAdRangesAtTime(v, adRangesRef.current, () =>
          dispatch({ type: "incrementAdsSkipped", count: 1 }),
        );
      }
    };

    const onMeta = () => {
      dispatch({ type: "setDuration", duration: v.duration });
      if (onProgress && v.duration && Number.isFinite(v.duration)) {
        const cur = Number.isFinite(v.currentTime) ? v.currentTime : 0;
        onProgress(cur, v.duration);
        lastSaved = Date.now();
      }
    };

    const onPlay = () => dispatch({ type: "setPlaying", playing: true });
    const onPause = () => {
      dispatch({ type: "setPlaying", playing: false });
      flush();
    };
    const onEnd = () => onEnded?.();
    const onVidError = () => {
      if (embedSrc && !useEmbed) {
        dispatch({ type: "setUseEmbed", useEmbed: true });
        return;
      }
      if (!useEmbed) {
        dispatch({ type: "setHasError", hasError: true });
        onError?.();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onVidError);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onVidError);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      flush();
    };
  }, [
    onEnded,
    onProgress,
    onError,
    embedSrc,
    useEmbed,
    videoRef,
    adRangesRef,
    skipAdsRef,
    dispatch,
  ]);
}
