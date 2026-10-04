import { useEffect } from "react";
import Hls from "hls.js";
import { shouldUseNativeHls } from "@/lib/hlsEngine";

export function useSyncedHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  useIframe: boolean,
  onHlsFailed: () => void,
  onReady?: () => void,
) {
  useEffect(() => {
    if (useIframe) return;

    const v = videoRef.current;

    if (!v || !src) return;

    let hls: Hls | null = null;

    const onNativeError = () => onHlsFailed();

    const onNativeReady = () => onReady?.();

    v.addEventListener("error", onNativeError);

    v.addEventListener("loadedmetadata", onNativeReady);

    if (shouldUseNativeHls(v)) {
      v.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });

      hls.loadSource(src);

      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => onReady?.());

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) onHlsFailed();
      });
    } else {
      v.src = src;
    }

    return () => {
      v.removeEventListener("error", onNativeError);

      v.removeEventListener("loadedmetadata", onNativeReady);

      hls?.destroy();
    };
  }, [src, useIframe, videoRef, onHlsFailed, onReady]);
}
