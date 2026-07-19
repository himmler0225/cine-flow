import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { attachHlsAdSkip } from "@/lib/hlsAdSkip";
import type { PlayerUiAction } from "@/hooks/player/playerReducer";

export function usePlayerHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  embedSrc: string,
  useEmbed: boolean,
  skipAds: boolean,
  dispatch: React.Dispatch<PlayerUiAction>,
  onError?: () => void,
) {
  const adRangesRef = useRef<{ start: number; end: number }[]>([]);
  const skipAdsRef = useRef(skipAds);

  useEffect(() => {
    skipAdsRef.current = skipAds;
  }, [skipAds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || useEmbed) return;

    dispatch({ type: "setHasError", hasError: false });
    adRangesRef.current = [];

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);

      if (skipAds) {
        attachHlsAdSkip(hls, adRangesRef, (count) =>
          dispatch({ type: "incrementAdsSkipped", count: typeof count === "number" ? count : 0 }),
        );
      }

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          console.error("[HLS fatal]", data.type, data.details);
          if (embedSrc) {
            dispatch({ type: "setUseEmbed", useEmbed: true });
          } else {
            dispatch({ type: "setHasError", hasError: true });
            onError?.();
          }
        }
      });
      return () => hls.destroy();
    }

    video.src = src;
  }, [src, embedSrc, useEmbed, onError, skipAds, videoRef, dispatch]);

  return { adRangesRef, skipAdsRef };
}
