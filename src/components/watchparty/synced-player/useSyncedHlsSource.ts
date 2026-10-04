import { useEffect } from "react";
import Hls from "hls.js";
import { shouldUseNativeHls } from "@/lib/hlsEngine";
import { useLatestRef } from "@/hooks/useLatestRef";

export function useSyncedHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  useIframe: boolean,
  onHlsFailed: () => void,
  onReady?: () => void,
) {
  // Read through refs: SyncedPlayer passes an inline onHlsFailed, so depending on it tore
  // down and reloaded the stream on every room re-render (chat, presence, sync ticks).
  const onHlsFailedRef = useLatestRef(onHlsFailed);

  const onReadyRef = useLatestRef(onReady);

  useEffect(() => {
    if (useIframe) return;

    const v = videoRef.current;

    if (!v || !src) return;

    let hls: Hls | null = null;

    const onNativeError = () => onHlsFailedRef.current();

    const onNativeReady = () => onReadyRef.current?.();

    v.addEventListener("error", onNativeError);

    v.addEventListener("loadedmetadata", onNativeReady);

    if (shouldUseNativeHls(v)) {
      v.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });

      hls.loadSource(src);

      hls.attachMedia(v);

      hls.on(Hls.Events.MANIFEST_PARSED, () => onReadyRef.current?.());

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) onHlsFailedRef.current();
      });
    } else {
      v.src = src;
    }

    return () => {
      v.removeEventListener("error", onNativeError);

      v.removeEventListener("loadedmetadata", onNativeReady);

      hls?.destroy();
    };
  }, [src, useIframe, videoRef, onHlsFailedRef, onReadyRef]);
}
