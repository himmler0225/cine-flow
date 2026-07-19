import { useEffect } from "react";
import Hls from "hls.js";

export function useSyncedHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  useIframe: boolean,
  onHlsFailed: () => void,
) {
  useEffect(() => {
    if (useIframe) return;
    const v = videoRef.current;
    if (!v || !src) return;

    let hls: Hls | null = null;
    const onNativeError = () => onHlsFailed();
    v.addEventListener("error", onNativeError);

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(v);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) onHlsFailed();
      });
    } else {
      v.src = src;
    }

    return () => {
      v.removeEventListener("error", onNativeError);
      hls?.destroy();
    };
  }, [src, useIframe, videoRef, onHlsFailed]);
}
