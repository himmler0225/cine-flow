import type { Dispatch } from "react";
import type { PlayerUiAction, PlayerUiState } from "@/hooks/player/playerReducer";

export function createPlayerControls(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  state: PlayerUiState,
  dispatch: Dispatch<PlayerUiAction>,
  toggleFullscreen: () => void,
  onSeekCommit?: (currentSec: number, durationSec: number) => void,
) {
  const togglePiP = async () => {
    const v = videoRef.current;

    if (!v) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await (
          v as HTMLVideoElement & {
            requestPictureInPicture(): Promise<PictureInPictureWindow>;
          }
        ).requestPictureInPicture();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;

    if (!v) return;

    const next = Number(e.target.value);

    v.currentTime = next;

    dispatch({ type: "setProgress", progress: next });

    if (v.duration && Number.isFinite(v.duration)) {
      onSeekCommit?.(next, v.duration);
    }
  };

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
    seek,
    setSpeedVal,
    togglePlay,
    toggleMute,
    setVolumeVal,
    retry,
    setShowSpeed,
    setSkipAds,
  };
}
