import { useEffect } from "react";
import { isEmbedUrl } from "@/utils/player";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export function usePlayerEmbedMode(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  embedSrc: string,
  shouldUseEmbed: boolean,
  useEmbed: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
) {
  useEffect(() => {
    dispatch({ type: "reset", useEmbed: shouldUseEmbed });
  }, [src, embedSrc, shouldUseEmbed, dispatch]);

  useEffect(() => {
    if ((!src || isEmbedUrl(src)) && embedSrc) {
      dispatch({ type: "setUseEmbed", useEmbed: true });
    }
  }, [src, embedSrc, dispatch]);

  useEffect(() => {
    if (useEmbed || !embedSrc) return;
    const timer = window.setTimeout(() => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration) || v.duration === 0) {
        dispatch({ type: "setUseEmbed", useEmbed: true });
      }
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [src, embedSrc, useEmbed, videoRef, dispatch]);
}
