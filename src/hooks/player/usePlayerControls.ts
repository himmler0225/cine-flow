import type { Dispatch } from "react";
import type { PlayerUiAction, PlayerUiState } from "@/hooks/player/playerReducer";

export type WebkitPresentationVideo = HTMLVideoElement & {
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitPresentationMode?: string;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitEnterFullscreen?: () => void;
};

/** PiP through the standard API or iOS Safari's presentation modes. */
export function canUsePictureInPicture(video: HTMLVideoElement | null): boolean {
  if (typeof document === "undefined" || !video) return false;

  const v = video as WebkitPresentationVideo;

  return (
    Boolean(document.pictureInPictureEnabled) ||
    Boolean(v.webkitSupportsPresentationMode?.("picture-in-picture"))
  );
}

export function createPlayerControls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  state: PlayerUiState,
  dispatch: Dispatch<PlayerUiAction>,
  toggleFullscreen: () => void,
  onSeekCommit?: (currentSec: number, durationSec: number) => void,
) {
  const togglePiP = async () => {
    const v = videoRef.current as WebkitPresentationVideo | null;

    if (!v) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (
        document.pictureInPictureEnabled &&
        typeof v.requestPictureInPicture === "function"
      ) {
        await v.requestPictureInPicture();
      } else if (v.webkitSetPresentationMode) {
        // iOS Safari without the standard API.
        v.webkitSetPresentationMode(
          v.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture",
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Absolute seek, committed once (the scrubber calls it on release). The old range input
   * seeked and saved progress to the API on every drag frame.
   */
  const seekTo = (time: number) => {
    const v = videoRef.current;

    if (!v || !Number.isFinite(time)) return;

    const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : state.duration;

    const next = dur ? Math.min(Math.max(0, time), Math.max(0, dur - 0.25)) : Math.max(0, time);

    try {
      v.currentTime = next;
    } catch {
      return;
    }

    dispatch({ type: "setProgress", progress: next });

    if (dur && Number.isFinite(dur)) onSeekCommit?.(next, dur);
  };

  const seekBy = (deltaSec: number) => seekTo((videoRef.current?.currentTime ?? 0) + deltaSec);

  const setSpeedVal = (s: number) => {
    const v = videoRef.current;

    if (!v) return;

    v.playbackRate = s;

    dispatch({ type: "setSpeed", speed: s });

    dispatch({ type: "setShowSpeed", showSpeed: false });
  };

  const togglePlay = () => {
    const v = videoRef.current;

    if (!v) return;

    if (v.paused) void v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;

    if (!v) return;

    v.muted = !v.muted;

    dispatch({ type: "setMuted", muted: v.muted });
  };

  const setVolumeVal = (val: number) => {
    dispatch({ type: "setVolume", volume: val });

    const v = videoRef.current;

    if (!v) return;

    v.volume = val;

    v.muted = val === 0;

    dispatch({ type: "setMuted", muted: val === 0 });
  };

  const retry = () => {
    dispatch({ type: "setHasError", hasError: false });

    videoRef.current?.load();
  };

  const setShowSpeed = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === "function" ? updater(state.showSpeed) : updater;

    dispatch({ type: "setShowSpeed", showSpeed: next });
  };

  const setSkipAds = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === "function" ? updater(state.skipAds) : updater;

    dispatch({ type: "setSkipAds", skipAds: next });
  };

  return {
    toggleFullscreen,
    togglePiP,
    seekTo,
    seekBy,
    setSpeedVal,
    togglePlay,
    toggleMute,
    setVolumeVal,
    retry,
    setShowSpeed,
    setSkipAds,
  };
}
