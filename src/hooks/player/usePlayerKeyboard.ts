import { useEffect } from "react";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export function usePlayerKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  useEmbed: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
  onNextEpisode?: () => void,
) {
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
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
        v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 10);
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
