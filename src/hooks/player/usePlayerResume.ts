import { useEffect, useRef } from "react";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";
import type { SeekLock } from "@/hooks/player/usePlayerTelemetry";

export function usePlayerResume(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  useEmbed: boolean,
  initialTime: number,
  src: string,
  dispatch: React.Dispatch<PlayerUiAction>,
  onResumeApplied?: (sec: number) => void,
  pendingSeekRef?: React.MutableRefObject<number | null>,
  seekLockRef?: React.MutableRefObject<SeekLock | null>,
) {
  const resumeAppliedRef = useRef(false);
  useEffect(() => {
    resumeAppliedRef.current = false;
  }, [src, initialTime]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || useEmbed) return;

    const applySeek = (target: number) => {
      if (!v.duration || !Number.isFinite(v.duration)) return false;
      const clamped = Math.min(Math.max(0, target), Math.max(0, v.duration - 1));
      try {
        v.currentTime = clamped;
        dispatch({ type: "setProgress", progress: clamped });
        void v.play().catch(() => {});
        return true;
      } catch {
        return false;
      }
    };

    const applyResume = () => {
      const lock = seekLockRef?.current;
      if (lock && Date.now() < lock.until) {
        const target = Math.max(lock.minTime, pendingSeekRef?.current ?? lock.minTime);
        applySeek(target);
        resumeAppliedRef.current = true;
        return;
      }

      const pending = pendingSeekRef?.current;
      if (pending != null && pending >= 0) {
        if (applySeek(pending)) {
          if (pendingSeekRef) pendingSeekRef.current = null;
          resumeAppliedRef.current = true;
          onResumeApplied?.(pending);
        }
        return;
      }

      if (resumeAppliedRef.current || initialTime < 10) return;
      const target = Math.min(initialTime, Math.max(0, v.duration - 3));
      if (target >= 10 && applySeek(target)) {
        resumeAppliedRef.current = true;
        onResumeApplied?.(target);
      }
    };

    v.addEventListener("loadedmetadata", applyResume);
    v.addEventListener("canplay", applyResume);
    if (v.readyState >= 1) applyResume();
    return () => {
      v.removeEventListener("loadedmetadata", applyResume);
      v.removeEventListener("canplay", applyResume);
    };
  }, [
    initialTime,
    useEmbed,
    onResumeApplied,
    src,
    videoRef,
    dispatch,
    pendingSeekRef,
    seekLockRef,
  ]);
}

export function usePlayerSeekEvent(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  useEmbed: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
  seekLockRef?: React.MutableRefObject<SeekLock | null>,
) {
  useEffect(() => {
    if (useEmbed) return;
    const onSeekTo = (e: Event) => {
      const v = videoRef.current;
      if (!v) return;
      const lock = seekLockRef?.current;
      if (lock && Date.now() < lock.until) return;
      const detail = (e as CustomEvent<number>).detail;
      const target = typeof detail === "number" ? detail : 0;
      try {
        v.currentTime = Math.max(0, target);
        dispatch({ type: "setProgress", progress: v.currentTime });
      } catch {
        /* best-effort seek — setting currentTime can throw on some browsers/readyStates */
      }
    };
    window.addEventListener("player:seekTo", onSeekTo as EventListener);
    return () => window.removeEventListener("player:seekTo", onSeekTo as EventListener);
  }, [useEmbed, videoRef, dispatch, seekLockRef]);
}
