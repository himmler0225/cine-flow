import { useEffect } from "react";
import { useLatestRef } from "@/hooks/useLatestRef";
import { skipAdRangesAtTime } from "@/lib/hlsAdSkip";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export type SeekLock = {
  minTime: number;
  until: number;
};

type Args = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  useEmbed: boolean;
  embedSrc: string;
  adRangesRef: React.MutableRefObject<
    {
      start: number;
      end: number;
    }[]
  >;
  skipAdsRef: React.MutableRefObject<boolean>;
  seekLockRef?: React.MutableRefObject<SeekLock | null>;
  blockEmbedFallbackRef?: React.MutableRefObject<boolean>;
  dispatch: React.Dispatch<PlayerUiAction>;
  onEnded?: () => void;
  onError?: () => void;
  onProgress?: (currentSec: number, durationSec: number) => void;
  onLiveTime?: (currentSec: number, durationSec: number) => void;
};

export function usePlayerTelemetry({
  videoRef,
  useEmbed,
  embedSrc,
  adRangesRef,
  skipAdsRef,
  seekLockRef,
  blockEmbedFallbackRef,
  dispatch,
  onEnded,
  onError,
  onProgress,
  onLiveTime,
}: Args) {
  // Callbacks are read through refs: re-running this effect on every new callback identity
  // made its cleanup flush() -> onLiveTime -> parent setState -> new callbacks -> re-run,
  // an infinite render loop (React #185) as soon as playback started.
  const onEndedRef = useLatestRef(onEnded);

  const onErrorRef = useLatestRef(onError);

  const onProgressRef = useLatestRef(onProgress);

  const onLiveTimeRef = useLatestRef(onLiveTime);

  useEffect(() => {
    const v = videoRef.current;

    if (!v) return;

    let lastSaved = 0;

    const flush = () => {
      if (!v.duration || !Number.isFinite(v.duration)) return;

      onLiveTimeRef.current?.(v.currentTime, v.duration);

      const onProgress = onProgressRef.current;

      if (onProgress && v.currentTime > 5) {
        onProgress(v.currentTime, v.duration);

        lastSaved = Date.now();
      }
    };

    const enforceLock = () => {
      const lock = seekLockRef?.current;

      if (!lock || Date.now() > lock.until) return false;

      if (v.currentTime < lock.minTime - 0.35) {
        try {
          v.currentTime = lock.minTime;
        } catch {}

        dispatch({ type: "setProgress", progress: lock.minTime });

        return true;
      }

      return false;
    };

    const onTime = () => {
      if (enforceLock()) return;

      const cur = v.currentTime;

      dispatch({ type: "setProgress", progress: cur });

      if (v.buffered.length) {
        dispatch({
          type: "setBuffered",
          buffered: v.buffered.end(v.buffered.length - 1),
        });
      }

      const onLiveTime = onLiveTimeRef.current;

      if (onLiveTime && v.duration && Number.isFinite(v.duration)) {
        onLiveTime(cur, v.duration);
      }

      const onProgress = onProgressRef.current;

      const now = Date.now();

      if (onProgress && v.duration && cur > 5 && now - lastSaved > 3000) {
        lastSaved = now;

        onProgress(cur, v.duration);
      }

      if (skipAdsRef.current) {
        skipAdRangesAtTime(v, adRangesRef.current, () =>
          dispatch({ type: "incrementAdsSkipped", count: 1 }),
        );
      }
    };

    const onMeta = () => {
      dispatch({ type: "setDuration", duration: v.duration });

      enforceLock();

      const cur = Number.isFinite(v.currentTime) ? v.currentTime : 0;

      const onProgress = onProgressRef.current;

      if (onProgress && v.duration && Number.isFinite(v.duration) && cur > 5) {
        onProgress(cur, v.duration);

        lastSaved = Date.now();
      }
    };

    const onPlay = () => dispatch({ type: "setPlaying", playing: true });

    const onPause = () => {
      dispatch({ type: "setPlaying", playing: false });

      flush();
    };

    const onSeeked = () => {
      enforceLock();

      dispatch({ type: "setProgress", progress: v.currentTime });

      flush();
    };

    const onSeeking = () => {
      enforceLock();
    };

    const onEnd = () => {
      const onProgress = onProgressRef.current;

      if (onProgress && v.duration && Number.isFinite(v.duration)) {
        onProgress(v.duration, v.duration);
      }

      onEndedRef.current?.();
    };

    const onVidError = () => {
      if (embedSrc && !useEmbed) {
        if (blockEmbedFallbackRef) {
          blockEmbedFallbackRef.current = false;
        }

        dispatch({ type: "setUseEmbed", useEmbed: true });

        return;
      }

      if (!useEmbed) {
        dispatch({ type: "setHasError", hasError: true });

        onErrorRef.current?.();
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

    v.addEventListener("seeked", onSeeked);

    v.addEventListener("seeking", onSeeking);

    v.addEventListener("ended", onEnd);

    v.addEventListener("error", onVidError);

    document.addEventListener("visibilitychange", onVisibility);

    window.addEventListener("pagehide", onPageHide);

    return () => {
      v.removeEventListener("timeupdate", onTime);

      v.removeEventListener("loadedmetadata", onMeta);

      v.removeEventListener("play", onPlay);

      v.removeEventListener("pause", onPause);

      v.removeEventListener("seeked", onSeeked);

      v.removeEventListener("seeking", onSeeking);

      v.removeEventListener("ended", onEnd);

      v.removeEventListener("error", onVidError);

      document.removeEventListener("visibilitychange", onVisibility);

      window.removeEventListener("pagehide", onPageHide);

      flush();
    };
  }, [
    onEndedRef,
    onErrorRef,
    onProgressRef,
    onLiveTimeRef,
    embedSrc,
    useEmbed,
    videoRef,
    adRangesRef,
    skipAdsRef,
    seekLockRef,
    blockEmbedFallbackRef,
    dispatch,
  ]);
}
