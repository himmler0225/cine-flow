import { useEffect } from "react";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";
import type { WebkitPresentationVideo } from "@/hooks/player/usePlayerControls";
import { PLAYER_SEEK_STEP_SEC } from "@/constants/timing";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

const screenOrientation = () =>
  typeof screen !== "undefined"
    ? (screen.orientation as LockableOrientation | undefined)
    : undefined;

export function usePlayerKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  useEmbed: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
  onNextEpisode?: () => void,
) {
  const toggleFullscreen = () => {
    const el = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;

    const video = videoRef.current as WebkitPresentationVideo | null;

    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void;
    };

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) void doc.exitFullscreen().catch(() => {});
      else doc.webkitExitFullscreen?.();

      screenOrientation()?.unlock?.();

      return;
    }

    if (el?.requestFullscreen) {
      void el
        .requestFullscreen()
        // Phones: rotate to landscape like native players (Android; ignored elsewhere).
        .then(() =>
          screenOrientation()
            ?.lock?.("landscape")
            .catch(() => {}),
        )
        .catch(() => video?.webkitEnterFullscreen?.());
    } else if (el?.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      // iPhone Safari cannot fullscreen arbitrary elements, only the <video> itself.
      video?.webkitEnterFullscreen?.();
    }
  };

  useEffect(() => {
    if (useEmbed) return;

    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const v = videoRef.current;

      if (!v) return;

      if (e.code === "Space") {
        e.preventDefault();

        if (v.paused) void v.play();
        else v.pause();
      } else if (e.key.toLowerCase() === "m") {
        v.muted = !v.muted;

        dispatch({ type: "setMuted", muted: v.muted });
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();

        toggleFullscreen();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();

        v.currentTime = Math.min(v.duration || Infinity, v.currentTime + PLAYER_SEEK_STEP_SEC);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();

        v.currentTime = Math.max(0, v.currentTime - PLAYER_SEEK_STEP_SEC);
      } else if (e.key.toLowerCase() === "n" && onNextEpisode) {
        e.preventDefault();

        onNextEpisode();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [useEmbed, onNextEpisode, videoRef, dispatch]);

  return { toggleFullscreen };
}
