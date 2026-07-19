import { useEffect, useRef } from "react";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export function usePlayerResume(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  useEmbed: boolean,
  initialTime: number,
  src: string,
  dispatch: React.Dispatch<PlayerUiAction>,
  onResumeApplied?: (sec: number) => void,
) {
  const resumeAppliedRef = useRef(false);

  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [src, initialTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || useEmbed || initialTime < 10) return;

    const applyResume = () => {
      if (resumeAppliedRef.current || !v.duration) return;
      const target = Math.min(initialTime, Math.max(0, v.duration - 3));
      if (target >= 10) {
        v.currentTime = target;
        dispatch({ type: "setProgress", progress: target });
        resumeAppliedRef.current = true;
        onResumeApplied?.(target);
      }
    };

    v.addEventListener("loadedmetadata", applyResume);
    if (v.readyState >= 1) applyResume();
    return () => v.removeEventListener("loadedmetadata", applyResume);
  }, [initialTime, useEmbed, onResumeApplied, src, videoRef, dispatch]);
}

export function usePlayerSeekEvent(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  useEmbed: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
) {
  useEffect(() => {
    if (useEmbed) return;
    const onSeekTo = (e: Event) => {
      const v = videoRef.current;
      if (!v) return;
      const detail = (e as CustomEvent<number>).detail;
      const target = typeof detail === "number" ? detail : 0;
      try {
        v.currentTime = Math.max(0, target);
        dispatch({ type: "setProgress", progress: v.currentTime });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("player:seekTo", onSeekTo as EventListener);
    return () => window.removeEventListener("player:seekTo", onSeekTo as EventListener);
  }, [useEmbed, videoRef, dispatch]);
}
